
import React, { useState } from 'react';
import { User, Phone, Mail, ShieldCheck, Fingerprint, HardHat, Briefcase, CheckCircle, Save, RotateCcw, Lock, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Employee, AccessLevel } from '../types';
import Card from '../components/Card';

interface ProfileSettingsPageProps {
  currentUser: Employee;
  onUpdateProfile: (updated: Employee) => Promise<void>;
}

const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ currentUser, onUpdateProfile }) => {
  const [formData, setFormData] = useState({
    phone: currentUser.phone || '',
    email: currentUser.email || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPass, setShowPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailChanged = formData.email !== currentUser.email;
    
    if (emailChanged) {
      const proceed = confirm("SECURITY ADVISORY: Updating your email address will also synchronize your login username to this new address. Do you wish to authorize this change?");
      if (!proceed) return;
    }

    setIsSaving(true);
    try {
      await onUpdateProfile({
        ...currentUser,
        phone: formData.phone,
        email: formData.email,
        // System rule: Synchronize username with email if email is primary identity
        username: emailChanged ? formData.email : currentUser.username
      });

      if (emailChanged) {
        alert(`Institutional Identity Synchronized Successfully.\n\nNOTE: Your login username has been updated to: ${formData.email}`);
      } else {
        alert("Institutional Profile Updated Successfully.");
      }
    } catch (error) {
      alert("System Error: Failed to synchronize profile with the central database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.currentPassword !== currentUser.tempPassword) {
      return alert("Authentication Failure: Current passkey does not match our records.");
    }

    if (!passwordData.newPassword) return alert("Please define a new passkey.");
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert("Passkey Mismatch: New entries do not match.");
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      return alert("Policy Violation: New passkey cannot be identical to the current one.");
    }

    setIsUpdatingPass(true);
    try {
      await onUpdateProfile({
        ...currentUser,
        tempPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert("Security Credentials Synchronized Successfully.");
    } catch (error) {
      alert("Error: Unable to update security credentials at this time.");
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const privilegeMatrix: Record<AccessLevel, string[]> = {
    'Admin': ['Full System Configuration', 'Global Registry Management', 'Shift Protocol Control', 'Inventory Governance', 'HR Vault Oversight'],
    'Manager': ['Lead Workshop Management', 'Team Roster Control', 'Inventory Auditing', 'Shift Monitoring'],
    'Supervisor': ['Shift Command & Attendance Authorization', 'Technical Asset Custodian Authority', 'Floor-Level Tool Issuance & Returns', 'Sectional Liability Identification', 'Field Performance Observations'],
    'Audit': ['Quality Control Verifications', 'Inventory Sightings', 'Read-only Dashboards'],
    'HR': ['Staff Records Management', 'Payroll & Document Management', 'Performance Case Review'],
    'Stores': ['Inventory Lifecycle Management', 'Tool Procurement', 'Asset Verification'],
    'HSSEQ': ['Safety Compliance Audits', 'Institutional Bulletins', 'Incident Reporting'],
    'Fleet': ['Shift Deployment Management', 'Fleet Specific Records'],
    'Staff': ['Personal Document Portal', 'Corporate Bulletin Access', 'Helpdesk Ticketing']
  };

  const userPrivileges = privilegeMatrix[currentUser.accessLevel || 'Staff'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="bg-[#0F1135] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#0F1135] text-2xl font-black shadow-lg">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
               <h3 className="text-xl font-black uppercase tracking-tight truncate">{currentUser.name}</h3>
               <span className="bg-indigo-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-white/10">
                  {currentUser.accessLevel}
               </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center space-x-1.5 text-indigo-300">
                <Fingerprint size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">{currentUser.id}</span>
              </div>
              <div className="w-px h-2.5 bg-white/10"></div>
              <div className="flex items-center space-x-1.5 text-indigo-300">
                <HardHat size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">{currentUser.teamName || 'Pool'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          
          <Card title="" headerAction={
             <div className="flex items-center space-x-2 text-slate-900">
                <User size={16} className="text-indigo-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Contact Information</h4>
             </div>
          }>
            <form onSubmit={handleSubmitProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Personal Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                    <input 
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSaving ? <RotateCcw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Sync Contact Details</span>
              </button>
            </form>
          </Card>

          <Card title="" className="bg-[#0A0C1F] border-slate-800" headerAction={
             <div className="flex items-center space-x-2 text-white">
                <Lock size={16} className="text-rose-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Security Credentials</h4>
             </div>
          }>
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Passkey Verification</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" size={13} />
                  <input 
                    type={showPass ? "text" : "password"}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-[10px] font-bold text-white outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="Enter active passkey"
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">New Passkey</label>
                  <input 
                    type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm New Passkey</label>
                  <input 
                    type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isUpdatingPass}
                className="w-full bg-rose-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-rose-500 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-rose-950/20"
              >
                {isUpdatingPass ? <RotateCcw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>Authorize Security Update</span>
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <Card title="" headerAction={
             <div className="flex items-center space-x-2 text-slate-900">
                <ShieldCheck size={16} className="text-indigo-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Access Privileges</h4>
             </div>
          }>
            <div className="space-y-4 pt-2">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-3 mb-3">
                     <Briefcase size={14} className="text-indigo-400" />
                     <p className="text-[9px] font-black text-slate-700 uppercase tracking-tight">{currentUser.accessLevel} Tier Clearance</p>
                  </div>
                  <div className="space-y-2">
                     {userPrivileges.map((p, i) => (
                       <div key={i} className="flex items-start space-x-2 text-slate-500">
                          <CheckCircle size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-[8px] font-bold uppercase tracking-wide leading-relaxed">{p}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
