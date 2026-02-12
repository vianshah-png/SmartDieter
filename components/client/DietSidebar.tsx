import React from 'react';
import { Client } from '../../types';

interface DietSidebarProps {
    clientData: Client;
    onCreateDiet: () => void;
    onUpdateClient?: (field: keyof Client, value: any) => void;
}

const Icons = {
    Edit: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
    X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>,
    Check: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
};

export const DietSidebar: React.FC<DietSidebarProps> = ({ clientData, onCreateDiet, onUpdateClient }) => {
    const [editingField, setEditingField] = React.useState<string | null>(null);
    const [editValue, setEditValue] = React.useState<string>('');

    const startEditing = (field: string, value: any) => {
        setEditingField(field);
        setEditValue(Array.isArray(value) ? value.join(', ') : String(value));
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveEditing = (field: keyof Client, isArray: boolean = false, isNumber: boolean = false) => {
        if (onUpdateClient) {
            let finalValue: any = editValue;
            if (isArray) {
                finalValue = editValue.split(',').map(s => s.trim()).filter(s => s);
            } else if (isNumber) {
                finalValue = Number(editValue);
            }
            onUpdateClient(field, finalValue);
        }
        setEditingField(null);
    };

    const renderEditableRow = (label: string, field: keyof Client, value: any, isArray: boolean = false, isNumber: boolean = false) => {
        const isEditing = editingField === field;
        const displayValue = isArray
            ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : 'None')
            : value;

        return (
            <div className="flex justify-between items-start group min-h-[24px]">
                <div className="flex-1 mr-2">
                    <span className="font-bold text-gray-400 block mb-0.5">{label}:</span>
                    {isEditing ? (
                        <input
                            autoFocus
                            type={isNumber ? "number" : "text"}
                            className="w-full border border-blue-300 rounded px-1 py-0.5 text-gray-700 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditing(field, isArray, isNumber);
                                if (e.key === 'Escape') cancelEditing();
                            }}
                        />
                    ) : (
                        <span className={`font-bold break-words ${!displayValue || displayValue === 'None' ? 'text-gray-300 italic' : 'text-gray-800'}`}>
                            {displayValue || 'None'}
                        </span>
                    )}
                </div>
                {onUpdateClient && (
                    <div className="flex shrink-0 ml-1 mt-0.5">
                        {isEditing ? (
                            <>
                                <button onClick={() => saveEditing(field, isArray, isNumber)} className="text-green-500 hover:text-green-600 p-1"><Icons.Check /></button>
                                <button onClick={cancelEditing} className="text-red-400 hover:text-red-500 p-1"><Icons.X /></button>
                            </>
                        ) : (
                            <button
                                onClick={() => startEditing(field as string, value)}
                                className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-[380px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            <nav className="flex items-center border-b border-gray-200 sticky top-0 bg-white z-10">
                {['DIET', 'CHAT', 'INSIGHTS'].map((tab, idx) => (
                    <button key={tab} className={`flex-1 py-3.5 font-bold text-[11px] ${idx === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                        {tab}
                    </button>
                ))}
            </nav>

            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-[14px] font-black text-gray-800 uppercase tracking-wide">{clientData.name}</h3>
                        <p className="text-gray-400 text-[10px]">ID: {clientData.id}</p>
                    </div>
                    <button
                        onClick={onCreateDiet}
                        className="bg-[#EA5455] text-white font-bold px-4 py-1.5 rounded shadow-sm hover:opacity-90 shrink-0 text-[11px]"
                    >
                        + Create Diet
                    </button>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-4 text-[11px] border border-gray-100 shadow-sm mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>

                    <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-4">
                        {renderEditableRow('Gender', 'gender', clientData.gender)}
                        {renderEditableRow('Age', 'age', clientData.age, false, true)}
                    </div>

                    <hr className="border-gray-50" />

                    <div className="relative z-10 space-y-4">
                        {renderEditableRow('Food Preference', 'foodPreference', clientData.foodPreference)}
                        {renderEditableRow('Allergies', 'allergies', clientData.allergies, true)}
                        {renderEditableRow('Aversions', 'aversions', clientData.aversions, true)}
                        {renderEditableRow('Medical Issues', 'medicalIssues', clientData.medicalIssues, true)}
                    </div>

                    <hr className="border-gray-50" />

                    <div className="relative z-10">
                        {renderEditableRow('Key Insights', 'lastKeyInsight', clientData.lastKeyInsight)}
                    </div>
                </div>

                {/* Diet Sent Card */}
                <div className="mt-4 border border-gray-200 rounded overflow-hidden">
                    <div className="bg-[#00CFE8] p-2 text-white font-bold text-center text-[12px]">Last Diet Sent</div>
                    <div className="p-4 space-y-2 text-[10px]">
                        <p><span className="font-bold">Diet Name:</span> Reform Intermittent (Sent: 2/ Total:3)</p>
                        <p><span className="font-bold">Diet Sent On:</span> 22nd, Jan 2026</p>
                        <p><span className="font-bold">Approved By:</span> NikitaK</p>
                        <div className="mt-2">
                            <p className="font-bold text-gray-400">REMINDERS:</p>
                            <ul className="list-disc list-inside text-gray-600">
                                <li>6th Day Pre: 28th, Jan 2026</li>
                            </ul>
                        </div>
                        <div className="flex gap-1 mt-4">
                            <button className="flex-1 py-1.5 rounded border border-blue-100 text-blue-500 flex justify-center hover:bg-blue-50"><Icons.Edit /></button>
                            <button className="flex-1 py-1.5 rounded border border-red-100 text-red-500 flex justify-center hover:bg-red-50"><Icons.X /></button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center font-bold text-gray-700 uppercase tracking-widest text-[9px] mb-4">Previous Diets</div>
                <div className="space-y-3">
                    <div className="bg-white border border-gray-100 p-3 rounded flex gap-3 shadow-sm hover:border-gray-200 transition-colors cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">1</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 text-[10px] truncate">Standard Weight Loss - Veg</p>
                            <p className="text-green-500 font-bold text-[9px] mt-0.5">● Active</p>
                            <p className="text-gray-400 text-[9px]">Sent: 15th Jan 2026</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
