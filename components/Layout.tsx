
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Contact, 
  Layers, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft, 
  Bell, 
  Wrench, 
  UserCircle, 
  Clock,
  Zap,
  Sun,
  Moon,
  RefreshCw,
  Info,
  AlertCircle,
  CheckCircle2,
  Inbox,
  ShieldAlert
} from 'lucide-react';
import SidebarItem from './SidebarItem';
import { Employee, Shift, ShiftType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  onLogout: () => void;
  onRefresh?: () => void;
  notifications: any;
  shiftsSubPage: string;
  managerialSubPage: string;
  currentUser: Employee | null;
  hasPermission: (tab: string) => boolean;
  shifts: Shift[];
  isSyncingBackground?: boolean;
  isOffline?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  setIsCollapsed, 
  onLogout, 
  onRefresh,
  notifications, 
  shiftsSubPage, 
  managerialSubPage,
  currentUser,
  hasPermission,
  shifts = [],
  isSyncingBackground = false,
  isOffline = false
}) => {
  const notificationRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        notifications.setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifications]);

  const activeShift = useMemo(() => {
    if (!shifts || shifts.length === 0) return null;
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    return shifts.find(s => {
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;
      return start < end ? (now >= start && now < end) : (now >= start || now < end);
    });
  }, [shifts, currentTime]);

  const unreadCount = notifications.list.filter((n: any) => !n.read).length;
  const majorAlertCount = notifications.list.filter((n: any) => (n.type === 'alert') && !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-slate-100 flex-shrink-0 hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out z-20 ${isCollapsed ? 'w-[70px]' : 'w-64'}`}>
        <div className={`flex items-center p-5 mb-3 overflow-hidden ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shrink-0">W</div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2">
              <h1 className="text-base font-black text-slate-900 leading-none uppercase">Workshop Hub</h1>
              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-1">Staff & Tool Management</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-2.5 top-16 bg-white border border-slate-100 rounded-full p-1 shadow-sm hover:bg-slate-50 z-30 transition-transform active:scale-90"
        >
          {isCollapsed ? <ChevronRight size={12} className="text-slate-400" /> : <ChevronLeft size={12} className="text-slate-400" />}
        </button>

        <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto no-scrollbar pt-3">
          {hasPermission('dashboard') && <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} collapsed={isCollapsed} onClick={() => onTabChange('dashboard')} />}
          {hasPermission('registry') && <SidebarItem icon={<Contact />} label="Staff List" active={activeTab === 'registry'} collapsed={isCollapsed} onClick={() => onTabChange('registry')} />}
          {hasPermission('shifts') && <SidebarItem icon={<Layers />} label="Shifts" active={activeTab === 'shifts'} collapsed={isCollapsed} onClick={() => onTabChange('shifts')} />}
          {hasPermission('inventory') && <SidebarItem icon={<Wrench />} label="Tools" active={activeTab === 'inventory'} collapsed={isCollapsed} onClick={() => onTabChange('inventory')} badgeCount={majorAlertCount} />}
          {hasPermission('managerial') && <SidebarItem icon={<ShieldAlert />} label="Management" active={activeTab === 'managerial'} collapsed={isCollapsed} onClick={() => onTabChange('managerial')} />}
        </nav>

        <div className="p-2.5 mt-auto border-t border-slate-50 space-y-0.5">
          <SidebarItem icon={<UserCircle />} label="My Profile" active={activeTab === 'profile'} collapsed={isCollapsed} onClick={() => onTabChange('profile')} />
          {hasPermission('settings') && <SidebarItem icon={<Settings />} label="Settings" active={activeTab === 'settings'} collapsed={isCollapsed} onClick={() => onTabChange('settings')} />}
          <SidebarItem icon={<LogOut />} label="Logout" active={false} collapsed={isCollapsed} onClick={onLogout} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <header className="bg-white border-b border-slate-100 h-14 md:h-16 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center space-x-2 md:space-x-5 min-w-0">
             <div className="w-7 h-7 md:hidden bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">W</div>
             
             <div className="hidden lg:flex items-center space-x-2.5 bg-slate-50 border border-slate-100 px-2 md:px-2.5 py-1 rounded-xl shrink-0">
                <div className="relative">
                   <div className={`w-1 h-1 rounded-full ${isOffline ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
                </div>
                <div className="flex items-center space-x-1.5">
                   <span className={`text-[6px] font-bold uppercase tracking-wider hidden lg:inline ${isOffline ? 'text-rose-500' : 'text-slate-400'}`}>
                      {isOffline ? 'OFFLINE' : 'STATUS'}
                   </span>
                   {activeShift ? (
                     <div className={`flex items-center space-x-1 ${activeShift.type === ShiftType.DAY ? 'text-orange-600' : 'text-indigo-600'}`}>
                        {activeShift.type === ShiftType.DAY ? <Sun size={10} /> : <Moon size={10} />}
                        <span className="text-[8px] font-semibold uppercase tracking-tight">{activeShift.name}</span>
                     </div>
                   ) : (
                     <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-tight">Resting</span>
                   )}
                </div>
             </div>

             <h2 className="text-[8px] md:text-[10px] font-bold text-slate-900 uppercase tracking-wider truncate border-l border-slate-100 pl-2 md:pl-5 min-w-0">
               {activeTab === 'shifts' ? `SHIFTS > ${shiftsSubPage.toUpperCase()}` : 
                activeTab === 'inventory' ? 'TOOLS' :
                activeTab === 'profile' ? 'PROFILE' :
                activeTab.toUpperCase()}
             </h2>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
            {(isSyncingBackground || onRefresh) && (
              <button 
                onClick={onRefresh} 
                disabled={isSyncingBackground || isOffline}
                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
                title="Sync Data"
              >
                <RefreshCw size={14} className={isSyncingBackground ? 'animate-spin' : ''} />
              </button>
            )}

            {/* NOTIFICATION HUB */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => notifications.setShow(!notifications.show)} 
                className={`p-1.5 md:p-2 rounded-lg border transition-all relative shrink-0 ${notifications.show ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 shadow-sm'}`}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-600 border-2 border-white rounded-full text-[6px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifications.show && (
                <div className="absolute right-0 mt-3 w-[280px] sm:w-[350px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[50] animate-in slide-in-from-top-2 duration-300">
                  <div className="px-6 py-4 bg-slate-50/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Workshop Alerts</h4>
                      <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Live Updates</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[6px] font-black text-slate-400 uppercase">System Active</span>
                    </div>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto no-scrollbar divide-y divide-slate-50">
                    {notifications.list.length === 0 ? (
                      <div className="py-16 text-center">
                        <Inbox size={32} className="mx-auto text-slate-100 mb-3" />
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">No Messages</p>
                      </div>
                    ) : (
                      notifications.list.map((n: any) => (
                        <div key={n.id} className={`p-5 hover:bg-slate-50 transition-colors flex gap-4 items-start ${!n.read ? 'bg-indigo-50/10' : ''}`}>
                          <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                            n.type === 'alert' ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                            n.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            'bg-indigo-50 text-indigo-500 border border-indigo-100'
                          }`}>
                            {n.type === 'alert' ? <AlertCircle size={16} /> :
                             n.type === 'success' ? <CheckCircle2 size={16} /> :
                             <Info size={16} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-1.5">{n.title}</h5>
                            <p className="text-[9px] font-medium text-slate-500 leading-relaxed mb-2">{n.message}</p>
                            <div className="flex items-center gap-1.5 text-[7px] font-black text-slate-300 uppercase tracking-widest">
                              <Clock size={10} />
                              <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {!n.read && (
                                <>
                                  <span className="text-indigo-200">•</span>
                                  <span className="text-indigo-500">New</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 text-center">
                    <button 
                      onClick={() => notifications.setShow(false)}
                      className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-2 h-8 md:h-10 rounded-lg bg-slate-900 items-center justify-center text-white font-semibold shadow-md text-[8px] md:text-[9px] flex shrink-0 border border-slate-100 uppercase tracking-tight">
              <div className="flex flex-col items-center">
                 <span className="leading-none">{currentUser?.name?.split(' ')[0]}</span>
                 <span className="text-[5px] opacity-60 mt-0.5 hidden md:inline">{currentUser?.accessLevel}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-3 md:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto w-full pb-20 md:pb-0">
            {children}
          </div>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-white/10 p-2 z-[100] flex justify-around shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {hasPermission('dashboard') && <button onClick={() => onTabChange('dashboard')} className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-white bg-indigo-600 shadow-lg scale-110' : 'text-slate-400'}`}><LayoutDashboard size={20} /></button>}
        {hasPermission('shifts') && <button onClick={() => onTabChange('shifts')} className={`p-3 rounded-xl transition-all ${activeTab === 'shifts' ? 'text-white bg-indigo-600 shadow-lg scale-110' : 'text-slate-400'}`}><Layers size={20} /></button>}
        {hasPermission('inventory') && <button onClick={() => onTabChange('inventory')} className={`p-3 rounded-xl transition-all relative ${activeTab === 'inventory' ? 'text-white bg-indigo-600 shadow-lg scale-110' : 'text-slate-400'}`}>
          <Wrench size={20} />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 border border-white rounded-full"></span>}
        </button>}
        <button onClick={() => onTabChange('profile')} className={`p-3 rounded-xl transition-all ${activeTab === 'profile' ? 'text-white bg-indigo-600 shadow-lg scale-110' : 'text-slate-400'}`}><UserCircle size={20} /></button>
      </nav>
    </div>
  );
};

export default Layout;
