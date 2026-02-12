import React from 'react';
import { DietTemplate } from '../../types';

interface TemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    templates: DietTemplate[];
    onSelect: (template: DietTemplate) => void;
    isLoading?: boolean;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    searchQuery?: string;
    onSearch?: (query: string) => void;
}

const Icons = {
    X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    isOpen,
    onClose,
    templates,
    onSelect,
    isLoading,
    onLoadMore,
    isLoadingMore,
    hasMore,
    searchQuery,
    onSearch,
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-white w-[500px] h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-[14px]">
                            Select Diet Template
                            {!isLoading && <span className="text-gray-400 font-normal ml-2">({templates.length})</span>}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icons.X /></button>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery || ''}
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-black shadow-sm"
                            autoFocus
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="text-xs">Fetching templates...</p>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                            No templates found.
                        </div>
                    ) : (
                        <>
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => onSelect(template)}
                                    className="p-3 hover:bg-blue-50 cursor-pointer rounded-lg border border-transparent hover:border-blue-200 mb-1 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px] group-hover:bg-blue-600 group-hover:text-white transition-colors">D</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-[11px] truncate group-hover:text-blue-900">{template.name}</p>
                                            <p className="text-gray-400 text-[9px]">Template ID: {template.id}</p>
                                            <p className="text-gray-400 text-[9px]">Sections: {template.sections?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Load More Button — fetches the NEXT page from the API */}
                            {hasMore && (
                                <button
                                    onClick={onLoadMore}
                                    disabled={isLoadingMore}
                                    className="w-full py-3 text-center text-blue-600 text-[11px] font-bold hover:bg-blue-50 rounded-lg mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingMore ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></span>
                                            Loading more...
                                        </span>
                                    ) : (
                                        'Load More Templates'
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                    <p className="text-gray-400 text-[9px]">Choose a template to load it into the system dashboard.</p>
                </div>
            </div>
        </div>
    );
};
