import React from 'react';

interface AuditOverlayProps {
    isAuditing: boolean;
    progress: string;
}

export const AuditOverlay: React.FC<AuditOverlayProps> = ({ isAuditing, progress }) => {
    if (!isAuditing) return null;

    return (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-blue-700 uppercase tracking-widest text-[11px]">{progress}</p>
        </div>
    );
};
