import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminSidebar from '../components/admin/AdminSidebar';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchReport = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (from) q.append('from', from);
    if (to) q.append('to', to);
    api.get(`/admin/reports?${q}`)
      .then(({ data }) => setReport(data.report))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, []);

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    collected: 'bg-purple-100 text-purple-700',
    recycled: 'bg-green-100 text-green-700',
    completed: 'bg-green-200 text-green-900',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      <AdminSidebar />
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports & Analytics</h1>

        {/* Date filters */}
        <div className="card mb-6 flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field" />
          </div>
          <button onClick={fetchReport} className="btn-primary py-2 px-5">Generate Report</button>
        </div>

        {loading ? <Loader /> : !report ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status breakdown */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Request Status Breakdown</h2>
              {report.statusBreakdown?.length === 0 && <p className="text-gray-400 text-sm">No data</p>}
              <div className="space-y-2">
                {report.statusBreakdown?.map(s => (
                  <div key={s._id} className="flex items-center justify-between">
                    <span className={`capitalize text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s._id] || 'bg-gray-100 text-gray-600'}`}>
                      {s._id}
                    </span>
                    <div className="flex items-center gap-3 flex-1 ml-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min((s.count / (report.statusBreakdown[0]?.count || 1)) * 100, 100)}%` }} />
                      </div>
                      <span className="font-bold text-gray-700 text-sm w-6 text-right">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top facilities */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Top 5 Active Facilities</h2>
              {report.topFacilities?.length === 0 && <p className="text-gray-400 text-sm">No data</p>}
              <div className="space-y-3">
                {report.topFacilities?.map((f, i) => (
                  <div key={f._id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 font-medium">{f.name}</span>
                    <span className="text-sm font-bold text-gray-800">{f.count} requests</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent performance */}
            <div className="card md:col-span-2">
              <h2 className="font-semibold text-gray-800 mb-4">Agent Performance</h2>
              {report.agentPerformance?.length === 0 && <p className="text-gray-400 text-sm">No agent data</p>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="pb-2 font-medium">Agent</th>
                      <th className="pb-2 font-medium">Total Assigned</th>
                      <th className="pb-2 font-medium">Completed</th>
                      <th className="pb-2 font-medium">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.agentPerformance?.map(a => (
                      <tr key={a._id}>
                        <td className="py-2 font-medium text-gray-800">{a.name}</td>
                        <td className="py-2 text-gray-600">{a.total}</td>
                        <td className="py-2 text-gray-600">{a.completed}</td>
                        <td className="py-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.completed / a.total >= 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
