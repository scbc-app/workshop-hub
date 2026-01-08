
import { 
  AttendanceRecord, 
  Employee, 
  Team, 
  Shift, 
  ShiftType, 
  ShiftConfiguration, 
  ToolAsset, 
  ToolUsageRecord, 
  PhysicalLogbookRecord, 
  MaintenanceRecord,
  Bulletin,
  StaffDocument,
  ExternalResource,
  PerformanceObservation,
  GrievanceRecord
} from '../types';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0tD1XwiNYRdkq4eQAKEuNkCgAKh0yY6mzcK5WWWUOfPHhbZmCruvA1TZsVrsBwkBK/exec';

/**
 * Robust fetch wrapper with automatic retries and exponential backoff
 */
const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3, backoff = 1000): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch failed. Retrying in ${backoff}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const fetchCloudDatabase = async (): Promise<any | null> => {
  try {
    const response = await fetchWithRetry(APPS_SCRIPT_URL, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store'
    });
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Database response was not valid JSON. Response received:', text.substring(0, 100));
      return null;
    }
  } catch (error) {
    console.error('Connection attempt exhausted. System operating in disconnected mode:', error);
    return null;
  }
};

export const sendPost = async (payload: object) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });
    return response.ok || response.status === 0; 
  } catch (error) {
    console.warn('Network sync acknowledged with potential redirect or blip:', error);
    return true; 
  }
};

export const syncMaintenanceRecord = async (m: MaintenanceRecord) => {
  const row = [
    m.id, 
    m.toolId, 
    m.toolName, 
    m.reportedBy, 
    m.reportedDate, 
    m.breakdownContext, 
    m.isRepairable === null ? '' : (m.isRepairable ? 'TRUE' : 'FALSE'), 
    m.status, 
    m.resolutionDate || '', 
    m.technicianNotes || '', 
    m.estimatedCost || 0,
    m.assignedStaffId || '',
    m.assignedStaffName || '',
    m.isEscalatedToSupervisor ? 'TRUE' : 'FALSE',
    m.escalationNotes || ''
  ];
  return sendPost({ sheet: 'Tools_Maintenance', action: 'update', id: m.id, row });
};

export const syncStaffMember = async (member: Employee) => {
  const row = [
    member.id, member.name, member.role, member.department, member.section,
    member.teamId, member.teamName, member.supervisorName, member.contractHours,
    member.status, member.phone || '', member.email || '', 
    member.hasSystemAccess ? 'TRUE' : 'FALSE',
    member.visibilityScope || 'SELF'
  ];
  return sendPost({ sheet: 'Staff_Registry', action: 'update', id: member.id, row });
};

export const deleteStaffMember = async (id: string) => {
  return sendPost({ sheet: 'Staff_Registry', action: 'delete', id });
};

export const syncToolAsset = async (tool: ToolAsset) => {
  const row = [
    tool.id, tool.serialNumber || '', tool.name, tool.category, tool.zone,
    tool.quantity, tool.available, tool.condition, tool.responsibleStaffId || '',
    tool.monetaryValue, tool.lastVerified, tool.imageUrl || '',
    tool.assetClass || 'Pc',
    JSON.stringify(tool.composition || []),
    tool.submissionDate,
    tool.addedBy
  ];
  return sendPost({ sheet: 'Tools_Master', action: 'update', id: tool.id, row });
};

export const deleteToolAsset = async (id: string) => {
  return sendPost({ sheet: 'Tools_Master', action: 'delete', id });
};

export const syncToolUsage = async (log: ToolUsageRecord) => {
  const row = [
    log.id, log.batchId || '', log.toolId, log.toolName, log.quantity || 1, log.staffId, log.staffName,
    log.shiftType, log.date, log.timeOut, log.timeIn || '', 
    log.isReturned ? 'TRUE' : 'FALSE', log.conditionOnReturn || '',
    log.attendantId, log.issuanceType, log.comment || '', log.recipientSignature || '',
    log.escalationStatus || 'Pending', log.discoveryDate || '', log.monetaryValue || '',
    log.evidenceImage || '', log.escalationStage || 'Store', log.graceExpiryDate || '',
    JSON.stringify(log.actionHistory || []),
    log.physicalArchiveId || '',
    log.attendantName
  ];
  return sendPost({ sheet: 'Tools_Usage_Logs', action: 'update', id: log.id, row });
};

