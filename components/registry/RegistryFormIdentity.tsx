import React from 'react';
import { User, Users, ShieldCheck } from 'lucide-react';
import { Employee, Team } from '../../types';
import { POSITION_MAPPING } from '../../constants';

interface IdentitySectionProps {
  formData: Partial<Employee>;
  setFormData: (data: any) => void;
  teams: Team[];
  sections: string[];
  isCustomRole: boolean;
  setIsCustomRole: (v: boolean) => void;
  isCustomSection: boolean;
  setIsCustomSection: (v: boolean) => void;
  activeTeamData: { supervisorName: string; memberCount: number } | null;
}

export const RegistryFormIdentity: React.FC<IdentitySectionProps> = ({
  formData,
  setFormData,
  teams,
  sections,
  isCustomRole,
  setIsCustomRole,
  isCustomSection,
  setIsCustomSection,
  activeTeamData
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
          <input 
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
            placeholder="Name"
            value={formData.name || ''}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1 ml-1">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Role</label>
             <button type="button" onClick={() => setIsCustomRole(!isCustomRole)} className="text-[7px] font-black text-indigo-500 uppercase tracking-tighter hover:underline">
                {isCustomRole ? 'Use List' : 'Custom'}
             </button>
          </div>
          {isCustomRole ? (
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
              placeholder="Role Title"
              value={formData.role || ''}
              onChange={e => setFormData({...formData, role: e.target.value as any})}
            />
          ) : (
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              value={formData.role || 'Member'}
              onChange={e => setFormData({...formData, role: e.target.value as any})}
            >
              <option value="Member">Staff</option>
              <option value="Workshop Supervisor">Shift Supervisor</option>
              <option value="Operations Manager">Operations Manager</option>
              <option value="Workshop Manager">Workshop Manager</option>
              <option value="Stores Supervisor">Stores Supervisor</option>
              <option value="Assistant Supervisor">Assistant Supervisor</option>
            </select>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1 ml-1">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Section</label>
             <button type="button" onClick={() => setIsCustomSection(!isCustomSection)} className="text-[7px] font-black text-indigo-500 uppercase tracking-tighter hover:underline">
                {isCustomSection ? 'Use List' : 'Custom'}
             </button>
          </div>
          {isCustomSection ? (
             <input 
               className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
               placeholder="Section Name"
               value={formData.section || ''}
               onChange={e => setFormData({...formData, section: e.target.value})}
             />
          ) : (
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              value={formData.section || ''}
              onChange={e => setFormData({...formData, section: e.target.value, department: POSITION_MAPPING[e.target.value] || 'Operations'})}
            >
              <option value="">Select Section...</option>
              {(sections || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Team Assignment</label>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
           <div className="md:col-span-7 relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none appearance-none cursor-pointer shadow-sm"
                value={formData.teamId || ''}
                onChange={e => {
                  const t = teams.find(team => team.id === e.target.value);
                  setFormData({...formData, teamId: e.target.value, teamName: t?.name});
                }}
              >
                <option value="">Unassigned...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
           </div>
           <div className="md:col-span-5">
              {activeTeamData ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2 animate-in slide-in-from-right-2 duration-300">
                   <div className="flex items-center space-x-2">
                      <ShieldCheck size={10} className="text-indigo-600" />
                      <p className="text-[7.5px] font-black text-indigo-900 uppercase truncate leading-none">{activeTeamData.supervisorName}</p>
                   </div>
                   <p className="text-[6px] font-bold text-indigo-400 uppercase tracking-widest mt-1 ml-4">{activeTeamData.memberCount} Staff Members</p>
                </div>
              ) : (
                <div className="h-[36px] border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                   <span className="text-[7px] font-black uppercase tracking-widest">Select Team</span>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};