import React from 'react';
import { Client } from '../../types';

interface ClientProfileProps {
    clientData: Client;
    onSelectTab: (tab: string) => void;
    activeTab: string;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ clientData, onSelectTab, activeTab }) => {
    return (
        <aside className="w-[300px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300">
            <div className="p-4 border-b border-gray-100 flex gap-3 relative">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-full border-2 border-blue-400 overflow-hidden bg-blue-50">
                        <img src={`https://ui-avatars.com/api/?name=${clientData.name.replace(/ /g, '+')}&background=E3F2FD&color=2196F3&bold=true`} className="w-full h-full object-cover" alt="Profile" />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${clientData.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{clientData.status}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[8px] font-bold">{clientData.platform}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border flex items-center gap-1 ${clientData.isVeg ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${clientData.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span> {clientData.isVeg ? 'Veg' : 'Non Veg'}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-[14px] font-bold text-gray-900 flex items-center justify-between">
                        {clientData.name}
                    </h2>
                    <p className="text-gray-400 text-[10px] truncate">{clientData.email}</p>
                    <p className="text-gray-900 font-bold mt-1">{clientData.phone}</p>
                    <p className="text-gray-500 text-[10px] truncate">{clientData.address}</p>
                    <div className="mt-2 space-y-0.5 text-[9px]">
                        <p><span className="text-gray-400">Password:</span> 123456 <span className="text-gray-400 ml-2">Wallet:</span> 1000</p>
                        <p><span className="text-gray-400">10-02-2026 11:07 AM</span></p>
                        <p><span className="text-gray-400">Validity:</span> 67 Days <span className="text-gray-400 ml-2">Temp:</span> 31.84 °C</p>
                        <p><span className="text-gray-400">Current Wt:</span> {clientData.stats.currentWt.toFixed(2)} Kg</p>
                        <p><span className="text-gray-400">Curr. App Screen:</span> My Profile</p>
                        <p><span className="text-gray-400">Mentor:</span> Nikita K</p>
                    </div>
                    <div className="mt-3 bg-red-50 text-red-500 px-2 py-1 rounded text-[9px] font-bold inline-block border border-red-100 uppercase">HAMPER NOT SENT</div>
                </div>
            </div>

            <nav className="flex items-center border-b border-gray-100">
                {['Profile', 'NAF', 'Goal', 'Insights', 'OH', 'Tracker'].map((tab, idx) => (
                    <button
                        key={tab}
                        onClick={() => onSelectTab(tab)}
                        className={`flex-1 py-2 font-bold text-gray-500 text-[10px] ${activeTab === tab ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'hover:bg-gray-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            <div className="p-4 space-y-3">
                {/* KEY CLIENT INFO: Gender, Age, Food Preference */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5">
                    <div className="font-bold text-[10px] text-blue-700 uppercase tracking-wider mb-1.5">Client Info</div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="bg-white rounded px-2 py-1.5 text-center border border-blue-100">
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Gender</p>
                            <p className="font-bold text-gray-800">{clientData.gender || '—'}</p>
                        </div>
                        <div className="bg-white rounded px-2 py-1.5 text-center border border-blue-100">
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Age</p>
                            <p className="font-bold text-gray-800">{clientData.age || '—'}</p>
                        </div>
                        <div className="bg-white rounded px-2 py-1.5 text-center border border-blue-100">
                            <p className="text-[8px] text-gray-400 font-bold uppercase">Diet</p>
                            <p className="font-bold text-gray-800">{clientData.foodPreference || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* ALLERGIES */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="font-bold text-[10px] text-red-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span>⚠️</span> Allergies
                    </div>
                    {clientData.allergies && clientData.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {clientData.allergies.map((a, i) => (
                                <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[9px] font-semibold border border-red-200">{a}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-[9px] italic">None recorded</p>
                    )}
                </div>

                {/* FOOD AVERSIONS */}
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                    <div className="font-bold text-[10px] text-orange-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span>🚫</span> Food Aversions
                    </div>
                    {clientData.aversions && clientData.aversions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {clientData.aversions.map((a, i) => (
                                <span key={i} className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[9px] font-semibold border border-orange-200">{a}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-[9px] italic">None recorded</p>
                    )}
                </div>

                {/* MEDICAL CONDITIONS */}
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <div className="font-bold text-[10px] text-purple-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span>🏥</span> Medical Issues
                    </div>
                    {clientData.medicalIssues && clientData.medicalIssues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {clientData.medicalIssues.map((m, i) => (
                                <span key={i} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[9px] font-semibold border border-purple-200">{m}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-[9px] italic">None recorded</p>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {['Ask Diets', 'Daily FU', 'Pro Noti', 'Vip Client', 'Wati', 'On Hold'].map(label => (
                        <div key={label} className="flex flex-col items-center">
                            <span className="text-[8px] font-bold text-gray-400 mb-1">{label}</span>
                            <div className="w-8 h-4 bg-gray-200 rounded-full relative">
                                <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-[#FAFAFA] border border-gray-100 rounded">
                    <div className="p-2 border-b border-gray-100 font-bold text-center">Fasting Cycle</div>
                    <div className="p-3 text-center">
                        <p className="text-gray-700 font-medium">14:10 Fasting || Eating Time: 08:45 AM To 06:45 PM</p>
                    </div>
                </div>

                <div className="bg-[#FAFAFA] border border-gray-100 rounded">
                    <div className="p-2 border-b border-gray-100 font-bold text-center">Program Pitched</div>
                    <div className="p-3 text-[10px] space-y-1">
                        <p><span className="font-bold">Program:</span> BODY TRANSFORMATION (60 Day)</p>
                        <p><span className="font-bold">MRP:</span> ₹19,999 <span className="font-bold ml-2">QTD:</span> ₹9,999</p>
                        <div className="flex gap-2 mt-2">
                            <button className="flex-1 bg-blue-500 text-white font-bold py-1.5 rounded">Create Link Again</button>
                            <button className="flex-1 bg-blue-600 text-white font-bold py-1.5 rounded">Suggest New Program</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded overflow-hidden">
                    <div className="p-2 border-b border-gray-100 font-bold text-center bg-gray-50">Weight</div>
                    <div className="grid grid-cols-3 text-center">
                        <div className="p-2 border-r border-gray-100"><div className="text-[8px] text-gray-400 font-bold uppercase">Assess</div><div className="font-bold">{clientData.stats.assessStWt.toFixed(2)} Kg</div></div>
                        <div className="p-2 border-r border-gray-100"><div className="text-[8px] text-gray-400 font-bold uppercase">Prg</div><div className="font-bold">{clientData.stats.prgStWt.toFixed(2)} Kg</div></div>
                        <div className="p-2"><div className="text-[8px] text-gray-400 font-bold uppercase">Goal</div><div className="font-bold">{clientData.stats.goalWt.toFixed(2)} Kg</div></div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
