
import React, { useState } from 'react';
import { RotateCcw, Activity, ClipboardCheck, Users, History, BarChart3, ShieldCheck, ShieldAlert, TrendingUp, MonitorCheck } from 'lucide-react';

// Specialized Logic & Components
import { useAppLogic } from './hooks/useAppLogic';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import { LogoutModal, RotationModal } from './components/Modals';
import GlobalOverlay from './components/GlobalOverlay';

// Page Imports
import Dashboard from './pages/Dashboard';
import TeamsPage from './pages/TeamsPage';
import AttendancePage from './pages/AttendancePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import StaffRegistryPage from './pages/StaffRegistryPage';
import InventoryPage from './pages/InventoryPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import GlobalAuditPage from './pages/GlobalAuditPage';
import OperationalSnapshotPage from './pages/OperationalSnapshotPage';
import AccountabilityMonitor from './components/inventory/AccountabilityMonitor';

const App: React.FC = () => {
  const { auth, navigation, data, notifications, modals, system, isCloudLoading } = useAppLogic();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!auth.isAuthenticated) {
    return (
      <LoginScreen 
        onLogin={auth.handleLogin} 
        isAuthenticating={auth.isAuthenticating} 
        loginSuccess={auth.loginSuccess}
        error={auth.authError} 
        isReady={!isCloudLoading} 
      />
    );
  }

  return (
    <Layout 
      activeTab={navigation.activeTab} 
      onTabChange={navigation.setActiveTab}
      isCollapsed={navigation.isSidebarCollapsed}
      setIsCollapsed={navigation.setIsSidebarCollapsed}
      onLogout={() => setShowLogoutConfirm(true)}
      onRefresh={system.onRefresh}
      notifications={notifications}
      shiftsSubPage={navigation.shiftsSubPage}
      managerialSubPage={navigation.managerialSubPage}
      currentUser={auth.currentUser}
      hasPermission={navigation.hasPermission}
      shifts={data.shifts} 
      isSyncingBackground={system.isSyncingBackground}
      isOffline={system.isOffline}
    >
      <GlobalOverlay isVisible={system.isBusy} />

      {showLogoutConfirm && (
        <LogoutModal onConfirm={() => { setShowLogoutConfirm(false); auth.handleLogout(); }} onCancel={() => setShowLogoutConfirm(false)} />
      )}
      
      {navigation.activeTab === 'dashboard' && navigation.hasPermission('dashboard') && (
        <Dashboard 
          teams={data.teams} 
          shifts={data.shifts} 
          history={data.attendanceHistory} 
          tools={data.inventory.tools}
          usageLogs={data.inventory.usageLogs}
          maintenanceRecords={data.inventory.maintenanceHistory}
        />
      )}
      
      {navigation.activeTab === 'registry' && navigation.hasPermission('registry') && (
        <StaffRegistryPage 
          teams={data.teams} masterEmployees={data.masterEmployees} history={data.attendanceHistory}
          sections={data.sections} tierDefaults={data.tierDefaults} onAddMember={data.addMember} 
          onUpdateMember={data.updateMember} onDeleteMember={data.deleteMember} 
          currentUser={auth.currentUser!} isSystemBusy={system.isBusy} setSystemBusy={system.setBusy}
          hasPermission={navigation.hasPermission}
        />
      )}
      
      {navigation.activeTab === 'inventory' && navigation.hasPermission('inventory') && (
        <InventoryPage 
          masterEmployees={data.masterEmployees} currentUser={auth.currentUser!} cloudTools={data.inventory.tools}
          cloudUsageLogs={data.inventory.usageLogs} cloudPhysicalLogs={data.inventory.physicalLogs}
          cloudAuditHistory={data.inventory.auditHistory} 
          cloudMaintenanceHistory={data.inventory.maintenanceHistory}
          onUpdateTools={data.inventory.setTools}
          onDeleteTool={data.inventory.deleteTool}
          onUpdateUsageLogs={data.inventory.setUsageLogs} onUpdatePhysicalLogs={data.inventory.setPhysicalLogs}
          onUpdateAuditHistory={data.inventory.setAuditHistory} isSystemBusy={system.isBusy} setSystemBusy={system.setBusy}
          hasPermission={navigation.hasPermission}
        />
      )}

      {navigation.activeTab === 'managerial' && navigation.hasPermission('managerial') && (
        <div className="space-y-6">
          <div className="flex justify-center w-full mt-2 px-1">
            <div className="flex flex-wrap justify-center items-center gap-2 bg-slate-50/80 backdrop-blur-md p-2 rounded-[2rem] border border-slate-200 shadow-sm transition-all max-w-full overflow-hidden">
              {[
                { id: 'snapshot', icon: <MonitorCheck size={14} />, label: 'Operational Snapshot', perm: 'managerial_snapshot_view' },
                { id: 'audit', icon: <ShieldCheck size={14} />, label: 'Compliance Audit', perm: 'managerial_audit_view' },
                { id: 'resolution', icon: <ShieldAlert size={14} />, label: 'Resolution Hub', perm: 'managerial_resolution_view' }
              ].filter(t => navigation.hasPermission('managerial', 'view', t.id)).map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => navigation.setManagerialSubPage(tab.id as any)} 
                  className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    navigation.managerialSubPage === tab.id 
                      ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100 ring-4 ring-indigo-50/50' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            {navigation.managerialSubPage === 'snapshot' && navigation.hasPermission('managerial', 'view', 'snapshot') && (
              <OperationalSnapshotPage history={data.attendanceHistory} teams={data.teams} masterEmployees={data.masterEmployees} shifts={data.shifts} />
            )}
            {navigation.managerialSubPage === 'audit' && navigation.hasPermission('managerial', 'view', 'audit') && (
              <GlobalAuditPage history={data.attendanceHistory} teams={data.teams} masterEmployees={data.masterEmployees} currentUser={auth.currentUser!} resolveStaffIdentity={data.resolveStaffIdentity} />
            )}
            {navigation.managerialSubPage === 'resolution' && navigation.hasPermission('managerial', 'view', 'resolution') && (
              <div className="animate-in fade-in duration-700">
                <AccountabilityMonitor 
                  monitoredItems={data.inventory.usageLogs.filter(l => l.escalationStatus !== 'Resolved')}
                  staffRegistry={data.masterEmployees}
                  currentUser={auth.currentUser!}
                  onVerify={async (log) => {
                    system.setBusy(true);
                    try {
                      const { syncToolUsage, syncToolAsset, syncMaintenanceRecord } = await import('./services/sheetService');
                      
                      const isDamaged = log.conditionOnReturn === 'Damaged' || (log.comment || '').toUpperCase().includes('DAMAGED');
                      const timestamp = new Date().toLocaleString();
                      
                      const updatedLog = { 
                        ...log, 
                        escalationStatus: 'Resolved' as const, 
                        isReturned: true,
                        comment: (log.comment || '') + ` | RECOVERY VERIFIED BY ${auth.currentUser?.name} | ${timestamp}`,
                        actionHistory: [...(log.actionHistory || []), {
                           stage: log.escalationStage || 'Supervisor',
                           actorName: auth.currentUser?.name || 'Authorized Personnel',
                           action: 'PHYSICAL RECOVERY',
                           timestamp: timestamp,
                           notes: isDamaged ? 'Asset recovered in damaged condition. Staged for maintenance.' : 'Asset restored to master inventory.'
                        }]
                      };
                      await syncToolUsage(updatedLog);
                      data.inventory.setUsageLogs(data.inventory.usageLogs.map(l => l.id === log.id ? updatedLog : l));
                      
                      const tool = data.inventory.tools.find(t => t.id === log.toolId);
                      if (tool) {
                        // Registry Restore Engine: When verifying recovery, we also clean the master composition list of any variance tags
                        const nextComp = tool.composition?.map(p => p.replace(/\s*\(MISSING\)/g, '').replace(/\s*\(DAMAGED\)/g, ''));
                        
                        const updatedTool = { 
                          ...tool, 
                          available: isDamaged ? tool.available : Math.min(tool.quantity, tool.available + log.quantity),
                          condition: isDamaged ? 'Maintenance' as any : 'Good' as any,
                          lastVerified: new Date().toISOString().split('T')[0],
                          composition: nextComp
                        };
                        await syncToolAsset(updatedTool);
                        data.inventory.setTools(data.inventory.tools.map(t => t.id === tool.id ? updatedTool : t));

                        if (isDamaged) {
                           const m = {
                              id: `MNT-RES-${Date.now()}`, toolId: tool.id, toolName: tool.name,
                              reportedBy: auth.currentUser?.name || 'Manager', reportedDate: updatedTool.lastVerified,
                              breakdownContext: `[AUTO_PUSH] Resolution hub identified damage during final recovery. Original custodian: ${log.staffName}.`,
                              isRepairable: null, status: 'Staged' as const
                           };
                           await syncMaintenanceRecord(m);
                           data.inventory.setMaintenanceHistory([m, ...data.inventory.maintenanceHistory]);
                        }
                      }
                    } finally { system.setBusy(false); }
                  }}
                  onResolve={async (logId, action, notes) => {
                    system.setBusy(true);
                    try {
                      const { syncToolUsage } = await import('./services/sheetService');
                      const log = data.inventory.usageLogs.find(l => l.id === logId);
                      if (!log) return;

                      let nextStage = log.escalationStage || 'Supervisor';
                      let nextStatus = log.escalationStatus || 'Pending';
                      let nextExpiry = log.graceExpiryDate;

                      if (action === 'grant_grace') {
                        const exp = new Date();
                        exp.setDate(exp.getDate() + 30);
                        nextExpiry = exp.toISOString().split('T')[0];
                        nextStatus = 'In-Grace-Period';
                      } else if (action === 'escalate_to_manager') {
                        nextStage = 'Manager';
                        nextStatus = 'Pending';
                      } else if (action === 'hr_escalate') {
                        nextStatus = 'Escalated-to-HR';
                      } else if (action === 'cancel_case') {
                        nextStatus = 'Resolved';
                      } else if (action === 'request_further_search') {
                        nextStage = 'Supervisor';
                        nextStatus = 'Pending';
                      }

                      const updatedLog = { 
                        ...log, 
                        escalationStage: nextStage, 
                        escalationStatus: nextStatus as any, 
                        graceExpiryDate: nextExpiry,
                        actionHistory: [...(log.actionHistory || []), {
                          stage: log.escalationStage || 'Supervisor',
                          actorName: auth.currentUser?.name || 'Authority',
                          action: action.toUpperCase().replace(/_/g, ' '),
                          timestamp: new Date().toLocaleString(),
                          notes: notes || 'Command Directive Issued'
                        }]
                      };
                      await syncToolUsage(updatedLog);
                      data.inventory.setUsageLogs(data.inventory.usageLogs.map(l => l.id === logId ? updatedLog : l));
                    } finally { system.setBusy(false); }
                  }}
                  onStartSweep={() => navigation.setActiveTab('inventory')}
                  hasPermission={navigation.hasPermission}
                  resolveStaffIdentity={data.resolveStaffIdentity}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {navigation.activeTab === 'profile' && (
        <ProfileSettingsPage currentUser={auth.currentUser!} onUpdateProfile={async (updated) => {
            system.setBusy(true);
            try {
              const { syncStaffMember, provisionAccess } = await import('./services/sheetService');
              await syncStaffMember(updated);
              if (updated.hasSystemAccess) {
                 await provisionAccess(updated.id, updated.username || updated.email || '', updated.accessLevel || 'Staff', updated.tempPassword, updated.permissions, updated.visibilityScope);
              }
              data.updateMember(updated);
            } finally { system.setBusy(false); }
          }}
        />
      )}
      
      {navigation.activeTab === 'shifts' && navigation.hasPermission('shifts') && (
        <div className="space-y-6">
          <div className="flex justify-center w-full mt-2 px-1">
            <div className="flex flex-wrap justify-center items-center gap-2 bg-slate-50/80 backdrop-blur-md p-2 rounded-[2rem] border border-slate-200 shadow-sm transition-all max-w-full overflow-hidden">
              {[
                { id: 'attendance', icon: <ClipboardCheck size={14} />, label: 'Daily Register', perm: 'shifts_attendance_view' },
                { id: 'teams', icon: <Users size={14} />, label: 'Teams & Roster', perm: 'shifts_teams_view' },
                { id: 'history', icon: <History size={14} />, label: 'Archive Logs', perm: 'shifts_history_view' }
              ].filter(t => navigation.hasPermission('shifts', 'view', t.id)).map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => navigation.setShiftsSubPage(tab.id as any)} 
                  className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    navigation.shiftsSubPage === tab.id 
                      ? 'bg-white text-indigo-600 shadow-lg border border-indigo-100 ring-4 ring-indigo-50/50' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            {navigation.shiftsSubPage === 'attendance' && navigation.hasPermission('shifts', 'view', 'attendance') && (
              <AttendancePage teams={data.teams} shifts={data.shifts} history={data.attendanceHistory}
                onSave={(rec) => data.setAttendanceHistory(prev => [...prev, ...rec])} 
                setSystemBusy={system.setBusy} hasPermission={navigation.hasPermission} currentUser={auth.currentUser!} />
            )}
            {navigation.shiftsSubPage === 'teams' && navigation.hasPermission('shifts', 'view', 'teams') && (
              <TeamsPage teams={data.teams} shifts={data.shifts} sections={data.sections} onMoveMember={() => {}} onAddMember={() => {}} onUpdateMember={() => {}} onDeleteMember={() => {}} hasPermission={navigation.hasPermission} />
            )}
            {navigation.shiftsSubPage === 'history' && navigation.hasPermission('shifts', 'view', 'history') && (
              <HistoryPage history={data.attendanceHistory} shifts={data.shifts} teams={data.teams} currentUser={auth.currentUser!} resolveStaffIdentity={data.resolveStaffIdentity} />
            )}
          </div>
        </div>
      )}
      
      {navigation.activeTab === 'settings' && navigation.hasPermission('settings') && (
        <SettingsPage 
          shifts={data.shifts} 
          config={data.config} 
          onUpdateShifts={data.setShifts} 
          onUpdateConfig={data.setConfig} 
          currentUser={auth.currentUser!}
          tierDefaults={data.tierDefaults}
        />
      )}
    </Layout>
  );
};

export default App;
