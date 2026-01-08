import React, { useMemo } from 'react';
import { Users, CheckCircle2, Sun, Moon, AlertCircle, Clock, Activity, Zap, Wrench, ShieldAlert, DollarSign, RefreshCw, History } from 'lucide-react';
import { Team, Shift, AttendanceRecord, ShiftType, ToolAsset, ToolUsageRecord, MaintenanceRecord } from '../types';
import Card from '../components/Card';

interface DashboardProps {
  teams: Team[];
  shifts: Shift[];
  history: AttendanceRecord[];
  tools?: ToolAsset[];
  usageLogs?: ToolUsageRecord[];
  maintenanceRecords?: MaintenanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  teams, 
  shifts, 
  history, 
  tools = [], 
  usageLogs = [], 
  maintenanceRecords = [] 
}) => {
  const presentToday = history.filter(h => h.date === new Date().toISOString().split('T')[0] && h.status === 'Present').length;
  const totalEmployees = teams.reduce((acc, t) => acc + t.members.length, 0);

  const assetStats = useMemo(() => {
    const totalValue = tools.reduce((acc, t) => acc + (t.monetaryValue * t.quantity), 0);
    const criticalCount = tools.filter(t => t.condition === 'Damaged' || t.condition === 'Lost').length;
    
    const zoneMap: Record<string, number> = {};
    tools.forEach(t => {
      zoneMap[t.zone] = (zoneMap[t.zone] || 0) + t.available;
    });

    return { totalValue, criticalCount, zoneMap };
  }, [tools]);

  const activeShift = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    return shifts.find(s => {
      if (!s.startTime || !s.endTime) return false;
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return start < end ? (currentMins >= start && currentMins < end) : (currentMins >= start || currentMins < end);
    });
  }, [shifts]);

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-1">
         <div className="flex items-center space-x-2 md:space-x-3">
            <Activity size={18} className="text-indigo-600 hidden sm:inline" />
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-900">Operational Pulse</h2>
         </div>
         <div className="flex items-center space-x-2 bg-indigo-600 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl shadow-lg shadow-indigo-100">
            <RefreshCw size={12} className="animate-spin-slow" />
            <span className="text-[8px] md:text-[9px] font-black uppercase">Live Sync: {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        <Card className="flex items-center space-x-3 md:space-x-4 p-4 md:p-5 border-none shadow-sm transition-all">
          <div className="p-2 md:p-3 bg-slate-100 rounded-lg md:rounded-2xl shrink-0">
            <Users className="text-slate-600 h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Workforce</p>
            <p className="text-sm md:text-xl font-black text-slate-900">{totalEmployees}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-3 md:space-x-4 p-4 md:p-5 border-none shadow-sm transition-all">
          <div className="p-2 md:p-3 bg-emerald-50 rounded-lg md:rounded-2xl shrink-0">
            <CheckCircle2 className="text-emerald-600 h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-emerald-600 uppercase tracking-widest truncate">Filed Today</p>
            <p className="text-sm md:text-xl font-black text-slate-900">{presentToday || 0}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-3 md:space-x-4 p-4 md:p-5 border-none shadow-sm transition-all bg-[#0F1135] text-white col-span-2 md:col-span-1">
          <div className="p-2 md:p-3 bg-indigo-500 text-white rounded-lg md:rounded-2xl shrink-0">
            <Zap className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-indigo-300 uppercase tracking-widest truncate">Live Cycle</p>
            <p className="text-sm md:text-xl font-black truncate">{activeShift ? activeShift.name : 'Resting'}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-3 md:space-x-4 p-4 md:p-5 border-none shadow-sm transition-all">
          <div className="p-2 md:p-3 bg-orange-50 rounded-lg md:rounded-2xl shrink-0">
            <DollarSign className="text-orange-600 h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Liquidity</p>
            <p className="text-sm md:text-xl font-black text-slate-900 leading-none">
              ${(assetStats.totalValue / 1000).toFixed(1)}k
            </p>
          </div>
        </Card>

        <Card className="flex items-center space-x-3 md:space-x-4 p-4 md:p-5 border-none shadow-sm transition-all">
          <div className={`p-2 md:p-3 rounded-lg md:rounded-2xl shrink-0 ${assetStats.criticalCount > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            <ShieldAlert className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0">
            <p className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest truncate ${assetStats.criticalCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>Flags</p>
            <p className="text-sm md:text-xl font-black text-slate-900 leading-none">{assetStats.criticalCount}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <Card className="lg:col-span-5 p-0 overflow-hidden border-slate-100 shadow-sm rounded-2xl md:rounded-[2rem]">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <Activity size={16} className="text-indigo-600" />
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-widest">Shift Protocol</h3>
            </div>
            <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">Verified</span>
          </div>
          <div className="p-5 md:p-6">
              <div className="p-4 md:p-5 bg-slate-900 rounded-xl md:rounded-[2rem] space-y-4">
                 <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div className="space-y-1">
                       <p className="text-[7px] font-black text-white/30 uppercase">End Session</p>
                       <p className="text-[10px] font-black text-white uppercase">SAT 05:00</p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[7px] font-black text-white/30 uppercase">Resume Session</p>
                       <p className="text-[10px] font-black text-emerald-400 uppercase">MON 07:30</p>
                    </div>
                 </div>
              </div>
          </div>
        </Card>

        <Card className="lg:col-span-7 p-0 overflow-hidden border-slate-100 shadow-sm rounded-2xl md:rounded-[2rem]">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <Users size={16} className="text-indigo-600" />
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-widest">Active Cycle</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="py-3 px-6">Shift Domain</th>
                  <th className="py-3 px-6 text-right">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shifts.map((shift, idx) => (
                  <tr key={shift.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 px-6">
                       <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded-lg ${shift.type === ShiftType.DAY ? 'bg-orange-50 text-orange-600' : 'bg-slate-900 text-white'}`}>
                             {shift.type === ShiftType.DAY ? <Sun size={12} /> : <Moon size={12} />}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase text-[10px] leading-none">{shift.name}</p>
                            <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{shift.startTime} – {shift.endTime}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className="text-[10px] font-black text-indigo-600 uppercase">{teams[idx]?.members.length || 0} PERS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;