
import React, { useState } from 'react';
import { Recipe } from '../../app/actions/recipe';

interface RecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipes: Recipe[];
    isLoading: boolean;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    totalCount?: number;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
    isOpen,
    onClose,
    recipes,
    isLoading,
    onLoadMore,
    isLoadingMore,
    hasMore,
    totalCount,
}) => {
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filtered = recipes.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Recipes Directory
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Showing {recipes.length}{totalCount ? ` of ${totalCount}` : ''} recipes
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">✕</button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 bg-white sticky top-0">
                    <input
                        type="text"
                        placeholder="Search by name, category, or cuisine..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Recipe Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                            <p className="text-gray-400 text-sm">Loading recipes...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map(recipe => (
                                    <div key={recipe.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                        {recipe.image ? (
                                            <img src={recipe.image} className="w-full h-36 object-cover" alt={recipe.name} />
                                        ) : (
                                            <div className="w-full h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl">🍲</div>
                                        )}
                                        <div className="p-3">
                                            <h3 className="font-bold text-gray-800 text-sm truncate" title={recipe.name}>
                                                {recipe.name}
                                            </h3>

                                            {/* Tags row */}
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {recipe.category && (
                                                    <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                                                        {recipe.category}
                                                    </span>
                                                )}
                                                {recipe.cuisine && (
                                                    <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">
                                                        {recipe.cuisine}
                                                    </span>
                                                )}
                                                {recipe.recipeType && (
                                                    <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold">
                                                        {recipe.recipeType}
                                                    </span>
                                                )}
                                            </div>

                                            {recipe.description && (
                                                <p className="text-gray-500 text-xs mt-2 line-clamp-2">{recipe.description}</p>
                                            )}

                                            <div className="mt-3 flex justify-between items-center">
                                                {recipe.subCategory ? (
                                                    <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold">
                                                        {recipe.subCategory}
                                                    </span>
                                                ) : (
                                                    <span></span>
                                                )}
                                                {recipe.url ? (
                                                    <a href={recipe.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs font-bold hover:underline">
                                                        View →
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">No Link</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filtered.length === 0 && (
                                <div className="text-center py-10 text-gray-400">
                                    No recipes found matching &quot;{search}&quot;
                                </div>
                            )}

                            {/* Load More */}
                            {hasMore && !search && (
                                <div className="flex justify-center mt-6 mb-2">
                                    <button
                                        onClick={onLoadMore}
                                        disabled={isLoadingMore}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                        {isLoadingMore ? (
                                            <span className="flex items-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                                                Loading...
                                            </span>
                                        ) : (
                                            `Load More Recipes (${recipes.length} / ${totalCount})`
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
