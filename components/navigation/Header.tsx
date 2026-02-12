import React from 'react';

interface HeaderProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    isSearching: boolean;
    onSearch: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, isSearching, onSearch }) => {
    return (
        <header className="h-[50px] bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                </div>
                <div className="relative">
                    <select className="bg-transparent border-none font-bold text-gray-600 outline-none appearance-none pr-4">
                        <option>SELF</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Search Client ID (e.g. c1, c2, c3)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={onSearch}
                        className={`w-full bg-[#F3F6F9] border border-gray-200 rounded px-3 py-1.5 outline-none focus:border-blue-400 text-gray-900 ${isSearching ? 'opacity-50' : ''}`}
                    />
                    {isSearching && <div className="absolute right-3 top-1.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
            </div>

            <div className="flex items-center gap-1">
                {[
                    { label: 'PV', color: 'blue', count: 0 },
                    { label: 'CV', color: 'blue', count: 0 },
                    { label: 'Calls', color: 'blue', count: 0 },
                    { label: 'Link Shared', color: 'green', count: 0 },
                    { label: 'Sales Fu', color: 'orange', count: 2 },
                    { label: 'Daily Fu', color: 'red', count: 0 },
                ].map((item, idx) => (
                    <button key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-gray-100 hover:bg-gray-50 transition-colors relative">
                        <span className={`text-${item.color}-600 font-bold`}>{item.label}</span>
                        {item.count > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{item.count}</span>}
                    </button>
                ))}
                <button className="px-3 py-1.5 font-bold text-orange-500 border border-gray-100 rounded">Special Diet</button>
                <button className="px-3 py-1.5 font-bold text-blue-500 border border-gray-100 rounded">+ Add Lead</button>
                <div className="flex items-center gap-4 ml-4">
                    <div className="relative">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">0</span>
                    </div>
                    <div className="relative">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">23</span>
                    </div>
                    <img src="https://ui-avatars.com/api/?name=Admin&background=random" className="w-7 h-7 rounded-full border border-gray-200" alt="Admin" />
                </div>
            </div>
        </header>
    );
};
