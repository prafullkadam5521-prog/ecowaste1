import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
    },
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setChangingPw(false); }
  };

  const setAddr = (field) => (e) => setForm(p => ({ ...p, address: { ...p.address, [field]: e.target.value } }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      {/* Avatar */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleProfileSave} className="card mb-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Personal Information</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-field pl-9" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (read-only)</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input value={user?.email} disabled className="input-field pl-9 bg-gray-50 text-gray-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field pl-9" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Address</h3>
          <div className="space-y-2">
            <input value={form.address.street} onChange={setAddr('street')} className="input-field" placeholder="Street" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.address.city} onChange={setAddr('city')} className="input-field" placeholder="City" />
              <input value={form.address.state} onChange={setAddr('state')} className="input-field" placeholder="State" />
            </div>
            <input value={form.address.pincode} onChange={setAddr('pincode')} className="input-field" placeholder="Pincode" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary py-2.5 w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="card space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FiLock size={16} /> Change Password</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
            required className="input-field" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input type="password" minLength={6} value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
            required className="input-field" placeholder="Min 6 characters" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
            required className="input-field" placeholder="Re-enter new password" />
        </div>
        <button type="submit" disabled={changingPw} className="btn-primary py-2.5 w-full">
          {changingPw ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
