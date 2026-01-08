
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { INITIAL_SHIFTS, INITIAL_CONFIG, INITIAL_TEAMS, DEFAULT_SECTIONS, INSTITUTIONAL_PERMISSIONS_SCHEMA } from '../constants';
import { Shift, ShiftConfiguration, Team, AttendanceRecord, Employee, SystemNotification, DayType, AccessLevel, ToolAsset, ToolUsageRecord, PhysicalLogbookRecord, ShiftType, VisibilityScope, MaintenanceRecord, Bulletin, StaffDocument, ExternalResource, PerformanceObservation, GrievanceRecord, EngagementInquiry, EngagementStatus } from '../types';
import { fetchCloudDatabase, deleteStaffMember, deleteToolAsset } from '../services/sheetService';

const STORAGE_KEY = 'SHIFTPRO_PERSISTED_DATABASE';
const STAFF_BLACKLIST_KEY = 'SHIFTPRO_STAFF_DELETION_BLACKLIST';
const TOOL_BLACKLIST_KEY = 'SHIFTPRO_TOOL_DELETION_BLACKLIST';

export const useAppLogic = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSystemBusy, setIsSystemBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'registry' | 'shifts' | 'dashboard' | 'settings' | 'inventory' | 'profile' | 'managerial' | 'hr-vault'>('dashboard');
  const [shiftsSubPage, setShiftsSubPage] = useState<'attendance' | 'teams' | 'history' | 'overtime'>('attendance');
  const [managerialSubPage, setManagerialSubPage] = useState<'snapshot' | 'audit' | 'resolution'>('snapshot');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [rotationMode, setRotationMode] = useState<'standard' | 'maintain' | 'manual'>('standard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [config, setConfig] = useState<ShiftConfiguration>(INITIAL_CONFIG);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [isSyncingBackground, setIsSyncingBackground] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const lastWriteTimestamp = useRef<number>(0);
  const lastSyncTimestamp = useRef<number>(0);
  
  const [staffBlacklist, setStaffBlacklist] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem(STAFF_BLACKLIST_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [toolBlacklist, setToolBlacklist] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem(TOOL_BLACKLIST_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [masterEmployees, setMasterEmployees] = useState<Employee[]>([]);
  const [tools, setTools] = useState<ToolAsset[]>([]);
  const [usageLogs, setUsageLogs] = useState<ToolUsageRecord[]>([]);
  const [physicalLogs, setPhysicalLogs] = useState<PhysicalLogbookRecord[]>([]);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);

  // HR VAULT STATE
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [observations, setObservations] = useState<PerformanceObservation[]>([]);
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [engagementInquiries, setEngagementInquiries] = useState<EngagementInquiry[]>([]);
  
  const tierDefaults = INSTITUTIONAL_PERMISSIONS_SCHEMA;

  const normalize = useCallback((val: any) => String(val || '').replace(/[^a-z0-9]/gi, '').toLowerCase(), []);

  const getFuzzy = useCallback((obj: any, key: string) => {
    if (!obj) return undefined;
    const target = key.toLowerCase().replace(/_/g, '').replace(/\s/g, '');
    const keys = Object.keys(obj);
    // Fix: Added missing second argument to replace() call for whitespace removal on the expected line (approx line 73)
    const exactMatch = keys.find(k => k.toLowerCase().replace(/_/g, '').replace(/\s/g, '') === target);
    if (exactMatch) return obj[exactMatch];
    const fuzzyMatch = keys.find(k => {
        const kNorm = k.toLowerCase().replace(/_/g, '').replace(/\s/g, '');
        return kNorm.includes(target) || target.includes(kNorm);
    });
    return fuzzyMatch ? obj[fuzzyMatch] : undefined;
  }, []);

  const safeParse = useCallback((val: any, fallback: any = [], asArray: boolean = true) => {
    if (!val) return fallback;
    if (typeof val !== 'string') return val;
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith('data:image')) return asArray ? [trimmed] : trimmed;
    try {
      const parsed = JSON.parse(trimmed);
      return asArray && !Array.isArray(parsed) ? [parsed] : parsed;
    } catch (e) {
      if (asArray && trimmed.length > 0) return [trimmed];
      return fallback;
    }
  }, []);

  const parseBool = (val: any) => {
    if (typeof val === 'boolean') return val;
    if (!val) return false;
    const str = String(val).toUpperCase().trim();
    return str === 'TRUE' || str === '1' || str === 'YES';
  };

  const findIdInRow = (row: any) => {
    return getFuzzy(row, 'staffid') || getFuzzy(row, 'employeeid') || getFuzzy(row, 'id') || getFuzzy(row, 'staffnumber') || getFuzzy(row, 'code') || getFuzzy(row, 'employeecode');
  };

  const markWrite = () => { lastWriteTimestamp.current = Date.now(); };

  const processDatabasePayload = useCallback((cloudData: any) => {
    if (!cloudData) return;
    const timeSinceLastWrite = Date.now() - lastWriteTimestamp.current;
    const isWriteLockActive = timeSinceLastWrite < 20000;
    
    // 1. PROCESS STAFF REGISTRY
    if (!isWriteLockActive) {
      const rawRegistry = cloudData.Staff_Registry || [];
      const rawCreds = cloudData.Staff_Credentials || [];
      const credMap = new Map<string, any>();
      
      rawCreds.forEach((c: any) => {
        const sid = normalize(getFuzzy(c, 'staffid') || findIdInRow(c));
        if (sid) credMap.set(sid, c);
      });

      const parsedEmployees: Employee[] = rawRegistry.map((emp: any) => {
        const sidValue = findIdInRow(emp);
        const sid = sidValue ? String(sidValue).trim() : '';
        const cred = credMap.get(normalize(sid));
        
        const dbPassword = String(getFuzzy(cred, 'passhash') || getFuzzy(cred, 'temppassword') || getFuzzy(cred, 'password') || '').trim();
        const dbStatus = String(getFuzzy(cred, 'status') || '').toUpperCase();
        
        const hasRegistryFlag = parseBool(getFuzzy(emp, 'systemaccess'));
        const hasActiveCreds = cred && (dbStatus === 'ACTIVE' || String(getFuzzy(cred, 'active') || '').toUpperCase() === 'TRUE');
        
        return {
          id: sid, 
          name: getFuzzy(emp, 'fullname') || getFuzzy(emp, 'name') || 'Personnel', 
          role: getFuzzy(emp, 'role') || 'Member',
          department: getFuzzy(emp, 'department') || 'Operations',
          section: getFuzzy(emp, 'section') || 'General', 
          teamId: (getFuzzy(emp, 'teamid') || '').toString(),
          teamName: getFuzzy(emp, 'teamname') || '', 
          supervisorName: getFuzzy(emp, 'supervisorname') || getFuzzy(emp, 'superior') || '',
          status: getFuzzy(emp, 'status') || 'Active', 
          phone: getFuzzy(emp, 'phone') || getFuzzy(emp, 'contact') || getFuzzy(emp, 'phonenumber') || getFuzzy(emp, 'tel') || '',
          email: getFuzzy(emp, 'email') || getFuzzy(emp, 'emailaddress') || getFuzzy(emp, 'mail') || '',
          hasSystemAccess: hasRegistryFlag || hasActiveCreds,
          accessLevel: getFuzzy(cred, 'accesslevel') || 'Staff', 
          permissions: (getFuzzy(cred, 'permissions') || '').split(',').filter(Boolean),
          username: getFuzzy(cred, 'username'), 
          tempPassword: dbPassword,
          visibilityScope: (getFuzzy(cred, 'visibilityscope') || 'SELF') as any
        };
      }).filter((e: Employee) => e.id && !staffBlacklist.has(normalize(e.id)));
      setMasterEmployees(parsedEmployees);

      const nextTeams = INITIAL_TEAMS.map(teamShell => {
         const members = parsedEmployees.filter(e => e.teamId === teamShell.id || e.teamName === teamShell.name);
         const supervisor = members.find(m => m.role.includes('Supervisor')) || members[0];
         return { ...teamShell, members, supervisorId: supervisor?.id || '' };
      });
      setTeams(nextTeams);
    }

    // 2. PROCESS TOOLS MASTER
    if (cloudData.Tools_Master && !isWriteLockActive) {
      setTools(cloudData.Tools_Master.map((t: any) => ({
        id: String(getFuzzy(t, 'id')), 
        name: getFuzzy(t, 'name'), 
        category: getFuzzy(t, 'category'),
        zone: getFuzzy(t, 'zone'), 
        quantity: parseInt(getFuzzy(t, 'quantity')) || 0,
        available: parseInt(getFuzzy(t, 'available')) || 0, 
        condition: getFuzzy(t, 'condition'),
        monetaryValue: parseFloat(getFuzzy(t, 'monetaryvalue')) || 0, 
        lastVerified: getFuzzy(t, 'lastverified') || getFuzzy(t, 'date') || '',
        submissionDate: getFuzzy(t, 'submissiondate') || getFuzzy(t, 'lastverified') || getFuzzy(t, 'date') || '',
        addedBy: getFuzzy(t, 'addedby') || '',
        imageUrl: getFuzzy(t, 'imageurl'),
        assetClass: (getFuzzy(t, 'assetclass') || 'Pc') as any, 
        composition: safeParse(getFuzzy(t, 'composition'), [])
      })).filter((t: any) => t.id && !toolBlacklist.has(normalize(t.id))));
    }

    // 3. PROCESS TOOLS USAGE LOGS
    if (cloudData.Tools_Usage_Logs && !isWriteLockActive) {
      setUsageLogs(cloudData.Tools_Usage_Logs.map((l: any) => ({
        id: String(getFuzzy(l, 'id')), batchId: getFuzzy(l, 'batchid'), toolId: getFuzzy(l, 'toolid'),
        toolName: getFuzzy(l, 'toolname'), quantity: parseInt(getFuzzy(l, 'quantity')) || 1,
        staffId: String(getFuzzy(l, 'staffid')), staffName: getFuzzy(l, 'staffname'),
        shiftType: getFuzzy(l, 'shifttype'), date: getFuzzy(l, 'date'), timeOut: getFuzzy(l, 'timeout'),
        timeIn: getFuzzy(l, 'timein'), isReturned: parseBool(getFuzzy(l, 'isreturned')),
        conditionOnReturn: getFuzzy(l, 'conditiononreturn'), attendantId: getFuzzy(l, 'attendantid'),
        attendantName: getFuzzy(l, 'attendantname') || '',
        issuanceType: getFuzzy(l, 'issuancetype') || 'Daily', comment: getFuzzy(l, 'comment'),
        escalationStatus: getFuzzy(l, 'escalationstatus'), escalationStage: getFuzzy(l, 'escalationstage'),
        monetaryValue: parseFloat(getFuzzy(l, 'monetaryvalue')) || 0, physicalArchiveId: getFuzzy(l, 'physicalarchiveid'),
        actionHistory: safeParse(getFuzzy(l, 'actionhistory'), [])
      })));
    }

    // 4. PROCESS PHYSICAL ARCHIVES
    if (cloudData.Tools_Physical_Archives && !isWriteLockActive) {
      setPhysicalLogs(cloudData.Tools_Physical_Archives.map((p: any) => ({
        id: String(getFuzzy(p, 'id')), date: getFuzzy(p, 'date'), shiftType: getFuzzy(p, 'shifttype'),
        attendantId: getFuzzy(p, 'attendantid'), attendantName: getFuzzy(p, 'attendantname'),
        imageUrls: safeParse(getFuzzy(p, 'imageurls'), []), pageNumber: getFuzzy(p, 'pagenumber'),
        notes: getFuzzy(p, 'notes'), timestamp: getFuzzy(p, 'timestamp')
      })));
    }

    // 5. PROCESS AUDIT HISTORY
    if (cloudData.Tools_Audit_History && !isWriteLockActive) {
      setAuditHistory(cloudData.Tools_Audit_History.map((a: any) => ({
        id: String(getFuzzy(a, 'id')), date: getFuzzy(a, 'date'), section: getFuzzy(a, 'section'),
        inspector: getFuzzy(a, 'inspector'), shiftType: getFuzzy(a, 'shifttype'),
        issues: safeParse(getFuzzy(a, 'issues'), []), signature: getFuzzy(a, 'signature')
      })));
    }

    // 6. PROCESS MAINTENANCE
    if (cloudData.Tools_Maintenance && !isWriteLockActive) {
        const parsedMaintenance = cloudData.Tools_Maintenance.map((m:any) => ({
            id: String(getFuzzy(m, 'id')), toolId: getFuzzy(m, 'toolid'), toolName: getFuzzy(m, 'toolname'),
            reportedBy: getFuzzy(m, 'reportedby'), reportedDate: getFuzzy(m, 'reporteddate'),
            breakdownContext: getFuzzy(m, 'breakdowncontext'), isRepairable: parseBool(getFuzzy(m, 'isrepairable')),
            status: getFuzzy(m, 'status'), resolutionDate: getFuzzy(m, 'resolutiondate'),
            technicianNotes: getFuzzy(m, 'techniciannotes'), estimatedCost: parseFloat(getFuzzy(m, 'estimatedcost')) || 0,
            assignedStaffId: getFuzzy(m, 'assignedstaffid'), assignedStaffName: getFuzzy(m, 'assignedstaffname'),
            isEscalatedToSupervisor: parseBool(getFuzzy(m, 'isescalatedtosupervisor')),
            escalationNotes: getFuzzy(m, 'escalationnotes')
        }));
        setMaintenanceHistory(parsedMaintenance);

        if (currentUser) {
            setNotifications(prev => {
                const ids = new Set(prev.map(n => n.id));
                const newAlerts: SystemNotification[] = [];
                parsedMaintenance.forEach((m: MaintenanceRecord) => {
                    if (m.assignedStaffId === currentUser.id && m.status === 'Staged' && !ids.has(`MNT-ASG-${m.id}`)) {
                        newAlerts.push({
                            id: `MNT-ASG-${m.id}`,
                            title: 'New Repair Assignment',
                            message: `Urgent breakdown reported for ${m.toolName}.`,
                            type: 'alert', timestamp: new Date(), read: false
                        });
                    }
                });
                return [...newAlerts, ...prev];
            });
        }
    }

    // 7. PROCESS ATTENDANCE HISTORY
    if (cloudData.Attendance_Logs && !isWriteLockActive) {
      setAttendanceHistory(cloudData.Attendance_Logs.map((h: any) => {
        const rawEmpId = findIdInRow(h);
        return {
          date: getFuzzy(h, 'date'), 
          employeeId: rawEmpId ? String(rawEmpId).trim() : 'UNKNOWN',
          shiftId: getFuzzy(h, 'shiftid'), 
          status: getFuzzy(h, 'status'),
          overtimeHours: parseFloat(getFuzzy(h, 'overtimehours')) || 0,
          comment: getFuzzy(h, 'comment'), 
          dayType: getFuzzy(h, 'daytype')
        };
      }));
    }
    
  }, [safeParse, staffBlacklist, toolBlacklist, normalize, getFuzzy, currentUser]);

  const initDatabase = useCallback(async (isBackground = false) => {
    if (!navigator.onLine) return;
    const now = Date.now();
    if (isBackground && (now - lastSyncTimestamp.current < 15000)) return;
    
    if (isBackground) setIsSyncingBackground(true); else setIsCloudLoading(true);
    const cloudData = await fetchCloudDatabase();
    if (cloudData) { 
      processDatabasePayload(cloudData); 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData)); 
      lastSyncTimestamp.current = Date.now();
    }
    setIsSyncingBackground(false); setIsCloudLoading(false);
  }, [processDatabasePayload]);

  useEffect(() => { 
    const cache = localStorage.getItem(STORAGE_KEY);
    if (cache) { try { processDatabasePayload(JSON.parse(cache)); setIsCloudLoading(false); } catch(e) {} }
    initDatabase(); 
    const interval = setInterval(() => initDatabase(true), 120000);
    return () => clearInterval(interval);
  }, [initDatabase, processDatabasePayload]);

  const hasPermission = useCallback((module: string, action: string = 'view', subHub?: string) => {
    if (!currentUser || !currentUser.hasSystemAccess) return false;
    if (currentUser.accessLevel === 'Admin') return true;
    const permKey = subHub ? `${module}_${subHub}_${action}` : `${module}_${action}`;
    return currentUser.permissions?.includes(permKey) || false;
  }, [currentUser]);

  const handleLogin = async (user: string, pass: string) => {
    setIsAuthenticating(true); setAuthError(''); setLoginSuccess(false);
    const u = normalize(user);
    const p = pass.trim();
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    let foundUser: Employee | null = null;
    if (u === 'admin' && p === 'admin') {
      foundUser = { id: 'ADM-ROOT', name: 'System Administrator', role: 'Group Maintenance Manager', department: 'Management', section: 'General', teamId: '', teamName: 'Management', supervisorName: 'Root', contractHours: 48, status: 'Active', hasSystemAccess: true, username: 'admin', tempPassword: 'admin', accessLevel: 'Admin', permissions: INSTITUTIONAL_PERMISSIONS_SCHEMA['Admin'].permissions, visibilityScope: 'ALL' };
    } else {
      foundUser = masterEmployees.find(e => 
        (normalize(e.username) === u || normalize(e.id) === u) && 
        String(e.tempPassword || '').trim() === p && 
        e.hasSystemAccess
      ) || null;
    }
    
    if (foundUser) {
      setLoginSuccess(true); setCurrentUser(foundUser);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsAuthenticated(true);
    } else { 
      setAuthError('Invalid credentials. Check Staff ID or Password.'); 
    }
    setIsAuthenticating(false);
  };

  const handleLogout = () => { setIsAuthenticated(false); setLoginSuccess(false); setCurrentUser(null); };

  return {
    auth: { isAuthenticated, currentUser, handleLogin, handleLogout, isAuthenticating, loginSuccess, authError },
    navigation: { activeTab, setActiveTab, isSidebarCollapsed, setIsSidebarCollapsed, shiftsSubPage, setShiftsSubPage, managerialSubPage, setManagerialSubPage, hasPermission },
    data: { 
      teams, shifts, attendanceHistory, masterEmployees, sections, tierDefaults, 
      bulletins, setBulletins, documents, setDocuments, resources, setResources,
      observations, setObservations, grievances, setGrievances, engagementInquiries, setEngagementInquiries,
      addMember: async (m:any) => { markWrite(); setMasterEmployees(p => [m, ...p]); }, 
      updateMember: async (m:any) => { markWrite(); setMasterEmployees(p => p.map(e => e.id === m.id ? m : e)); }, 
      deleteMember: async (id:string) => { markWrite(); setMasterEmployees(p => p.filter(e => e.id !== id)); }, 
      setShifts, setConfig, config, resolveStaffIdentity: (id: string) => masterEmployees.find(e => normalize(e.id) === normalize(id)) || { id, name: id, status: 'Inactive' }, 
      setAttendanceHistory: (u:any) => { markWrite(); setAttendanceHistory(u); }, 
      inventory: { 
        tools, setTools: (u:any) => { markWrite(); setTools(u); }, deleteTool: async (id:string) => { markWrite(); setTools(p => p.filter(t => t.id !== id)); },
        usageLogs, setUsageLogs: (u:any) => { markWrite(); setUsageLogs(u); }, 
        physicalLogs, setPhysicalLogs: (u:any) => { markWrite(); setPhysicalLogs(u); }, 
        auditHistory, setAuditHistory: (u:any) => { markWrite(); setAuditHistory(u); }, 
        maintenanceHistory, setMaintenanceHistory: (u:any) => { markWrite(); setMaintenanceHistory(u); }
      } 
    },
    notifications: { list: notifications, show: showNotifications, setShow: setShowNotifications },
    modals: { isRotating, setIsRotating, showRotationModal, setShowRotationModal, rotationMode, setMode: setRotationMode },
    system: { isBusy: isSystemBusy, setBusy: setIsSystemBusy, isSyncingBackground, isOffline, onRefresh: () => initDatabase(true) },
    isCloudLoading
  };
};
