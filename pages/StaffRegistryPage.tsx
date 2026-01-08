import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  Eye,
  CheckCircle2,
  X,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Team, Employee, AttendanceRecord } from '../types';
import { syncStaffMember, provisionAccess, deleteStaffMember, deleteAccessProvision } from '../services/sheetService';
import RegistryForm from '../components/RegistryForm';
import StaffAuditModal from '../components/StaffAuditModal';

const StaffRegistryPage: React.FC<{
  teams: Team[];
  masterEmployees?: Employee[];
  history: AttendanceRecord[];
  sections: string[];
  tierDefaults?: Record<string, { permissions: string[], scope: any }>;
  onAddMember: (member: Partial<Employee>) => void;
  onUpdateMember: (member: Partial<Employee>) => void;
  onDeleteMember: (id: string) => void;
  currentUser: Employee;
  isSystemBusy: boolean;
  setSystemBusy: (busy: boolean) => void;
  hasPermission: (module: string, action?: any, subHub?: string) => boolean;
}> = ({ teams = [], masterEmployees = [], history = [], sections = [], tierDefaults = {}, onAddMember, onUpdateMember, onDeleteMember, currentUser, isSystemBusy, setSystemBusy, hasPermission }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [auditingStaff, setAuditingStaff] = useState<Employee | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const canEnroll = hasPermission('registry', 'create', 'enrollment');
  const canUpdate = hasPermission('registry', 'update', 'enrollment');
  const canDelete = hasPermission('registry', 'delete', 'enrollment');
  const canAudit = hasPermission('registry', 'view', 'audit');

  const allEmployees = masterEmployees && masterEmployees.length > 0 ? masterEmployees : teams.flatMap(t => t.members || []);
  
  const filteredEmployees = allEmployees.filter(emp => {
    const s = (searchTerm || '').toLowerCase();
    const name = (emp.name || '').toLowerCase();
    const role = (emp.role || '').toLowerCase();
    const section = (emp.section || '').toLowerCase();
    return name.includes(s) || role.includes(s) || section.includes(s);
  });

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setFormData({ ...emp });
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.name) return alert("Employee name is required.");
    setIsProcessing(true);
    setSystemBusy(true);
    try {
      const finalMember = {
        ...formData,
        id: (formData.id || `SP-${Date.now().toString().slice(-4)}`).toString().trim(),
        status: formData.status || 'Active',
        role: formData.role || 'Member',
        department: formData.department || 'Operations',
        section: formData.section || 'General',
        contractHours: formData.contractHours || 48,
        hasSystemAccess: !!formData.hasSystemAccess,
        permissions: formData.permissions || [],
        visibilityScope: formData.visibilityScope || 'SELF'
      } as Employee;
      
      const cloudSuccess = await syncStaffMember(finalMember);
      if (!cloudSuccess) throw new Error("Sync failure.");
      
      if (finalMember.hasSystemAccess && finalMember.username) {
        await provisionAccess(
          finalMember.id, 
          finalMember.username, 
          finalMember.accessLevel || 'Staff',
          finalMember.tempPassword,
          finalMember.permissions,
          finalMember.visibilityScope
        );
      }
      
      if (editingId) onUpdateMember(finalMember);
      else onAddMember(finalMember);
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
      showFeedback(editingId ? "Identity Synchronized" : "Personnel Enrolled");
    } catch (e) {
      console.error(e);
      alert("Error saving employee.");
    } finally {
      setIsProcessing(false);
      setSystemBusy(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setSystemBusy(true);
    try {
      await deleteStaffMember(id);
      await deleteAccessProvision(id);
      onDeleteMember(id);
      setPendingDeleteId(null);
      showFeedback("Record Purged");
    } catch (e) {
      console.error(e);
      alert("Error purging record.");
    } finally {
      setSystemBusy(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20 relative">
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50">
            <CheckCircle2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-2 hover:opacity-70"><X size={14}/></button>
          </div>
        </div>
      )}

      {isAdding && (
        <RegistryForm 
          formData={formData} 
          setFormData={setFormData} 
          isProcessing={isProcessing} 
          editingId={editingId} 
          onSave={handleSave} 
          onCancel={() => { setIsAdding(false); setEditingId(null); setFormData({}); }} 
          teams={teams} 
          sections={sections} 
          tierDefaults={tierDefaults}
          setSystemBusy={setSystemBusy}
        />
      )}

      {auditingStaff && (
        <StaffAuditModal 
          staff={auditingStaff} 
          history={history} 
          onClose={() => setAuditingStaff(null)} 
          currentUser={currentUser} 
          setSystemBusy={setSystemBusy} 
        />
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Delete Asset?</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-8 px-4">
                 This action will permanently delete this personnel record and all associated credentials.
              </p>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setPendingDeleteId(null)} className="py-4 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                 <button onClick={handleExecuteDelete} className="py-4 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all">Delete</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-4">
           <div className="w-12 h-12 bg-[#0F1135] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Users size={24} />
           </div>
           <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Staff Registry</h2>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Last Managed: {new Date().toLocaleDateString()}</p>
           </div>
        </div>

        {canEnroll && (
          <button 
            type="button"
            onClick={() => { setFormData({}); setEditingId(null); setIsAdding(true); }}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-[0.15em] text-[9px] hover:bg-[#0F1135] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <UserPlus size={14} />
            <span>Enroll Personnel</span>
          </button>
        )}
      </div>

      <div className="w-full relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input 
          type="text"
          className="w-full bg-white border border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm transition-all placeholder:text-slate-300 uppercase tracking-[0.2em]"
          placeholder="Lookup Name or Role..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 bg-slate-50/80 backdrop-blur-md text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 px-8 py-4">
           <div className="col-span-4">Personnel Information</div>
           <div className="col-span-3">Unit / Role</div>
           <div className="col-span-3">Sync Status</div>
           <div className="col-span-2 text-right">Control</div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredEmployees.length === 0 ? (
            <div className="py-24 text-center">
              <Users size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No matching identity found</p>
            </div>
          ) : filteredEmployees.map(emp => {
            return (
              <div key={emp.id} className="group p-6 lg:px-8 lg:py-4 hover:bg-indigo-50/20 transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 lg:col-span-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm shrink-0 shadow-sm transition-all duration-500">
                            {emp.name.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-black text-slate-900 text-sm uppercase tracking-tight truncate">{emp.name}</span>
                            <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest">{emp.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3 flex items-center lg:block">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{emp.section}</span>
                        <span className="text-slate-200">•</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{emp.role === 'Member' ? 'Staff' : emp.role}</span>
                      </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3 flex items-center lg:block">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm shadow-emerald-100/50">
                           <Clock size={10} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Verified Today</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 lg:col-span-2">
                      <div className="flex items-center justify-start lg:justify-end space-x-1.5 border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0 relative z-40">
                        {canAudit && (
                          <button 
                            type="button"
                            onClick={() => setAuditingStaff(emp)} 
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-600 rounded-lg transition-all shadow-sm active:scale-90"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {canUpdate && (
                          <button 
                            type="button"
                            onClick={() => handleEdit(emp)} 
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-600 rounded-lg transition-all shadow-sm active:scale-90"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPendingDeleteId(emp.id); }} 
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-slate-100 hover:border-rose-600 rounded-lg transition-all shadow-sm active:scale-90"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StaffRegistryPage;