export const syncToGoogleSheets = async (records: AttendanceRecord[]) => {
  const rows = records.map(r => [
    r.date, r.employeeId, r.shiftId, r.status, r.overtimeHours, r.comment || '', r.dayType
  ]);
  return sendPost({ sheet: 'Attendance_Logs', action: 'batchCreate', rows });
};

export const syncSettings = async (shifts: Shift[], config: ShiftConfiguration) => {
  const shiftRows = shifts.map(s => [s.id, s.name, s.type, s.startTime, s.endTime]);
  await sendPost({ sheet: 'Shifts', action: 'clear' });
  await sendPost({ sheet: 'Shifts', action: 'batchCreate', rows: shiftRows });
  const configRow = [config.standardHoursPerDay, config.standardDaysPerWeek, config.rotationIntervalWeeks, config.nightToDayTransition, config.dayToNightTransition, JSON.stringify(config.sections)];
  await sendPost({ sheet: 'System_Config', action: 'clear' });
  return sendPost({ sheet: 'System_Config', action: 'create', row: configRow });
};

export const provisionAccess = async (staffId: string, username: string, level: string, tempPassword?: string, permissions: string[] = [], scope: string = 'SELF') => {
  const row = [staffId, username, tempPassword || 'ENCRYPTED', level, 'FALSE', new Date().toISOString(), 'Active', permissions.join(','), scope];
  return sendPost({ sheet: 'Staff_Credentials', action: 'update', id: staffId, row });
}

export const deleteAccessProvision = async (id: string) => {
  return sendPost({ sheet: 'Staff_Credentials', action: 'delete', id });
}

export const syncPhysicalArchive = async (log: PhysicalLogbookRecord) => {
  const row = [log.id, log.date, log.shiftType, log.attendantId, log.attendantName || '', JSON.stringify(log.imageUrls), log.pageNumber || '', log.notes || '', log.timestamp];
  return sendPost({ sheet: 'Tools_Physical_Archives', action: 'update', id: log.id, row });
};

export const syncAuditHistory = async (finding: any) => {
  const row = [
    finding.id,
    finding.date,
    finding.section,
    finding.inspector,
    finding.shiftType,
    JSON.stringify(finding.issues || []),
    finding.signature || ''
  ];
  return sendPost({ sheet: 'Tools_Audit_History', action: 'create', row });
};

export const syncBulletin = async (b: Bulletin) => {
  return sendPost({ 
    sheet: 'Bulletins', 
    action: 'update', 
    id: b.id, 
    row: [b.id, b.title, b.content, b.type, b.date, b.postedBy, JSON.stringify(b.attachments || [])] 
  });
};

export const syncStaffDocument = async (d: StaffDocument) => {
  return sendPost({ 
    sheet: 'Staff_Documents', 
    action: 'update', 
    id: d.id, 
    row: [d.id, d.title, d.type, d.staffId, d.status, d.isBroadcast ? 'TRUE' : 'FALSE', d.dateUploaded, d.fileUrl, JSON.stringify(d.attachments || [])] 
  });
};

export const syncExternalResource = async (r: ExternalResource) => {
  return sendPost({ 
    sheet: 'External_Resources', 
    action: 'update', 
    id: r.id, 
    row: [r.id, r.title, r.url, r.category] 
  });
};

export const syncObservation = async (o: PerformanceObservation) => {
  return sendPost({ 
    sheet: 'Performance_Observations', 
    action: 'update', 
    id: o.id, 
    row: [o.id, o.staffId, o.observerId, o.observerName, o.category, o.note, o.timestamp, o.isPositive ? 'TRUE' : 'FALSE', o.isEscalatedToHR ? 'TRUE' : 'FALSE', o.status] 
  });
};

export const syncGrievance = async (g: GrievanceRecord) => {
  return sendPost({ 
    sheet: 'Grievances', 
    action: 'update', 
    id: g.id, 
    row: [
      g.id, g.staffId, g.staffName, g.category, g.subject, g.message, 
      g.timestamp, g.status, g.isAnonymous ? 'TRUE' : 'FALSE', 
      g.response || '', g.responderName || '', g.isPublicResponse ? 'TRUE' : 'FALSE'
    ] 
  });
};
