import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Scale, Info, Layers, Settings2, ShieldAlert, Wrench, Database, CheckCircle, RefreshCw, Fingerprint } from 'lucide-react';
import { Shift, ShiftConfiguration, ShiftType, Employee, VisibilityScope } from '../types';
import Card from '../components/Card';
import { syncSettings } from '../services/sheetService';
import PrivilegesTab from '../components/hr/PrivilegesTab';

const SettingsPage: React.FC<{
  shifts: Shift[];
  config: ShiftConfiguration;
  onUpdateShifts: (shifts: Shift[]) => void;
  onUpdateConfig: (config: ShiftConfiguration) => void;
  currentUser: Employee;
  tierDefaults: Record<string, { permissions: string[], scope: VisibilityScope }>;
}> = ({ shifts, config, onUpdateShifts, onUpdateConfig, currentUser, tierDefaults }) => {
  const [activeTab, setActiveTab] = useState<'shifts' | 'policy' | 'roster' | 'matrix'>('shifts');
  const [localShifts, setLocalShifts] = useState(shifts);
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (shifts && shifts.length > 0) {
      setLocalShifts(shifts);
    }
  }, [shifts]);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const updateShift = (id: string, updates: Partial<Shift>) => {
    setLocalShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addNewShift = () => {
    const nextLetter = String.fromCharCode(65 + localShifts.length);
    const newShift: Shift = {
      id: `s${Date.now()}`,
      name: `Shift ${nextLetter}`,
      type: ShiftType.DAY,
      startTime: '08:00',
      endTime: '17:00'
    };
    setLocalShifts([...localShifts, newShift]);
  };

  const removeShift = (id: string) => {
    if (localShifts.length <= 1) return;
    if (confirm("Are you sure you want to delete this shift? Personnel assignments will be cleared.")) {
      setLocalShifts(prev => prev.filter(s => s.id !== id));
    }
  };

  const saveAll = async () => {
    setIsSaving(true);
    const success = await syncSettings(localShifts, localConfig);
    if (success) {
      onUpdateShifts(localShifts);
      onUpdateConfig(localConfig);
      alert('Settings updated successfully.');
    } else {
      alert('Error: Settings failed to save.');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Admin Settings</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">System Configuration</p>
        </div>
        {activeTab !== 'matrix' && (
          <button 
            onClick={saveAll}
            disabled={isSaving}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center space-x-2 disabled:bg-slate-300"
          >
            {isSaving ? <Layers className="animate-spin" size={12} /> : <Settings2 size={12} />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200/50 mb-6">
        <button onClick={() => setActiveTab('shifts')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'shifts' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <Clock size={12} /><span>Shifts</span>
        </button>
        <button onClick={() => setActiveTab('policy')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'policy' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <ShieldAlert size={12} /><span>Policy</span>
        </button>
        <button onClick={() => setActiveTab('roster')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'roster' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <Wrench size={12} /><span>Sections</span>
        </button>
        <button onClick={() => setActiveTab('matrix')} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
          <Fingerprint size={12} /><span>Permissions</span>
        </button>
      </div>

      {activeTab === 'matrix' ? (
        <PrivilegesTab currentUser={currentUser} tierDefaults={tierDefaults} />
      ) : (
        <>
          {activeTab === 'shifts' && (
            <Card title="" headerAction={
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Shift Schedule</span>
                <button onClick={addNewShift} className="text-indigo-600 hover:text-indigo-800 flex items-center text-[9px] font-black uppercase tracking-widest">
                  <Plus size={12} className="mr-1" /> Add Shift
                </button>
              </div>
            }>
              <div className="space-y-2 mt-4">
                {localShifts.map((shift) => (
                  <div key={shift.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-slate-100 rounded-xl items-center bg-white hover:border-indigo-100 transition-all shadow-sm">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Shift Name</label>
                      <input type="text" value={shift.name || ''} onChange={(e) => updateShift(shift.id, { name: e.target.value })} className="border border-slate-100 rounded-lg px-2 py-1.5 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-[10px]" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Type</label>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        <button onClick={() => updateShift(shift.id, { type: ShiftType.DAY })} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase transition-all ${shift.type === ShiftType.DAY ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>Day</button>
                        <button onClick={() => updateShift(shift.id, { type: ShiftType.NIGHT })} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase transition-all ${shift.type === ShiftType.NIGHT ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Night</button>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Start Time</label>
                      <input type="time" value={shift.startTime || '00:00'} onChange={(e) => updateShift(shift.id, { startTime: e.target.value })} className="border border-slate-100 rounded-lg px-2 py-1.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-[10px]" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] text-slate-400 font-black uppercase tracking-widest">End Time</label>
                      <input type="time" value={shift.endTime || '00:00'} onChange={(e) => updateShift(shift.id, { endTime: e.target.value })} className="border border-slate-100 rounded-lg px-2 py-1.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-[10px]" />
                    </div>
                    <div className="flex justify-end pt-2">
                       <button onClick={() => removeShift(shift.id)} className="text-rose-300 hover:text-rose-500 p-2 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-6">
              <Card title="">
                 <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white"><ShieldAlert size={14} /></div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Company Policy</h4>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Work Rules and Rates</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                        <textarea className="w-full border border-slate-100 rounded-xl p-3 text-[10px] font-bold outline-none h-20 bg-slate-50/50" value={localConfig.nightToDayTransition} onChange={(e) => setLocalConfig({...localConfig, nightToDayTransition: e.target.value})} />
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                       <div className="flex items-center space-x-2 text-indigo-600 mb-2"><Scale size={14} /><span className="text-[9px] font-black uppercase">Standard Rates</span></div>
                       <ul className="text-[10px] text-slate-500 font-bold space-y-2 italic">
                         <li>• Weekday Overtime: 1.5x Rate</li>
                         <li>• Weekend/Holiday Overtime: 2.0x Rate</li>
                       </ul>
                    </div>
                 </div>
              </Card>
            </div>
          )}

          {activeTab === 'roster' && (
            <Card title="Department Sections">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {localConfig.sections.map((sec, idx) => (
                  <div key={idx} className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-[9px] font-black text-slate-900 uppercase flex justify-between items-center">
                    <span>{sec}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsPage;