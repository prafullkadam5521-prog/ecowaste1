import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminSidebar from '../components/admin/AdminSidebar';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { FiUsers, FiMapPin, FiPackage, FiClock } from 'react-icons/fi';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      <AdminSidebar />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        {loading ? <Loader /> : !stats ? null : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<FiUsers size={22} className="text-blue-600" />} label="Total Users" value={stats.totalUsers} color="bg-blue-50" />
              <StatCard icon={<FiMapPin size={22} className="text-green-600" />} label="Facilities" value={stats.totalFacilities} color="bg-green-50" />
              <StatCard icon={<FiPackage size={22} className="text-purple-600" />} label="Total Requests" value={stats.totalRequests} color="bg-purple-50" />
              <StatCard icon={<FiClock size={22} className="text-yellow-600" />} label="Pending" value={stats.pendingRequests} color="bg-yellow-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Waste type breakdown */}
              <div className="card">
                <h2 className="font-semibold text-gray-800 mb-4">Waste Collected by Type</h2>
                <div className="space-y-3">
                  {stats.wasteStats?.length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
                  {stats.wasteStats?.map(w => (
                    <div key={w._id} className="flex items-center gap-3">
                      <span className="text-sm capitalize text-gray-700 w-24">{w._id}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min((w.count / (stats.wasteStats[0]?.count || 1)) * 100, 100)}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8 text-right">{w.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly requests */}
              <div className="card">
                <h2 className="font-semibold text-gray-800 mb-4">Monthly Requests</h2>
                <div className="space-y-2">
                  {stats.monthlyStats?.length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
                  {stats.monthlyStats?.slice(0, 6).map(m => (
                    <div key={`${m._id.year}-${m._id.month}`} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-20">{new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short', year: '2-digit' })}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full"
                          style={{ width: `${Math.min((m.count / (stats.monthlyStats[0]?.count || 1)) * 100, 100)}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8 text-right">{m.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
