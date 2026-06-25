import { NavLink } from 'react-router-dom';
import { FiHome, FiMapPin, FiList, FiUsers, FiBarChart2 } from 'react-icons/fi';

const links = [
  { to: '/admin', label: 'Dashboard', icon: <FiHome size={16} />, end: true },
  { to: '/admin/facilities', label: 'Facilities', icon: <FiMapPin size={16} /> },
  { to: '/admin/requests', label: 'Requests', icon: <FiList size={16} /> },
  { to: '/admin/users', label: 'Users', icon: <FiUsers size={16} /> },
  { to: '/admin/reports', label: 'Reports', icon: <FiBarChart2 size={16} /> },
];

export default function AdminSidebar() {
  return (
    <aside className="w-48 flex-shrink-0">
      <nav className="card p-2 space-y-1 sticky top-20">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {l.icon} {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
