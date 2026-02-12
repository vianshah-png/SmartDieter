import React, { useState } from 'react';
import { DietTemplate } from '../../types';

interface AuditPanelProps {
    currentTemplate: DietTemplate | null;
    runAudit: () => void;
    isAuditing: boolean;
    onUpdateTemplate: (template: DietTemplate) => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ currentTemplate, runAudit, isAuditing, onUpdateTemplate }) => {
    const [editingDishId, setEditingDishId] = useState<string | null>(null);
    const [editHtml, setEditHtml] = useState('');

    if (!currentTemplate) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                Select a Diet Template from the Right Sidebar
            </div>
        );
    }

    const handleEditClick = (dishId: string, currentContent: string) => {
        setEditingDishId(dishId);
        setEditHtml(currentContent);
    };

    const handleSave = (sectionIndex: number, optionGroupIndex: number, dishIndex: number) => {
        const updatedTemplate = { ...currentTemplate };
        const updatedSections = [...updatedTemplate.sections];
        const updatedSection = { ...updatedSections[sectionIndex] };
        const updatedOptions = [...updatedSection.options];
        const updatedOptionGroup = [...updatedOptions[optionGroupIndex]];

        updatedOptionGroup[dishIndex] = {
            ...updatedOptionGroup[dishIndex],
            description: editHtml
        };

        updatedOptions[optionGroupIndex] = updatedOptionGroup;
        updatedSection.options = updatedOptions;
        updatedSections[sectionIndex] = updatedSection;
        updatedTemplate.sections = updatedSections;

        onUpdateTemplate(updatedTemplate);
        setEditingDishId(null);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-4 animate-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                    <h1 className="text-[16px] font-black text-blue-900 uppercase tracking-wide">{currentTemplate.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-400 text-[10px]">
                            Audit Status:
                            <span className={currentTemplate.savedAnalysis ? "text-green-600 font-bold ml-1" : "text-gray-500 ml-1"}>
                                {currentTemplate.savedAnalysis ? 'Audited' : 'Pending Audit'}
                            </span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={runAudit}
                    disabled={isAuditing}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700 disabled:opacity-50 transition-all text-xs"
                >
                    {isAuditing ? 'AUDITING...' : (currentTemplate.savedAnalysis ? 'RE-RUN AUDIT' : 'RUN AI AUDIT')}
                </button>
            </div>

            <div className="space-y-8">
                {currentTemplate.sections.map((sec, sIdx) => (
                    <div key={sIdx}>
                        <h3 className="font-bold text-blue-800 text-[13px] border-b border-blue-50 mb-3 pb-1 flex justify-between">
                            {sec.title}
                            <span className="text-[9px] text-gray-300 font-normal">Click description to edit</span>
                        </h3>
                        <div className="space-y-4">
                            {sec.options.map((optGroup, gIdx) => (
                                <div key={gIdx} className="space-y-3">
                                    {optGroup.map((dish, dIdx) => {
                                        const analysis = currentTemplate.savedAnalysis?.find(a => a.optionId === dish.id);
                                        const isUnsafe = analysis?.isSafe === false;
                                        const isEditing = editingDishId === dish.id;

                                        return (
                                            <div key={dish.id} className={`p-4 rounded-lg border transition-colors ${isUnsafe ? 'bg-red-50/30 border-red-100' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-gray-800 text-[12px]">{dish.name}</h4>
                                                        {isUnsafe && (
                                                            <span className="bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                                                CONFLICT DETECTED
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="mt-2">
                                                            <textarea
                                                                value={editHtml}
                                                                onChange={(e) => setEditHtml(e.target.value)}
                                                                className="w-full text-[11px] p-2 border border-blue-300 rounded bg-blue-50/10 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                                rows={4}
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2 mt-2">
                                                                <button
                                                                    onClick={() => setEditingDishId(null)}
                                                                    className="text-[10px] text-gray-500 hover:text-gray-700 px-3 py-1"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSave(sIdx, gIdx, dIdx)}
                                                                    className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded hover:bg-blue-700 font-bold"
                                                                >
                                                                    Save Changes
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="text-[11px] text-gray-500 mt-1 leading-relaxed cursor-text hover:text-gray-700 border border-transparent hover:border-gray-100 hover:bg-gray-50 rounded p-1 -ml-1 transition-all"
                                                            onClick={() => handleEditClick(dish.id, dish.description)}
                                                        >
                                                            <div dangerouslySetInnerHTML={{ __html: dish.description }} />
                                                            {dish.description.trim() === '' && (
                                                                <span className="text-gray-300 italic">Click to add description...</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Ingredients Tag */}
                                                    {dish.ingredients && dish.ingredients.length > 0 && (
                                                        <div className="mt-2 text-[10px] text-gray-400">
                                                            <span className="font-bold text-gray-500">Includes:</span> {dish.ingredients.join(', ')}
                                                        </div>
                                                    )}

                                                    {/* Conflict Reasons */}
                                                    {isUnsafe && analysis?.reasoning && (
                                                        <div className="mt-2 text-[10px] text-red-500 bg-red-50 p-2 rounded">
                                                            <span className="font-bold">⚠️ Issues:</span> {analysis.reasoning}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
