
import React, { useState, useMemo } from 'react';
import { X, Hammer, AlertCircle, ShieldCheck, User, Clock, MessageSquare, Wrench, ChevronDown, CheckCircle2, XCircle, Info, DollarSign, Search, UserCheck, PackageSearch, Timer, Plus, Trash2, ShieldAlert, RefreshCw } from 'lucide-react';
import { ToolAsset, Employee, MaintenanceRecord, MaintenanceStatus } from '../../types';

export const ReassignTechnicianModal: React.FC<{
  record: MaintenanceRecord;
  staff: Employee[];
  onConfirm: (techId: string, techName: string) => Promise<void>;
  onCancel: () => void;
}> = ({ record, staff, onConfirm, onCancel }) => {
  const [techQuery, setTechQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<Employee | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredStaff = useMemo(() => {
    const q = techQuery.toLowerCase();
    if (!q || selectedTech) return [];
    return staff.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)).slice(0, 5);
  }, [staff, techQuery, selectedTech]);

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-900 rounded-xl text-white shadow-lg"><RefreshCw size={18}/></div>
              <div>
                 <h3 className="text-sm font-black uppercase tracking-tight">Reassign Technician</h3>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Escalated Asset: {record.toolName}</p>
              </div>
           </div>
           <button onClick={onCancel} className="text-slate-300 hover:text-slate-900"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-6">
           <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Current Assignee:</p>
              <p className="text-sm font-black text-indigo-900 uppercase">{record.assignedStaffName || 'NONE'}</p>
           </div>
           <div className="space-y-1.5 relative">
              <label className="text-[9px] font-black text-slate-900 uppercase ml-1">New Technical Lead</label>
              <div className="relative">
                 <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-4 text-[10px] font-black text-slate-700 uppercase outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                    placeholder="Search replacement technician..."
                    value={techQuery}
                    onChange={e => { setTechQuery(e.target.value); setSelectedTech(null); }}
                 />
                 {filteredStaff.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl overflow-hidden">
                       {filteredStaff.map(s => (
                         <button key={s.id} onClick={() => { setSelectedTech(s); setTechQuery(s.name); }} className="w-full text-left px-5 py-3 hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-0">
                            <span className="text-[10px] font-black uppercase text-slate-800">{s.name}</span>
                            <Plus size={14} className="text-indigo-600" />
                         </button>
                       ))}
                    </div>
                 )}
              </div>
           </div>
           <button 
             disabled={!selectedTech || isProcessing}
             onClick={async () => {
                setIsProcessing(true);
                await onConfirm(selectedTech!.id, selectedTech!.name);
                setIsProcessing(false);
             }}
             className="w-full bg-[#0F1135] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
           >
              <ShieldCheck size={18} />
              <span>{isProcessing ? 'SYNCHRONIZING...' : 'AUTHORIZE REASSIGNMENT'}</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export const ReportMaintenanceModal: React.FC<{
  tools: ToolAsset[];
  staff: Employee[];
  currentUser: Employee;
  onSave: (records: MaintenanceRecord[]) => Promise<void>;
  onCancel: () => void;
}> = ({ tools, staff, currentUser, onSave, onCancel }) => {
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [toolSearch, setToolSearch] = useState('');
  const [showLookup, setShowLookup] = useState(false);
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [staffQuery, setStaffQuery] = useState('');
  const [showStaffLookup, setShowStaffLookup] = useState(false);

  const filteredTools = useMemo<ToolAsset[]>(() => {
    const q = toolSearch.toLowerCase();
    return tools
      .filter(t => !selectedToolIds.has(t.id))
      .filter(t => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
      .slice(0, 5);
  }, [tools, toolSearch, selectedToolIds]);

  const filteredStaff = useMemo(() => {
    const q = staffQuery.toLowerCase();
    if (!q || assignedStaffId) return [];
    return staff.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)).slice(0, 5);
  }, [staff, staffQuery, assignedStaffId]);

  const toggleTool = (id: string) => {
    setSelectedToolIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setToolSearch('');
    setShowLookup(false);
  };

  const handleCommit = async () => {
    if (selectedToolIds.size === 0 || !context || !assignedStaffId) return;
    setIsProcessing(true);
    
    const records: MaintenanceRecord[] = Array.from<string>(selectedToolIds).map((toolId: string) => {
      const tool = tools.find(t => t.id === toolId);
      return {
        id: `MNT-${Date.now()}-${toolId}`,
        toolId: toolId,
        toolName: tool?.name || 'Unknown',
        reportedBy: currentUser.name,
        reportedDate: new Date().toISOString().split('T')[0],
        breakdownContext: context,
        isRepairable: null,
        status: 'Staged',
        assignedStaffId,
        assignedStaffName: staffQuery
      };
    });

    await onSave(records);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><AlertCircle size={18}/></div>
              <div>
                 <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Report Broken Tool</h3>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tell us what tools are broken</p>
              </div>
           </div>
           <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
           <div className="space-y-1.5 relative">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Tools</label>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                 <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black text-slate-700 uppercase outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                    placeholder="Find tool..."
                    value={toolSearch}
                    onChange={e => {
                      setToolSearch(e.target.value);
                      setShowLookup(true);
                    }}
                    onFocus={() => setShowLookup(true)}
                 />
                 {showLookup && toolSearch && (
                   <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl overflow-hidden">
                      {filteredTools.length === 0 ? (
                        <div className="p-4 text-center text-[8px] font-black text-slate-300 uppercase">No tools found</div>
                      ) : filteredTools.map((t: ToolAsset) => (
                        <button 
                          key={t.id} 
                          onClick={() => toggleTool(t.id)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                        >
                           <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black uppercase text-slate-800 leading-none">{t.name}</p>
                           </div>
                           <Plus size={14} className="text-indigo-600" />
                        </button>
                      ))}
                   </div>
                 )}
              </div>
              
              {selectedToolIds.size > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-1">
                   {Array.from<string>(selectedToolIds).map((id: string) => {
                     const tool = tools.find(t => t.id === id);
                     return (
                       <div key={id} className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <span className="text-[9px] font-black text-indigo-700 uppercase">{tool?.name || id}</span>
                          <button onClick={() => toggleTool(id)} className="text-indigo-300 hover:text-rose-500 transition-colors">
                             <Trash2 size={12}/>
                          </button>
                       </div>
                     );
                   })}
                </div>
              )}
           </div>

           <div className="space-y-1.5 relative">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Technician</label>
              <div className="relative">
                 <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                 <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black text-slate-700 uppercase outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                    placeholder="Who will check the tool?"
                    value={staffQuery}
                    onChange={e => {
                      setStaffQuery(e.target.value);
                      setAssignedStaffId('');
                      setShowStaffLookup(true);
                    }}
                    onFocus={() => setShowStaffLookup(true)}
                 />
                 {showStaffLookup && staffQuery && !assignedStaffId && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl overflow-hidden">
                       {filteredStaff.length === 0 ? (
                         <div className="p-4 text-center text-[8px] font-black text-slate-300 uppercase">No tech found</div>
                       ) : filteredStaff.map(s => (
                         <button 
                           key={s.id} 
                           onClick={() => {
                             setAssignedStaffId(s.id);
                             setStaffQuery(s.name);
                             setShowStaffLookup(false);
                           }}
                           className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                         >
                            <p className="text-[10px] font-black uppercase text-slate-800">{s.name}</p>
                         </button>
                       ))}
                    </div>
                 )}
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">What happened?</label>
              <textarea 
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[11px] font-medium text-slate-700 outline-none h-24 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                 placeholder="Describe the breakdown..."
                 value={context}
                 onChange={e => setContext(e.target.value)}
              />
           </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
           <button 
             disabled={selectedToolIds.size === 0 || !context || !assignedStaffId || isProcessing}
             onClick={handleCommit}
             className="w-full bg-[#0F1135] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
           >
              <ShieldCheck size={18} />
              <span>{isProcessing ? 'Saving...' : `Report ${selectedToolIds.size} broken tool(s)`}</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export const MaintenanceResolutionModal: React.FC<{
  record: MaintenanceRecord;
  staff: Employee[];
  onConfirm: (updates: Partial<MaintenanceRecord>, nextStatus: MaintenanceStatus) => Promise<void>;
  onCancel: () => void;
}> = ({ record, staff, onConfirm, onCancel }) => {
  const [resolutionType, setResolutionType] = useState<'Restored' | 'Decommissioned' | 'Spares'>(
    record.status === 'In_Repair' ? 'Spares' : 'Restored'
  );
  
  const [notes, setNotes] = useState(record.technicianNotes || '');
  const [cost, setCost] = useState(record.estimatedCost || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assignedStaffId, setAssignedStaffId] = useState(record.assignedStaffId || '');
  const [staffQuery, setStaffQuery] = useState(record.assignedStaffName || '');

  const filteredStaff = useMemo(() => {
    const q = staffQuery.toLowerCase();
    if (!q || assignedStaffId) return [];
    return staff.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)).slice(0, 5);
  }, [staff, staffQuery, assignedStaffId]);

  const handleFinalize = async () => {
    setIsProcessing(true);
    let nextStatus: MaintenanceStatus = 'In_Repair';
    let isRepairable: boolean | null = null;

    if (resolutionType === 'Restored') {
      nextStatus = 'Restored';
      isRepairable = true;
    } else if (resolutionType === 'Decommissioned') {
      nextStatus = 'Decommissioned';
      isRepairable = false;
    } else {
      nextStatus = 'In_Repair';
      isRepairable = true;
    }
    
    await onConfirm({
       isRepairable,
       technicianNotes: notes,
       estimatedCost: cost,
       assignedStaffId,
       assignedStaffName: staffQuery,
       resolutionDate: nextStatus === 'Restored' || nextStatus === 'Decommissioned' ? new Date().toISOString().split('T')[0] : undefined
    }, nextStatus);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-900 rounded-xl text-white shadow-lg"><Hammer size={18}/></div>
              <div>
                 <h3 className="text-sm font-black uppercase tracking-tight">Finish Repair</h3>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tool: {record.toolName}</p>
              </div>
           </div>
           <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar flex-1 bg-slate-50/20">
           <div className="bg-indigo-600 rounded-[1.5rem] p-4 text-white shadow-lg shadow-indigo-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <ShieldAlert size={20} className="text-indigo-200" />
                 <div>
                    <p className="text-[7.5px] font-black uppercase tracking-widest opacity-60">Status</p>
                    <p className="text-[10px] font-black uppercase">{record.status.replace('_', ' ')}</p>
                 </div>
              </div>
           </div>

           <div className="space-y-1.5 relative">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Tech</label>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                 <input 
                    className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[10px] font-black text-slate-700 uppercase outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                    placeholder="Search tech..."
                    value={staffQuery}
                    onChange={e => { setStaffQuery(e.target.value); setAssignedStaffId(''); }}
                 />
                 {filteredStaff.length > 0 && (
                   <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl overflow-hidden">
                      {filteredStaff.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => { setAssignedStaffId(s.id); setStaffQuery(s.name); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                        >
                           <span className="text-[9px] font-black uppercase">{s.name}</span>
                        </button>
                      ))}
                   </div>
                 )}
              </div>
           </div>

           <div className="pt-2 space-y-3">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">What is the result?</label>
              <div className="grid grid-cols-3 gap-2">
                 {[
                   { id: 'Restored', label: 'Fixed', sub: 'Ready to use', icon: <CheckCircle2 size={14}/>, color: 'emerald' },
                   { id: 'Spares', label: 'Need Parts', sub: 'Wait for spares', icon: <Timer size={14}/>, color: 'indigo' },
                   { id: 'Decommissioned', label: 'Cannot Fix', sub: 'Throw away', icon: <XCircle size={14}/>, color: 'rose' }
                 ].map(path => (
                    <button 
                      key={path.id}
                      onClick={() => setResolutionType(path.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-1 ${
                        resolutionType === path.id 
                        ? `bg-${path.color}-50 border-${path.color}-500 text-${path.color}-700 shadow-md ring-2 ring-${path.color}-50` 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                      }`}
                    >
                       {path.icon}
                       <span className="text-[9px] font-black uppercase tracking-tighter leading-none">{path.label}</span>
                       <span className="text-[6.5px] font-bold opacity-60 uppercase whitespace-nowrap">{path.sub}</span>
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Repair Notes</label>
              <textarea 
                 className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-[11px] font-medium text-slate-700 outline-none h-24 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                 placeholder="Details about the fix..."
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
              />
           </div>

           {resolutionType !== 'Decommissioned' && (
             <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Repair Cost ($)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                   <input 
                      type="number"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[11px] font-black text-slate-900 outline-none shadow-sm"
                      value={cost || ''}
                      onChange={e => setCost(parseFloat(e.target.value) || 0)}
                   />
                </div>
             </div>
           )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
           <button 
             disabled={!assignedStaffId || isProcessing}
             onClick={handleFinalize}
             className={`w-full text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-40 ${
               resolutionType === 'Restored' ? 'bg-emerald-600 hover:bg-emerald-700' : 
               resolutionType === 'Spares' ? 'bg-indigo-600 hover:bg-indigo-700' : 
               'bg-[#0F1135] hover:bg-rose-600'
             }`}
           >
              <ShieldCheck size={18} />
              <span>{isProcessing ? 'Saving...' : 'Finish Record'}</span>
           </button>
        </div>
      </div>
    </div>
  );
};
