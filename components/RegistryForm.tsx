import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, RotateCcw, UserPlus, ShieldCheck, Save } from 'lucide-react';
import { Employee, Team, AccessLevel, VisibilityScope } from '../types';
import { RegistryFormIdentity } from './registry/RegistryFormIdentity';
import { RegistryFormContact } from './registry/RegistryFormContact';
import { RegistryFormAuth } from './registry/RegistryFormAuth';
import { INSTITUTIONAL_PERMISSIONS_SCHEMA } from '../constants';

interface RegistryFormProps {
  formData: Partial<Employee>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  isProcessing: boolean;
  editingId: string | null;
  onSave: () => void;
  onCancel: () => void;
  teams: Team[];
  sections: string[];
  tierDefaults?: Record<string, { permissions: string[], scope: VisibilityScope }>;
  setSystemBusy?: (busy: boolean) => void;
}

const RegistryForm: React.FC<RegistryFormProps> = ({ 
  formData, 
  setFormData, 
  isProcessing, 
  editingId, 
  onSave, 
  onCancel, 
  teams, 
  sections = [], 
  tierDefaults = {}, 
}) => {
  const [showGranular, setShowGranular] = useState(false);
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [autoUsername, setAutoUsername] = useState(false);

  const activeTeamData = useMemo(() => {
    if (!formData.teamId) return null;
    const team = teams.find(t => t.id === formData.teamId);
    if (!team) return null;
    const supervisor = team.members.find(m => m.id === team.supervisorId || m.role === 'Workshop Supervisor');
    return {
      supervisorName: supervisor?.name || 'Unassigned',
      memberCount: team.members.length
    };
  }, [formData.teamId, teams]);

  useEffect(() => {
    if (autoUsername && formData.email) {
      setFormData(prev => ({ ...prev, username: prev.email }));
    }
  }, [autoUsername, formData.email, setFormData]);

  const applyTierDefaults = useCallback((level: AccessLevel) => {
    const defaults = tierDefaults?.[level] || INSTITUTIONAL_PERMISSIONS_SCHEMA[level];
    if (defaults) {
      setFormData(prev => ({ 
        ...prev, 
        accessLevel: level,
        permissions: Array.isArray(defaults.permissions) ? [...defaults.permissions] : [],
        visibilityScope: defaults.scope || 'SELF' 
      }));
    }
  }, [tierDefaults, setFormData]);

  const togglePermission = useCallback((permKey: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      const next = current.includes(permKey) 
        ? current.filter(id => id !== permKey) 
        : [...current, permKey];
      return { ...prev, permissions: next };
    });
  }, [setFormData]);

  const getModuleScope = useCallback((moduleId: string): VisibilityScope => {
    const scopePerm = (formData.permissions || []).find(p => p.startsWith(`${moduleId}_scope_`));
    return (scopePerm?.split('_').pop() as VisibilityScope) || 'SELF';
  }, [formData.permissions]);

  const setModuleScope = useCallback((moduleId: string, scope: VisibilityScope) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      const filtered = current.filter(p => !p.startsWith(`${moduleId}_scope_`));
      return { ...prev, permissions: [...filtered, `${moduleId}_scope_${scope}`] };
    });
  }, [setFormData]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <div className="relative bg-[#F8FAFF] w-full max-w-lg h-full sm:h-auto sm:rounded-[1.8rem] shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col sm:max-h-[95vh]">
        
        {/* Header - Fixed */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-[#0F1135] rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight">{editingId ? 'Update Identity' : 'Enroll Personnel'}</h3>
              <p className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase tracking-widest">Master Registry Access</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-300 hover:text-slate-900 transition-colors p-1"><X size={24} /></button>
        </div>

        {/* Content Area - Fluid Scrollable */}
        <div className="flex-1 p-5 md:p-6 space-y-5 md:space-y-6 overflow-y-auto no-scrollbar bg-white sm:bg-transparent">
          <RegistryFormIdentity 
            formData={formData} 
            setFormData={setFormData} 
            teams={teams} 
            sections={sections} 
            isCustomRole={isCustomRole}
            setIsCustomRole={setIsCustomRole}
            isCustomSection={isCustomSection}
            setIsCustomSection={setIsCustomSection}
            activeTeamData={activeTeamData}
          />

          <RegistryFormContact 
            formData={formData} 
            setFormData={setFormData} 
          />

          <RegistryFormAuth 
            formData={formData}
            setFormData={setFormData}
            autoUsername={autoUsername}
            setAutoUsername={setAutoUsername}
            availableTiers={Object.keys(tierDefaults || {})}
            showGranular={showGranular}
            setShowGranular={setShowGranular}
            applyTierDefaults={applyTierDefaults}
            togglePermission={togglePermission}
            getModuleScope={getModuleScope}
            setModuleScope={setModuleScope}
          />
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0 pb-10 sm:pb-5">
          <button onClick={onCancel} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
          <button 
            onClick={onSave} 
            disabled={isProcessing}
            className="flex-[1.5] py-3.5 rounded-xl bg-[#0F1135] text-white font-black uppercase text-[9px] tracking-[0.15em] hover:bg-indigo-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-xl shadow-indigo-900/10 active:scale-95"
          >
            {isProcessing ? <RotateCcw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{editingId ? 'Sync Updates' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistryForm;