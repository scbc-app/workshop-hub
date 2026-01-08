
import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Gem, RotateCcw, Save, CheckCircle2, Zap, Clock, ShieldAlert, Scale, ShieldCheck, UserCheck, Users, Info, ChevronDown, User, MessageSquare, Calculator } from 'lucide-react';
import Card from '../components/Card';
import { syncToGoogleSheets } from '../services/sheetService';
import { Team, Shift, AttendanceRecord, DayType, Employee } from '../types';

const AttendancePage: React.FC<{ 
  teams: Team[]; 
  shifts: Shift[]; 
  history: AttendanceRecord[];
  onSave: (records: AttendanceRecord[]) => void;
  setSystemBusy: (busy: boolean) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
  currentUser: Employee;
}> = ({ teams, shifts, history, onSave, setSystemBusy, hasPermission, currentUser }) => {
  const [selectedShiftId, setSelectedShiftId] = useState(shifts[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [records, setRecords] = useState<Record<string, { status: 'Present' | 'Absent'; totalHours: number; comment: string }>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const canCreate = hasPermission('shifts', 'create', 'attendance');
  const scope = currentUser.visibilityScope || 'SELF';

  const hasExistingRecords = useMemo(() => {
    return history.some(h => h.date === selectedDate && h.shiftId === selectedShiftId);
  }, [history, selectedDate, selectedShiftId]);

  useEffect(() => {
    if (hasExistingRecords) {
      const existing = history.filter(h => h.date === selectedDate && h.shiftId === selectedShiftId);
      const mappedRecords: Record<string, { status: 'Present' | 'Absent'; totalHours: number; comment: string }> = {};
      existing.forEach(r => {
        mappedRecords[r.employeeId] = {
          status: r.status,
          totalHours: r.status === 'Present' ? (r.overtimeHours + 8) : 0,
          comment: r.comment || ''
        };
      });
      setRecords(mappedRecords);
    } else {
      setRecords({});
    }
  }, [hasExistingRecords, selectedDate, selectedShiftId, history]);

  const currentDayType = useMemo(() => {
    const d = new Date(selectedDate);
    if (isHoliday) return DayType.HOLIDAY;
    if (d.getDay() === 0) return DayType.SUNDAY;
    return DayType.STANDARD;
  }, [isHoliday, selectedDate]);

  const otMultiplier = useMemo(() => {
    return currentDayType === DayType.STANDARD ? 1.5 : 2.0;
  }, [currentDayType]);

  const shiftIndex = shifts.findIndex(s => s.id === selectedShiftId);
  const rawTeam = teams[shiftIndex];

  const filteredMembers = useMemo(() => {
    if (!rawTeam) return [];
    if (scope === 'ALL') return rawTeam.members;
    if (scope === 'TEAM') {
       const isInTeam = currentUser.teamId === rawTeam.id || currentUser.teamName === rawTeam.name;
       return isInTeam ? rawTeam.members : rawTeam.members.filter(m => m.id === currentUser.id);
    }
    return rawTeam.members.filter(m => m.id === currentUser.id);
  }, [rawTeam, scope, currentUser]);

  const setStatus = (empId: string, status: 'Present' | 'Absent') => {
    if (hasExistingRecords || !canCreate) return;
    setRecords(prev => ({
      ...prev,
      [empId]: { status, totalHours: status === 'Present' ? 8 : 0, comment: prev[empId]?.comment || '' }
    }));
  };

  const handleHoursChange = (empId: string, hours: string) => {
    if (hasExistingRecords || !canCreate) return;
    const h = parseFloat(hours) || 0;
    setRecords(prev => ({
      ...prev,
      [empId]: { ...prev[empId], totalHours: h, status: h > 0 ? 'Present' : 'Absent' }
    }));
  };

  const handleCommentChange = (empId: string, comment: string) => {
    if (hasExistingRecords || !canCreate) return;
    setRecords(prev => ({
      ...prev,
      [empId]: { ...(prev[empId] || { status: 'Present', totalHours: 8 }), comment }
    }));
  };

  const submitAttendance = async () => {
    if (!rawTeam || hasExistingRecords || !canCreate) return;
    setIsSyncing(true);
    setSystemBusy(true);
    const finalRecords: AttendanceRecord[] = filteredMembers.map(emp => {
      const data = records[emp.id] || { status: 'Present', totalHours: 8, comment: '' };
      const ot = Math.max(0, data.totalHours - 8);
      return {
        date: selectedDate,
        employeeId: emp.id,
        shiftId: selectedShiftId,
        status: data.status,
        overtimeHours: ot,
        comment: data.comment,
        dayType: currentDayType
      };
    });
    try {
      await syncToGoogleSheets(finalRecords);
      onSave(finalRecords);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch(e) {
      alert("Error: Attendance save failed.");
    } finally {
      setIsSyncing(false);
      setSystemBusy(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
      {scope !== 'ALL' && (
        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl border border-indigo-100 flex items-center space-x-3 mx-1">
          <ShieldCheck size={14} />
          <p className="text-[8px] font-black uppercase tracking-widest leading-none">Access: View limited to {scope === 'TEAM' ? 'Team' : 'Personal'} records.</p>
        </div>
      )}

      {showSuccess && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg flex items-center justify-between mx-1">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={14} />
            <p className="text-[8px] font-black uppercase tracking-widest">Attendance Saved</p>
          </div>
        </div>
      )}

      {hasExistingRecords && (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-md flex items-center justify-between border border-white/5 mx-1">
          <div className="flex items-center space-x-3">
            <ShieldAlert size={14} className="text-indigo-400" />
            <p className="text-[8px] font-black uppercase tracking-widest">Record Locked</p>
          </div>
        </div>
      )}

      <div className={`p-4 rounded-[1.5rem] border transition-all duration-300 mx-1 ${hasExistingRecords ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
            <div className="space-y-1">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
              <input type="date" disabled={isSyncing} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-[10px] font-black text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift</label>
              <div className="relative">
                <select 
                  disabled={isSyncing} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-[10px] font-black text-slate-700 outline-none appearance-none uppercase focus:ring-1 focus:ring-indigo-500 shadow-sm" 
                  value={selectedShiftId} 
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                >
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest ml-1">Day Type</label>
              <button disabled={hasExistingRecords || isSyncing || !canCreate} onClick={() => setIsHoliday(!isHoliday)} className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg border transition-all font-black text-[10px] uppercase ${isHoliday ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}>
                <Gem size={14} />
                <span>{isHoliday ? 'Holiday' : 'Standard'}</span>
              </button>
            </div>
          </div>

          <div className="lg:w-48 flex items-end">
            {canCreate && (
              <button onClick={submitAttendance} disabled={isSyncing || hasExistingRecords} className={`w-full py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg transition-all flex items-center justify-center space-x-2 ${hasExistingRecords || isSyncing ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                {isSyncing ? <RotateCcw className="animate-spin" size={14} /> : <Save size={14} />}
                <span>{isSyncing ? 'Saving...' : hasExistingRecords ? 'Locked' : 'Save Attendance'}</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap items-center gap-3 px-1 border-t border-slate-50 pt-4">
           <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
              <Calculator size={12} className="text-indigo-600" />
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.1em]">
                Standard OT: <span className="text-slate-900 ml-1">1.5x</span>
              </p>
           </div>
           <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg">
              <Calculator size={12} className="text-indigo-600" />
              <p className="text-[8px] font-black text-indigo-700 uppercase tracking-[0.1em]">
                Double OT: <span className="text-indigo-900 ml-1">2.0x</span>
              </p>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden mx-1">
        <div className="hidden md:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-5">Employee</div>
           <div className="col-span-2 text-center">Status</div>
           <div className="col-span-2 text-center">Total Hours</div>
           <div className="col-span-3 text-right">Summary</div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredMembers.length === 0 ? (
            <div className="py-24 text-center">
              <Users size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No staff found</p>
            </div>
          ) : filteredMembers.map(emp => {
            const current = records[emp.id] || { status: 'Present', totalHours: 8, comment: '' };
            const ot = Math.max(0, current.totalHours - 8);
            const weight = (current.totalHours - ot) + (ot * otMultiplier);

            return (
              <div key={emp.id} className="group p-5 md:px-8 md:py-4 hover:bg-indigo-50/20 transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    <div className="col-span-1 md:col-span-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm shrink-0 shadow-sm group-hover:shadow-indigo-100 transition-all duration-500">
                            {emp.name.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className={`font-black text-slate-900 text-sm uppercase tracking-tight truncate ${emp.role !== 'Member' ? 'text-indigo-600' : 'text-slate-900'}`}>{emp.name}</span>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{emp.section}</span>
                              <span className="text-[8px] font-bold text-slate-100">|</span>
                              <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest">{emp.id}</span>
                            </div>
                            {current.status === 'Absent' && (
                              <div className="mt-3 flex items-center space-x-2 animate-in slide-in-from-top-1 duration-300">
                                <div className="w-6 h-6 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shadow-inner border border-rose-100">
                                   <MessageSquare size={10} className="shrink-0" />
                                </div>
                                <input 
                                  type="text" 
                                  disabled={hasExistingRecords || isSyncing || !canCreate}
                                  className="bg-white border-2 border-rose-100 rounded-xl px-3 py-2 text-[8px] font-black uppercase text-rose-700 w-full outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-300 transition-all placeholder:text-rose-200 shadow-sm"
                                  placeholder="REASON FOR ABSENCE..."
                                  value={current.comment || ''}
                                  onChange={(e) => handleCommentChange(emp.id, e.target.value)}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-4 flex items-center justify-between md:justify-around gap-4 md:gap-0">
                        <div className="flex items-center space-x-1.5 p-0.5 bg-slate-50 border border-slate-100 rounded-xl w-fit">
                           <button disabled={hasExistingRecords || isSyncing || !canCreate} onClick={() => setStatus(emp.id, 'Present')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all active:scale-90 ${current.status === 'Present' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>P</button>
                           <button disabled={hasExistingRecords || isSyncing || !canCreate} onClick={() => setStatus(emp.id, 'Absent')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all active:scale-90 ${current.status === 'Absent' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>A</button>
                        </div>

                        <div className="flex items-center space-x-2 bg-white md:bg-transparent px-3 py-1.5 md:p-0 rounded-xl md:rounded-none border border-slate-100 md:border-0 shadow-sm md:shadow-none">
                           <input type="number" step="0.5" disabled={hasExistingRecords || isSyncing || !canCreate} className="w-14 bg-slate-50 md:bg-white border border-slate-200 rounded-lg text-center text-sm font-black py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" value={current.totalHours || ''} onChange={(e) => handleHoursChange(emp.id, e.target.value)} placeholder="8.0" />
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 text-right">
                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-0 border-slate-50 pt-3 md:pt-0">
                           <span className="md:hidden text-[8px] font-black text-slate-300 uppercase tracking-widest">Total:</span>
                           <div className="flex flex-col items-end">
                              <span className={`text-[11px] font-black ${ot > 0 ? 'text-indigo-600' : 'text-slate-200'}`}>{ot > 0 ? `+${ot.toFixed(1)}H OT` : 'Standard'}</span>
                              <span className="text-[7px] font-black text-slate-400 uppercase mt-1 tracking-widest leading-none">{weight.toFixed(1)}H Weighted</span>
                           </div>
                        </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="px-8 py-4 bg-[#0F1135] rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between text-white shadow-2xl border border-white/5 gap-3 mx-1">
         <div className="flex items-center space-x-3">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em]">{isSyncing ? 'Synchronizing...' : 'Register Connection Ready'}</p>
         </div>
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">Total Personnel: <span className="text-white font-black ml-1.5">{filteredMembers.length}</span></p>
      </div>
    </div>
  );
};

export default AttendancePage;
