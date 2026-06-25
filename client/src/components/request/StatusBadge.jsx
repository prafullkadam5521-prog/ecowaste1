const STATUS_MAP = {
  pending:   { label: 'Pending',   cls: 'badge-pending' },
  approved:  { label: 'Approved',  cls: 'badge-approved' },
  rejected:  { label: 'Rejected',  cls: 'badge-rejected' },
  collected: { label: 'Collected', cls: 'badge-collected' },
  recycled:  { label: 'Recycled',  cls: 'badge-recycled' },
  completed: { label: 'Completed', cls: 'badge-completed' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}
