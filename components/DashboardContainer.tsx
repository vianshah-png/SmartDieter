'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Client, DietTemplate } from '../types';
import { getClientDetails } from '../app/actions/client';
import { getDietTemplatesAction } from '../app/actions/template';
import { auditDietPlan, AuditResponse } from '../app/actions/audit-diet';
import { ClientProfile } from '../lib/types/audit-schema';
import { Header } from './navigation/Header';
import { DietSidebar } from './client/DietSidebar';
import { AuditPanel } from './audit/AuditPanel';
import { AuditOverlay } from './audit/AuditOverlay';
import { TemplateSelector } from './audit/TemplateSelector';

import { getAllRecipesAction, Recipe } from '../app/actions/recipe';
import { RecipeModal } from './recipes/RecipeModal';

export default function DashboardContainer() {
    const [clientData, setClientData] = useState<Client | null>(null);
    const [allTemplates, setAllTemplates] = useState<DietTemplate[]>([]);
    const [currentTemplate, setCurrentTemplate] = useState<DietTemplate | null>(null);
    const [isTemplateListOpen, setIsTemplateListOpen] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditProgress, setAuditProgress] = useState('');

    // Template Pagination State
    const [templatePage, setTemplatePage] = useState(1);
    const [totalTemplateCount, setTotalTemplateCount] = useState(0); // total pages from API
    const [isLoadingMoreTemplates, setIsLoadingMoreTemplates] = useState(false);

    // Recipe State
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isRecipesLoading, setIsRecipesLoading] = useState(false);
    const [recipePage, setRecipePage] = useState(1);
    const [totalRecipeCount, setTotalRecipeCount] = useState(0);
    const [isLoadingMoreRecipes, setIsLoadingMoreRecipes] = useState(false);

    // Audit State
    const [auditError, setAuditError] = useState<string>('');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [templateSearchQuery, setTemplateSearchQuery] = useState('');
    // useTransition for non-blocking pending states
    const [isSearchPending, startSearchTransition] = useTransition();
    const [isTemplatesPending, startTemplatesTransition] = useTransition();

    // Error/Status State
    const [searchError, setSearchError] = useState('');

    // --- AUTO-FETCH TEMPLATES ON PAGE LOAD ---
    useEffect(() => {
        const loadInitialTemplates = async () => {
            startTemplatesTransition(async () => {
                try {
                    const result = await getDietTemplatesAction(1, 50, '');
                    setAllTemplates(result.templates);
                    setTotalTemplateCount(result.totalPages);
                    setTemplatePage(1);
                    console.log(`[Dashboard] Auto-loaded ${result.templates.length} templates (${result.totalPages} total pages)`);
                } catch (e) {
                    console.error("Failed to auto-load templates", e);
                }
            });
        };
        loadInitialTemplates();
    }, []);

    // --- DATA FETCHING ---

    const handleCreateDietOpen = () => {
        setIsTemplateListOpen(true);
        // Templates are already loaded on page load — no lazy fetch needed
    };

    const handleTemplateSearch = (query: string) => {
        setTemplateSearchQuery(query);
        startTemplatesTransition(async () => {
            try {
                const result = await getDietTemplatesAction(1, 50, query);
                setAllTemplates(result.templates);
                setTotalTemplateCount(result.totalPages);
                setTemplatePage(1);
            } catch (e) {
                console.error("Failed to search templates", e);
            }
        });
    };

    const handleLoadMoreTemplates = async () => {
        if (isLoadingMoreTemplates) return;
        setIsLoadingMoreTemplates(true);
        const nextPage = templatePage + 1;
        try {
            const result = await getDietTemplatesAction(nextPage, 50, templateSearchQuery);
            setAllTemplates(prev => [...prev, ...result.templates]);
            setTotalTemplateCount(result.totalPages);
            setTemplatePage(nextPage);
            console.log(`[Dashboard] Loaded page ${nextPage}: ${result.templates.length} more templates`);
        } catch (e) {
            console.error("Failed to load more templates", e);
        } finally {
            setIsLoadingMoreTemplates(false);
        }
    };

    const handleOpenRecipes = async () => {
        setIsRecipeModalOpen(true);
        if (recipes.length === 0) {
            setIsRecipesLoading(true);
            try {
                const result = await getAllRecipesAction(1, 50);
                setRecipes(result.recipes);
                setTotalRecipeCount(result.totalCount);
                setRecipePage(1);
                console.log(`[Dashboard] Loaded ${result.recipes.length} recipes (${result.totalCount} total)`);
            } catch (e) {
                console.error("Failed to load recipes", e);
            } finally {
                setIsRecipesLoading(false);
            }
        }
    };

    const handleLoadMoreRecipes = async () => {
        if (isLoadingMoreRecipes) return;
        setIsLoadingMoreRecipes(true);
        const nextPage = recipePage + 1;
        try {
            const result = await getAllRecipesAction(nextPage, 50);
            setRecipes(prev => [...prev, ...result.recipes]);
            setTotalRecipeCount(result.totalCount);
            setRecipePage(nextPage);
            console.log(`[Dashboard] Loaded recipe page ${nextPage}: ${result.recipes.length} more recipes`);
        } catch (e) {
            console.error("Failed to load more recipes", e);
        } finally {
            setIsLoadingMoreRecipes(false);
        }
    };

    // --- HANDLERS ---

    const handleSearchClient = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        const query = searchQuery.trim();
        if (!query) return;

        setSearchError('');

        startSearchTransition(async () => {
            try {
                const client = await getClientDetails(query);
                if (client) {
                    setClientData(client);
                    // Reset audit when client changes
                    setAuditError('');
                } else {
                    setSearchError(`No client found for ID "${query}". Verify the User ID and try again.`);
                    setClientData(null);
                }
            } catch (err) {
                console.error(err);
                setSearchError('Failed to fetch client. Check server logs.');
            }
        });
    };

    const handleSelectTemplate = (template: DietTemplate) => {
        setCurrentTemplate(template);
        setIsTemplateListOpen(false);
        // Reset audit when template changes
        setAuditError('');
    };

    const runAudit = async () => {
        if (!currentTemplate || !clientData) {
            console.warn('[Dashboard] Cannot run audit: Missing template or client data');
            return;
        }

        console.log('[Dashboard] Starting audit for:', {
            clientId: clientData.id,
            templateId: currentTemplate.id,
            templateName: currentTemplate.name
        });

        setIsAuditing(true);
        setAuditProgress('Initializing audit pipeline...');
        setAuditError('');

        try {
            setAuditProgress('Analyzing client profile against diet template...');
            console.log('[Dashboard] Calling auditDietPlan server action...');

            // Extract meal sections from the dashboard template to pass directly
            const mealSections = (currentTemplate.sections || []).map(section => ({
                title: section.title,
                htmlContent: section.options?.[0]?.[0]?.description || '',
            })).filter(s => s.htmlContent.trim() !== '');

            console.log(`[Dashboard] Passing ${mealSections.length} meal sections to audit`);

            // Create override object from current UI state
            const clientOverride: Partial<ClientProfile> = {
                allergies: clientData.allergies,
                food_aversions: clientData.aversions,
                medical_conditions: clientData.medicalIssues,
                diet_preference: clientData.foodPreference as any,
                age: clientData.age,
                gender: clientData.gender,
            };

            // Call the complete audit orchestrator with direct template data
            const response: AuditResponse = await auditDietPlan(
                clientData.id,
                currentTemplate.id,
                currentTemplate.name,
                mealSections,
                clientOverride
            );

            console.log('[Dashboard] Received audit response:', {
                success: response.success,
                conflictCount: response.conflictCount,
                hasUpdatedSections: !!response.updatedSections
            });

            if (!response.success) {
                console.error('[Dashboard] Audit failed:', response.error);
                setAuditError(response.error?.message || 'Audit failed');
                setAuditProgress('');
                return;
            }

            // Apply the colored content directly to the template
            if (response.updatedSections && response.updatedSections.length > 0) {
                console.log('[Dashboard] Applying colored conflicts to template');

                // Map conflicts to specific dish IDs for the UI badges
                const mappedAnalysis = response.auditResult?.conflicts.map(c => {
                    let matchedDishId = c.dish_name; // Fallback

                    // Try to find the actual dish ID in the template structure
                    for (const sec of currentTemplate.sections) {
                        for (const optGroup of sec.options) {
                            for (const dish of optGroup) {
                                // Match if the conflict dish name is found in the description or name
                                if (dish.description.toLowerCase().includes(c.dish_name.toLowerCase()) ||
                                    dish.name.toLowerCase() === c.dish_name.toLowerCase()) {
                                    matchedDishId = dish.id;
                                    break;
                                }
                            }
                        }
                    }

                    return {
                        optionId: matchedDishId,
                        isSafe: false,
                        conflicts: [c.conflicting_ingredient],
                        conflictType: c.conflict_type === 'allergy' ? 'DIRECT_MATCH' as const : 'IMPLIED_INGREDIENT' as const,
                        reasoning: `${c.conflict_type}: ${c.conflicting_ingredient} (${c.reason || 'Violation'})`,
                    };
                });

                const updatedTemplate = {
                    ...currentTemplate,
                    savedAnalysis: mappedAnalysis,
                    sections: currentTemplate.sections.map(section => {
                        const updatedSection = response.updatedSections?.find(
                            us => us.title.toLowerCase() === section.title.toLowerCase()
                        );

                        if (updatedSection && section.options[0]?.[0]) {
                            console.log(`[Dashboard] Updating section "${section.title}" with highlighted content length: ${updatedSection.replacedContent.length}`);
                            return {
                                ...section,
                                options: [[{
                                    ...section.options[0][0],
                                    description: updatedSection.replacedContent
                                }]]
                            };
                        }
                        return section;
                    })
                };

                console.log('[Dashboard] Sample updated description:', updatedTemplate.sections[0].options[0][0].description.substring(0, 100));
                setCurrentTemplate(updatedTemplate);
                console.log('[Dashboard] Template now shows colored conflicts inline');
            }

            if (response.conflictCount === 0) {
                setAuditProgress('✅ No conflicts found!');
            } else {
                setAuditProgress(`⚠️ ${response.conflictCount} conflict(s) highlighted in template`);
            }

        } catch (err) {
            console.error("[Dashboard] Audit failed with exception:", err);
            setAuditError(err instanceof Error ? err.message : 'Unknown error occurred');
            setAuditProgress('Audit failed. Check server console.');
        } finally {
            setIsAuditing(false);
            setTimeout(() => setAuditProgress(''), 5000);
        }
    };

    // --- RENDER ---

    const handleUpdateClient = (field: keyof Client, value: any) => {
        if (!clientData) return;
        setClientData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    return (
        <div className="flex flex-col w-screen h-screen bg-[#F0F2F5] text-[11px] font-sans overflow-hidden">
            <Header
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearching={isSearchPending}
                onSearch={handleSearchClient}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* 1. Left Sidebar REMOVED - Client info consolidated to Right Sidebar */}


                {/* 2. Main Content Area */}
                <main className="flex-1 flex flex-col bg-[#F0F2F5] shrink-0 overflow-hidden relative">
                    {!clientData ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl opacity-30">
                                🔍
                            </div>
                            <div className="max-w-md space-y-2">
                                <h2 className="text-xl font-bold text-gray-400">Ready to Audit</h2>
                                <p className="text-gray-400 text-sm">
                                    Enter a valid Client ID (e.g., <b>132127</b>) in the top search bar and press Enter to load their profile and diet plan.
                                </p>
                            </div>

                            {isSearchPending && (
                                <div className="flex flex-col items-center gap-2 text-blue-500 font-bold mt-4">
                                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    <span className="text-xs">Fetching Client Data...</span>
                                </div>
                            )}

                            {searchError && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium max-w-sm">
                                    ⚠️ {searchError}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button className="bg-blue-500 text-white font-bold px-4 py-1.5 rounded shadow-sm">TRACKER</button>
                                    <button className="bg-gray-200 text-gray-600 font-bold px-4 py-1.5 rounded">CHAT</button>
                                    <button onClick={handleOpenRecipes} className="bg-gray-200 text-gray-600 font-bold px-4 py-1.5 rounded hover:bg-gray-300">RECIPES</button>
                                </div>
                            </div>

                            <div className="px-4 py-1 border-b border-gray-200 bg-white flex items-center gap-6">
                                <button className="py-2.5 text-blue-500 font-bold border-b-2 border-blue-500">Current Session</button>
                                <button className="py-2.5 text-gray-500 font-bold">Weight</button>
                                <button className="py-2.5 text-gray-500 font-bold">Inch</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {/* Template loading state */}
                                {isTemplatesPending && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                        <p className="text-gray-400 text-xs">Loading diet templates...</p>
                                    </div>
                                )}

                                <AuditPanel
                                    currentTemplate={currentTemplate}
                                    runAudit={runAudit}
                                    isAuditing={isAuditing}
                                    onUpdateTemplate={setCurrentTemplate}
                                />

                                {/* Display audit error if any */}
                                {auditError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="font-bold text-red-800 text-xs mb-1">Audit Failed</p>
                                        <p className="text-red-700 text-[10px]">{auditError}</p>
                                    </div>
                                )}

                                {/* No separate results panel — conflicts are shown inline in the template */}

                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-[#F8FAFC]">
                                        <span className="font-bold text-gray-800">Weight Tracker</span>
                                    </div>
                                    <div className="h-24 flex items-center justify-center text-gray-400 font-medium">No Data Available</div>
                                </div>
                            </div>
                        </>
                    )}
                </main>

                {/* 3. Right Sidebar: Diet/Tools - Show if client data exists */}
                {clientData ? (
                    <DietSidebar
                        clientData={clientData}
                        onCreateDiet={handleCreateDietOpen}
                        onUpdateClient={handleUpdateClient}
                    />
                ) : (
                    <aside className="w-[60px] bg-white border-l border-gray-200 flex flex-col items-center py-4 gap-4 opacity-40">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </aside>
                )}
            </div>

            <TemplateSelector
                isOpen={isTemplateListOpen}
                onClose={() => setIsTemplateListOpen(false)}
                templates={allTemplates}
                onSelect={handleSelectTemplate}
                isLoading={isTemplatesPending}
                onLoadMore={handleLoadMoreTemplates}
                isLoadingMore={isLoadingMoreTemplates}
                hasMore={templatePage < totalTemplateCount}
                searchQuery={templateSearchQuery}
                onSearch={handleTemplateSearch}
            />

            <AuditOverlay isAuditing={isAuditing} progress={auditProgress} />

            <RecipeModal
                isOpen={isRecipeModalOpen}
                onClose={() => setIsRecipeModalOpen(false)}
                recipes={recipes}
                isLoading={isRecipesLoading}
                onLoadMore={handleLoadMoreRecipes}
                isLoadingMore={isLoadingMoreRecipes}
                hasMore={recipes.length < totalRecipeCount}
                totalCount={totalRecipeCount}
            />
        </div>
    );
}
