import React, { useState } from 'react';
import { UserCog, UserPlus, Edit2, UserMinus, ShieldCheck, UserCheck, Sun, Moon, ChevronDown } from 'lucide-react';
import { Team, Shift, Employee, ShiftType } from '../types';
import Card from '../components/Card';
import MemberForm from '../components/MemberForm';

const TeamsPage: React.FC<{ 
  teams: Team[]; 
  shifts: Shift[]; 
  sections: string[];
  onMoveMember: (employeeId: string, targetTeamId: string) => void;
  onAddMember: (member: Partial<Employee>) => void;
  onUpdateMember: (member: Partial<Employee>) => void;
  onDeleteMember: (employeeId: string) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}> = ({ teams = [], shifts = [], sections = [], onMoveMember, onAddMember, onUpdateMember, onDeleteMember, hasPermission }) => {
  const [isManageMode, setIsManageMode] = useState(false);
  const [addingToTeamId, setAddingToTeamId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const canUpdate = hasPermission('shifts', 'update', 'teams');
  const canCreate = hasPermission('shifts', 'create', 'teams');
  const canDelete = hasPermission('shifts', 'delete', 'teams');

  const handleRemove = (id: string, name: string) => {
    if (!canDelete) return;
    if (confirm(`Remove ${name} from this roster?`)) {
      onDeleteMember(id);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mx-1">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">Team Management</h2>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Staff Assignments</p>
        </div>
        {canUpdate && (
          <button 
            onClick={() => { setIsManageMode(!isManageMode); setAddingToTeamId(null); setEditingMemberId(null); }}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-black uppercase text-[8.5px] tracking-widest transition-all border ${
              isManageMode ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
            }`}
          >
            <UserCog size={14} />
            <span>{isManageMode ? 'Done' : 'Edit Teams'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mx-1">
        {shifts.map((shift, idx) => {
          const team = teams[idx];
          if (!team) return null;

          const supervisor = team.members.find(m => m.id === team.supervisorId) || team.members.find(m => m.role === 'Workshop Supervisor');
          const assistant = team.members.find(m => m.id === team.assistantSupervisorId) || team.members.find(m => m.role === 'Assistant Supervisor');
          
          const memberCount = team.members.length;

          const membersBySection = (sections || []).reduce((acc, sec) => {
            const sectionMembers = team.members.filter(m => m.section === sec);
            if (sectionMembers.length > 0) acc[sec] = sectionMembers;
            return acc;
          }, {} as Record<string, Employee[]>);

          return (
            <Card key={shift.id} className="p-0 overflow-hidden border-slate-100 shadow-sm rounded-[2rem]" title="" headerAction={
              <div className="flex flex-col items-start gap-3 p-5 w-full border-b border-slate-50 bg-slate-50/20">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${shift.type === ShiftType.DAY ? 'bg-orange-50 text-orange-600' : 'bg-slate-900 text-white'}`}>
                      {shift.type === ShiftType.DAY ? <Sun size={20} /> : <Moon size={20} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none truncate">{shift.name}</h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1.5">{shift.type} SHIFT</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                     <p className="text-xl font-black text-slate-900 leading-none">{memberCount}</p>
                     <p className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest">Staff</p>
                  </div>
                </div>

                {isManageMode && canCreate && (
                  <button 
                    onClick={() => setAddingToTeamId(addingToTeamId === team.id ? null : team.id)}
                    className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors flex items-center justify-center border border-indigo-100 shadow-sm"
                  >
                    <UserPlus size={14} className="mr-2" /> Add Employee
                  </button>
                )}
              </div>
            }>
              <div className="bg-white px-5 py-4 flex gap-4 sm:items-center border-b border-slate-50">
                <div className="flex items-center space-x-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex-1 min-w-0 shadow-inner">
                  <ShieldCheck size={14} className="text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Supervisor</p>
                    <p className="text-[9px] font-black text-slate-800 leading-none truncate uppercase">{supervisor?.name || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex-1 min-w-0 shadow-inner">
                  <UserCheck size={14} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Assistant</p>
                    <p className="text-[9px] font-black text-slate-800 leading-none truncate uppercase">{assistant?.name || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                {addingToTeamId === team.id && (
                  <div className="p-4 bg-indigo-50/30 border-b border-indigo-100 animate-in slide-in-from-top-2">
                    <MemberForm 
                      teamId={team.id} 
                      sections={sections}
                      onSave={(data) => { onAddMember({ ...data, teamName: shift.name }); setAddingToTeamId(null); }} 
                      onCancel={() => setAddingToTeamId(null)} 
                    />
                  </div>
                )}
                
                {Object.keys(membersBySection).length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">No staff assigned</p>
                  </div>
                ) : (Object.entries(membersBySection) as [string, Employee[]][]).map(([sectionName, members]) => (
                  <div key={sectionName} className="flex flex-col">
                    <div className="bg-slate-50/50 sticky top-0 z-10 px-5 py-2.5 border-b border-slate-100 backdrop-blur-sm">
                       <h4 className="text-[8px] font-black text-indigo-600/60 uppercase tracking-[0.2em]">{sectionName} UNIT</h4>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {members.map(member => (
                        <div key={member.id} className="group hover:bg-indigo-50/10 transition-all duration-300">
                          {editingMemberId === member.id ? (
                            <div className="p-4 bg-white border-y border-indigo-100">
                              <MemberForm 
                                initialMember={member}
                                teamId={team.id} 
                                sections={sections}
                                onSave={(data) => { onUpdateMember(data); setEditingMemberId(null); }} 
                                onCancel={() => setEditingMemberId(null)} 
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between px-5 py-4">
                              <div className="flex items-center space-x-4 min-w-0">
                                <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm shrink-0 shadow-sm transition-all group-hover:shadow-indigo-100">
                                  {member.name.charAt(0)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{member.name}</span>
                                    {member.role !== 'Member' && (
                                      <span className="text-[7px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50 shrink-0">
                                        {member.role === 'Workshop Supervisor' ? 'SUP' : 'ASST'}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest mt-1">{member.id}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                {isManageMode ? (
                                  <>
                                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 p-0.5 shadow-inner">
                                      {canUpdate && (
                                        <button onClick={() => setEditingMemberId(member.id)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                          <Edit2 size={14} />
                                        </button>
                                      )}
                                      {canDelete && (
                                        <button onClick={() => handleRemove(member.id, member.name)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                          <UserMinus size={14} />
                                        </button>
                                      )}
                                    </div>
                                    <div className="relative">
                                      <select 
                                        className="text-[8px] font-black uppercase bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 outline-none appearance-none text-indigo-600 w-24 shadow-sm"
                                        value={team.id}
                                        onChange={(e) => onMoveMember(member.id, e.target.value)}
                                        disabled={!canUpdate}
                                      >
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-right hidden sm:block">
                                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest leading-none">Access Level</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mt-1">{member.accessLevel || 'Staff'}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TeamsPage;