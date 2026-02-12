import React from 'react';
import { AuditResult } from '../../lib/types/audit-schema';

interface AuditResultsPanelProps {
    highlightedHtml: string;
    auditResult: AuditResult;
    onClose?: () => void;
}

export const AuditResultsPanel: React.FC<AuditResultsPanelProps> = ({
    highlightedHtml,
    auditResult,
    onClose
}) => {
    const safetyPercentage = auditResult.total_meal_count > 0
        ? Math.round((auditResult.safe_meal_count / auditResult.total_meal_count) * 100)
        : 0;

    const criticalCount = auditResult.conflicts.filter(c => c.severity === 'critical').length;
    const warningCount = auditResult.conflicts.filter(c => c.severity === 'warning').length;

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Header with Summary Stats */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-800 text-[14px] mb-2">AI Safety Audit Results</h3>
                        <p className="text-[10px] text-gray-600">{auditResult.summary}</p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-3 mt-3">
                    <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <div className="text-[18px] font-bold text-blue-600">{safetyPercentage}%</div>
                        <div className="text-[9px] text-gray-500 font-medium">Safety Rate</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <div className="text-[18px] font-bold text-green-600">{auditResult.safe_meal_count}</div>
                        <div className="text-[9px] text-gray-500 font-medium">Safe Meals</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <div className="text-[18px] font-bold text-red-600">{criticalCount}</div>
                        <div className="text-[9px] text-gray-500 font-medium">Critical</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <div className="text-[18px] font-bold text-orange-600">{warningCount}</div>
                        <div className="text-[9px] text-gray-500 font-medium">Warnings</div>
                    </div>
                </div>
            </div>

            {/* Conflict List */}
            {auditResult.conflicts.length > 0 && (
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h4 className="font-bold text-[11px] text-gray-700 mb-2 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                        Identified Conflicts ({auditResult.conflicts.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {auditResult.conflicts.map((conflict, idx) => (
                            <div
                                key={idx}
                                className={`p-2 rounded-lg border ${conflict.severity === 'critical'
                                        ? 'bg-red-50 border-red-200'
                                        : conflict.severity === 'warning'
                                            ? 'bg-orange-50 border-orange-200'
                                            : 'bg-blue-50 border-blue-200'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${conflict.severity === 'critical'
                                            ? 'bg-red-600 text-white'
                                            : conflict.severity === 'warning'
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-blue-600 text-white'
                                        }`}>
                                        {conflict.severity}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-bold text-[10px] text-gray-800">{conflict.dish_name}</p>
                                        <p className="text-[9px] text-gray-600 mt-0.5">
                                            <span className="font-medium">Meal:</span> {conflict.meal_time}
                                        </p>
                                        <p className="text-[9px] text-gray-600 mt-1">{conflict.reason}</p>
                                        {conflict.suggested_swap && (
                                            <p className="text-[9px] text-green-700 mt-1 font-medium">
                                                💡 Try: {conflict.suggested_swap}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Highlighted HTML Content */}
            <div className="p-4">
                <h4 className="font-bold text-[11px] text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Diet Plan with Highlighted Conflicts
                </h4>
                <div
                    className="prose prose-sm max-w-none audit-diet-content"
                    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
            </div>
        </div>
    );
};
