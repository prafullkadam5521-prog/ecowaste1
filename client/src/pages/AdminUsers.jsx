import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminSidebar from '../components/admin/AdminSidebar';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { FiUserCheck, FiUserX } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  const fetch = () => {
    setLoading(true);
    const q = roleFilter ? `?role=${roleFilter}` : '';
    api.get(`/admin/users${q}`)
      .then(({ data }) => setUsers(data.users))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [roleFilter]);

  const toggleUser = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle`);
      setUsers(p => p.map(u => u._id === id ? { ...u, isActive: data.isActive } : u));
      toast.success(data.message);
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      <AdminSidebar />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-36">
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
          </select>
        </div>

        {loading ? <Loader /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
                )}
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`capitalize text-xs px-2 py-0.5 rounded-full font-medium
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUser(u._id)}
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors
                          ${u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {u.isActive ? <><FiUserX size={12} /> Deactivate</> : <><FiUserCheck size={12} /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
