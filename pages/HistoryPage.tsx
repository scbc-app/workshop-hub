
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Calendar, Sun, Moon, ShieldCheck, Clock, Users, Database, FileText, MessageSquare, History, UserCheck } from 'lucide-react';
import { AttendanceRecord, Shift, Team, DayType, ShiftType, Employee } from '../types';
import Card from '../components/Card';

const HistoryPage: React.FC<{ 
  history: AttendanceRecord[]; 
  shifts: Shift[]; 
  teams: Team[];
  currentUser: Employee;
  resolveStaffIdentity: (id: string) => Partial<Employee>;
}> = ({ history = [], shifts = [], teams = [], currentUser, resolveStaffIdentity }) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const allEmployees = useMemo(() => teams.flatMap(t => t.members || []), [teams]);
  const scope = currentUser.visibilityScope || 'SELF';

  interface GroupedHistoryItem {
    key: string;
    date: string;
    shiftId: string;
    present: number;
    absent: number;
    totalOT: number;
    dayType: DayType;
    records: AttendanceRecord[];
  }

  const filteredHistory = useMemo(() => {
    if (scope === 'ALL') return history;
    if (scope === 'TEAM') {
       const teamMemberIds = allEmployees.filter(e => e.teamId === currentUser.teamId || e.teamName === currentUser.teamName).map(e => e.id);
       return history.filter(rec => teamMemberIds.includes(rec.employeeId));
    }
    return history.filter(rec => rec.employeeId === currentUser.id);
  }, [history, scope, currentUser, allEmployees]);

  const grouped = useMemo(() => (filteredHistory || []).reduce((acc, rec) => {
    if (!rec || !rec.date) return acc;
    const shiftId = rec.shiftId || 's1';
    const key = `${rec.date}-${shiftId}`;
    if (!acc[key]) {
      acc[key] = { key, date: rec.date, shiftId, present: 0, absent: 0, totalOT: 0, records: [], dayType: rec.dayType || DayType.STANDARD };
    }
    const item = acc[key];
    if (rec.status === 'Present') item.present++; else item.absent++;
    item.totalOT += (rec.overtimeHours || 0);
    item.records.push(rec);
    return acc;
  }, {} as Record<string, GroupedHistoryItem>), [filteredHistory]);

  const sortedHistory = useMemo(() => (Object.values(grouped) as GroupedHistoryItem[]).sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))), [grouped]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden mx-1">
        <div className="hidden md:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-3">Filing Date</div>
           <div className="col-span-3 text-center">Domain</div>
           <div className="col-span-3 text-center">Metrics</div>
           <div className="col-span-3 text-right">Registry Hash</div>
        </div>

        <div className="divide-y divide-slate-50">
          {sortedHistory.length === 0 ? (
            <div className="py-24 text-center">
              <Database size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No archive records</p>
            </div>
          ) : sortedHistory.map((item) => {
            const shift = shifts.find(s => s.id === item.shiftId);
            const shiftIdx = shifts.findIndex(s => s.id === item.shiftId);
            const team = teams[shiftIdx];
            const supervisor = team?.members.find(m => m.id === team.supervisorId) || team?.members.find(m => m.role.includes('Supervisor'));
            const supervisorName = supervisor?.name || "Shift Supervisor";
            
            const isExpanded = expandedKey === item.key;
            const displayDate = String(item.date || '').split(' ')[0].split('T')[0];
            
            return (
              <React.Fragment key={item.key}>
                <div 
                  onClick={() => setExpandedKey(isExpanded ? null : item.key)} 
                  className={`group p-5 md:px-8 md:py-5 hover:bg-indigo-50/20 transition-all duration-300 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 md:col-span-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-100 animate-in slide-in-from-left-2">
                           <span className="text-[11px] font-black tracking-tight uppercase">{displayDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-2 justify-center">
                           <div className={`p-1.5 rounded-lg border shadow-inner ${shift?.type === ShiftType.DAY ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-900 border-slate-800 text-white'}`}>
                              {shift?.type === ShiftType.DAY ? <Sun size={12} /> : <Moon size={12} />}
                           </div>
                           <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{shift?.name || 'Shift'}</span>
                        </div>
                        <p className="text-[7px] font-bold text-slate-400 uppercase mt-1 tracking-widest truncate max-w-[120px]">Sup: {supervisorName}</p>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 text-center">
                       <div className="flex items-center justify-center space-x-3">
                          <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{item.present}P</span>
                          <span className="text-[9px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{item.absent}A</span>
                          <span className="text-[9px] font-black text-indigo-600 uppercase">+{item.totalOT.toFixed(1)}H</span>
                       </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 text-right">
                       <div className="flex items-center justify-end space-x-4">
                          <div className="flex items-center space-x-1.5 text-slate-300 font-bold uppercase tracking-[0.15em] text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">
                             <History size={10} className="opacity-50" />
                             <span>ID: {item.key.split('-')[0]}</span>
                          </div>
                          <ChevronDown size={18} className={`transition-transform duration-500 text-slate-300 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                       </div>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="bg-slate-50 border-y border-slate-100 p-6 md:px-12 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                    <div className="mb-4 flex items-center justify-between px-2">
                       <div className="flex items-center space-x-2 text-indigo-600">
                          <UserCheck size={14}/>
                          <span className="text-[9px] font-black uppercase tracking-widest">Certified By: {supervisorName}</span>
                       </div>
                       <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Master Register Log</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden shadow-xl">
                      <div className="divide-y divide-slate-50">
                        {item.records.map((rec, idx) => {
                          const employee = resolveStaffIdentity(rec.employeeId);
                          const displayName = (employee?.name && employee.name !== rec.employeeId) 
                            ? employee.name 
                            : (rec.employeeId === 'UNKNOWN' ? 'System Personnel' : rec.employeeId);
                          const displaySection = employee?.section || 'Operations';

                          return (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-4 items-center">
                               <div className="col-span-1 md:col-span-6">
                                  <div className="flex items-center space-x-4">
                                     <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[10px] border border-slate-100 shadow-inner">
                                        {displayName.charAt(0)}
                                     </div>
                                     <div className="flex flex-col min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-[11px] font-black uppercase text-slate-800 truncate">{displayName}</span>
                                          <span className="text-[8px] font-bold text-slate-400 opacity-60">| {displaySection}</span>
                                        </div>
                                        {rec.comment && (
                                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                             <MessageSquare size={8} />
                                             {rec.comment}
                                          </span>
                                        )}
                                        <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest opacity-30 mt-0.5">Trace Ref: {rec.employeeId}</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="col-span-1 md:col-span-3 text-center">
                                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border tracking-widest ${rec.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                     {rec.status}
                                  </span>
                               </div>
                               <div className="col-span-1 md:col-span-3 text-right">
                                  <div className="flex flex-col items-end">
                                     <span className="text-[10px] font-black text-slate-900 tabular-nums">{(8 + rec.overtimeHours).toFixed(1)}H Total</span>
                                     {rec.overtimeHours > 0 && <span className="text-[7px] font-black text-indigo-500 uppercase">+{rec.overtimeHours.toFixed(1)}H OT</span>}
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
