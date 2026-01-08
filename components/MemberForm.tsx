import React, { useState } from 'react';
import { CheckCircle2, X, Plus } from 'lucide-react';
import { Employee } from '../types';

interface MemberFormProps {
  initialMember?: Partial<Employee>;
  teamId: string;
  sections: string[];
  onSave: (data: Partial<Employee>) => void;
  onCancel: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ initialMember, teamId, sections = [], onSave, onCancel }) => {
  const [name, setName] = useState(initialMember?.name || '');
  const [role, setRole] = useState<Employee['role']>(initialMember?.role || 'Member');
  const [section, setSection] = useState(initialMember?.section || sections[0] || 'General');
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [customSectionName, setCustomSectionName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalSection = isCustomSection ? customSectionName.trim() : section;
    if (!finalSection) return alert("Please specify a section.");
    onSave({ 
      name, 
      role, 
      section: finalSection, 
      teamId: initialMember?.teamId || teamId, 
      id: initialMember?.id 
    });
  };

  return (
    <tr className="bg-indigo-50/30">
      <td colSpan={6} className="py-6 px-10">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-6 max-w-5xl">
          <div className="flex flex-col flex-1 min-w-[240px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <input 
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
            />
          </div>

          <div className="flex flex-col min-w-[180px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Role</label>
            <select 
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="Member">Staff</option>
              <option value="Assistant Supervisor">Assistant Supervisor</option>
              <option value="Workshop Supervisor">Shift Supervisor</option>
              {role !== 'Member' && role !== 'Assistant Supervisor' && role !== 'Workshop Supervisor' && (
                <option value={role}>{role}</option>
              )}
            </select>
          </div>

          <div className="flex flex-col min-w-[220px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Section
              <button 
                type="button" 
                onClick={() => setIsCustomSection(!isCustomSection)}
                className="ml-2 text-indigo-600 hover:underline normal-case font-black text-[8px] uppercase"
              >
                {isCustomSection ? "(List)" : "(Custom)"}
              </button>
            </label>
            {isCustomSection ? (
              <input 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                value={customSectionName}
                onChange={(e) => setCustomSectionName(e.target.value)}
                placeholder="Section Name"
              />
            ) : (
              <select 
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                {(sections || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button 
              type="submit" 
              className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 flex items-center shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              <CheckCircle2 size={14} className="mr-2" /> Save
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="bg-white border border-slate-200 text-slate-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center transition-all"
            >
              <X size={14} className="mr-2" /> Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
};

export default MemberForm;
