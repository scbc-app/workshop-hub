
import React, { useState, useRef, useEffect } from 'react';
import { Wrench, Plus, ShieldCheck, Camera, Edit2, X, Box, Layers, Briefcase, Trash2, Info, History } from 'lucide-react';
import { ToolAsset, ToolCondition, WorkshopZone, AssetClass, Employee } from '../../types';

interface ToolEntryModalProps {
  onSave: (tool: ToolAsset) => void;
  onCancel: () => void;
  currentUser: Employee;
  initialData?: ToolAsset | null;
}

const ToolEntryModal: React.FC<ToolEntryModalProps> = ({ onSave, onCancel, currentUser, initialData }) => {
  const [formData, setFormData] = useState<Partial<ToolAsset>>(initialData || {
    name: '',
    category: 'Hand tools',
    zone: 'Main Store',
    quantity: 1,
    available: 1,
    condition: 'Excellent',
    monetaryValue: 0,
    imageUrl: '',
    assetClass: 'Pc',
    composition: []
  });

  const [compInput, setCompInput] = useState('');
  const [isCustomZone, setIsCustomZone] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Power tools', 'Electrical tools', 'Hand tools', 'Calibration Tools', 'Hydraulics', 'Pneumatics'];
  const zones = ['Main Store', 'Workshop Bay 1', 'Workshop Bay 2', 'Panel Beating', 'Engine Section', 'Electrical Unit', 'Road Call Van'];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addComp = () => {
    if (!compInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      composition: [...(prev.composition || []), compInput.trim()]
    }));
    setCompInput('');
  };

  const removeComp = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      composition: (prev.composition || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Asset name is required.");
    if ((formData.assetClass === 'Set' || formData.assetClass === 'Toolbox') && (!formData.composition || formData.composition.length === 0)) {
      return alert(`Institutional Protocol: A ${formData.assetClass} must contain specific item records.`);
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    onSave({
      ...formData as ToolAsset,
      id: formData.id || `T-${Date.now().toString().slice(-4)}`,
      lastVerified: today,
      submissionDate: initialData?.submissionDate || today,
      addedBy: initialData?.addedBy || currentUser.name
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto no-scrollbar">
      <div className="relative bg-[#F8FAFF] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col my-auto">
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${initialData ? 'bg-amber-50' : 'bg-indigo-600'} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
              {initialData ? <Edit2 size={24} /> : <Plus size={24} />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">
                {initialData ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Master Registry Entry</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 transition-colors p-2"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-3">
             <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest ml-1">Asset Classification</label>
             <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Pc', label: 'Single', icon: <Box size={14} />, desc: 'One Unit' },
                  { id: 'Set', label: 'Set', icon: <Layers size={14} />, desc: 'Multiple Items' },
                  { id: 'Toolbox', label: 'Toolbox', icon: <Briefcase size={14} />, desc: 'Container' }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, assetClass: tier.id as AssetClass })}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 ${
                      formData.assetClass === tier.id 
                        ? 'bg-[#0F1135] text-white border-[#0F1135] shadow-lg' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                    }`}
                  >
                     {tier.icon}
                     <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-tight">{tier.label}</p>
                        <p className={`text-[7px] font-bold uppercase opacity-60`}>{tier.desc}</p>
                     </div>
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center space-x-5">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-indigo-300 transition-all shrink-0 shadow-sm"
            >
              {formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Tool" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Camera className="text-white" size={24} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-300">
                  <Camera size={28} className="mb-2" />
                  <span className="text-[7.5px] font-black uppercase tracking-[0.1em] text-center px-2">Add Artifact</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-col">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Asset Designation</label>
                <div className="relative">
                  <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input 
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[11px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          </div>

          {(formData.assetClass === 'Set' || formData.assetClass === 'Toolbox') && (
            <div className="bg-white border border-indigo-100 rounded-[1.8rem] p-5 space-y-4 shadow-sm">
               <div className="flex items-center space-x-2">
                 <History size={16} className="text-indigo-600" />
                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Artifact Manifest</h4>
               </div>
               
               <div className="flex items-center gap-2">
                  <input 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add piece..."
                    value={compInput}
                    onChange={e => setCompInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addComp())}
                  />
                  <button 
                    type="button"
                    onClick={addComp}
                    className="w-10 h-10 bg-[#0F1135] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90"
                  >
                    <Plus size={18} />
                  </button>
               </div>

               <div className="space-y-1.5">
                  {(formData.composition || []).map((piece, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl animate-in slide-in-from-right-1">
                       <span className="text-[10px] font-black text-slate-700 uppercase">{piece}</span>
                       <button type="button" onClick={() => removeComp(idx)} className="text-slate-300 hover:text-rose-600"><Trash2 size={14}/></button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Zone</label>
                <button type="button" onClick={() => setIsCustomZone(!isCustomZone)} className="text-[7px] font-black text-indigo-600 uppercase underline">
                  {isCustomZone ? 'Use List' : 'Custom'}
                </button>
              </div>
              {isCustomZone ? (
                <input 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  placeholder="New zone"
                  value={formData.zone}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                />
              ) : (
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer"
                  value={formData.zone}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                >
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                <button type="button" onClick={() => setIsCustomCategory(!isCustomCategory)} className="text-[7px] font-black text-indigo-600 uppercase underline">
                  {isCustomCategory ? 'Use List' : 'Custom'}
                </button>
              </div>
              {isCustomCategory ? (
                <input 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  placeholder="New category"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                />
              ) : (
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Monetary Value ($)</label>
              <input 
                type="number"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={formData.monetaryValue || ''}
                onChange={e => setFormData({...formData, monetaryValue: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Total Units</label>
              <input 
                type="number"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={formData.quantity || ''}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0, available: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
        </form>

        <div className="p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0">
          <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 transition-all">Cancel</button>
          <button 
            type="button"
            onClick={handleSubmit}
            className={`flex-[1.5] py-4 rounded-2xl ${initialData ? 'bg-amber-600' : 'bg-[#0F1135]'} text-white font-black uppercase tracking-[0.2em] text-[9px] hover:bg-indigo-700 shadow-2xl transition-all flex items-center justify-center space-x-2 active:scale-95`}
          >
            <ShieldCheck size={18} />
            <span>{initialData ? 'Commit Update' : 'Save Asset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolEntryModal;
