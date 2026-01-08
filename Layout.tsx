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
  RefreshCw
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
  notifications: any;
  shiftsSubPage: string;
  currentUser: Employee | null;
  hasPermission: (tab: string) => boolean;
  shifts: Shift[];
  isSyncingBackground?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  setIsCollapsed, 
  onLogout, 
  notifications, 
  shiftsSubPage, 
  currentUser,
  hasPermission,
  shifts = [],
  isSyncingBackground = false
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
  const myTasksCount = notifications.list.filter((n: any) => n.type === 'alert' && !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-slate-100 flex-shrink-0 hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out z-20 ${isCollapsed ? 'w-[70px]' : 'w-64'}`}>
        <div className={`flex items-center p-5 mb-3 overflow-hidden ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shrink-0">S</div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2">
              <h1 className="text-base font-black text-slate-900 leading-none">ShiftPro</h1>
              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mt-1">Operational Enterprise</p>
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
          {hasPermission('registry') && <SidebarItem icon={<Contact />} label="Staff Registry" active={activeTab === 'registry'} collapsed={isCollapsed} onClick={() => onTabChange('registry')} />}
          {hasPermission('shifts') && <SidebarItem icon={<Layers />} label="Shifts Hub" active={activeTab === 'shifts'} collapsed={isCollapsed} onClick={() => onTabChange('shifts')} />}
          {hasPermission('inventory') && <SidebarItem icon={<Wrench />} label="Tools Inventory" active={activeTab === 'inventory'} collapsed={isCollapsed} onClick={() => onTabChange('inventory')} badgeCount={myTasksCount} />}
        </nav>

        <div className="p-2.5 mt-auto border-t border-slate-50 space-y-0.5">
          <SidebarItem icon={<UserCircle />} label="Settings" active={activeTab === 'profile'} collapsed={isCollapsed} onClick={() => onTabChange('profile')} />
          {hasPermission('settings') && <SidebarItem icon={<Settings />} label="System Settings" active={activeTab === 'settings'} collapsed={isCollapsed} onClick={() => onTabChange('settings')} />}
          <SidebarItem icon={<LogOut />} label="Logout" active={false} collapsed={isCollapsed} onClick={onLogout} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <header className="bg-white border-b border-slate-100 h-14 md:h-16 flex items-center justify-between px-5 md:px-8 shrink-0 z-10">
          <div className="flex items-center space-x-5">
             <div className="w-7 h-7 md:hidden bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">S</div>
             
             <div className="hidden lg:flex items-center space-x-2.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                <div className="relative">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                   <div className="absolute inset-0 w-1 h-1 rounded-full bg-emerald-500 animate-ping opacity-30"></div>
                </div>
                <div className="flex items-center space-x-1.5">
                   <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">LIVE STATUS</span>
                   <div className="h-2 w-px bg-slate-200 mx-0.5"></div>
                   {activeShift ? (
                     <div className={`flex items-center space-x-1 ${activeShift.type === ShiftType.DAY ? 'text-orange-600' : 'text-indigo-600'}`}>
                        {activeShift.type === ShiftType.DAY ? <Sun size={10} /> : <Moon size={10} />}
                        <span className="text-[8px] font-black uppercase tracking-tight">{activeShift.name} ({activeShift.type})</span>
                     </div>
                   ) : (
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Transition</span>
                   )}
                </div>
             </div>

             {isSyncingBackground && (
               <div className="hidden sm:flex items-center space-x-2 animate-in slide-in-from-left-2">
                  <RefreshCw size={10} className="text-indigo-600 animate-spin" />
                  <span className="text-[7px] font-black text-indigo-600 uppercase tracking-widest">Revalidating Registry...</span>
               </div>
             )}

             <h2 className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] truncate lg:border-l lg:border-slate-100 lg:pl-5">
               {activeTab === 'shifts' ? `HUB > ${shiftsSubPage.toUpperCase()}` : 
                activeTab === 'inventory' ? 'TOOLS INVENTORY' :
                activeTab === 'profile' ? 'SETTINGS' :
                activeTab.toUpperCase()}
             </h2>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="relative">
              <button 
                onClick={() => notifications.setShow(!notifications.show)} 
                className={`p-1.5 rounded-lg border transition-all relative ${notifications.show ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-600 border-2 border-white rounded-full text-[6px] font-black text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            <div className="px-2.5 h-8 md:h-9 rounded-lg bg-slate-900 items-center justify-center text-white font-black shadow-md text-[8px] md:text-[9px] flex shrink-0 border border-slate-100 uppercase tracking-tight">
              <div className="flex flex-col items-center">
                 <span className="leading-none">{currentUser?.name?.split(' ')[0]}</span>
                 <span className="text-[5px] opacity-60 mt-0.5">{currentUser?.accessLevel}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full pb-28 md:pb-8">
            {children}
          </div>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-white/10 p-2 z-[100] flex justify-around shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {hasPermission('dashboard') && <button onClick={() => onTabChange('dashboard')} className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-white bg-indigo-600' : 'text-slate-400'}`}><LayoutDashboard size={18} /></button>}
        {hasPermission('shifts') && <button onClick={() => onTabChange('shifts')} className={`p-3 rounded-xl transition-all ${activeTab === 'shifts' ? 'text-white bg-indigo-600' : 'text-slate-400'}`}><Layers size={18} /></button>}
        {hasPermission('inventory') && <button onClick={() => onTabChange('inventory')} className={`p-3 rounded-xl transition-all relative ${activeTab === 'inventory' ? 'text-white bg-indigo-600' : 'text-slate-400'}`}>
          <Wrench size={18} />
          {myTasksCount > 0 && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-rose-600 border border-white rounded-full text-[6px] font-black text-white flex items-center justify-center animate-pulse">
              {myTasksCount}
            </span>
          )}
        </button>}
        <button onClick={() => onTabChange('profile')} className={`p-3 rounded-xl transition-all ${activeTab === 'profile' ? 'text-white bg-indigo-600' : 'text-slate-400'}`}><UserCircle size={18} /></button>
      </nav>
    </div>
  );
};

export default Layout;