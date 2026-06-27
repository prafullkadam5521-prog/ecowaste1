import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiPackage, FiAward, FiTrash2 } from 'react-icons/fi';
import { MdRecycling } from 'react-icons/md';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState(null);

  // Fetch user points for badge display
  useEffect(() => {
    if (user && user.role === 'user') {
      api.get('/rewards/me')
        .then(({ data }) => setPoints(data.summary?.totalPoints ?? 0))
        .catch(() => {}); // silent fail
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setPoints(null);
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-primary text-xl">
          <MdRecycling size={28} />
          EcoWaste<span className="text-gray-700">Finder</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium">
          <Link to="/facilities" className="text-gray-600 hover:text-primary transition-colors">
            Find Facilities
          </Link>
          {user?.role === 'admin' && (
            <Link to="/smart-dustbin" className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
              <FiTrash2 size={14} /> Smart Dustbin
            </Link>
          )}
          {user && user.role === 'user' && (
            <>
              <Link to="/my-requests" className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
                <FiPackage size={14} /> My Requests
              </Link>
              <Link to="/rewards" className="flex items-center gap-1.5 text-gray-600 hover:text-primary transition-colors relative">
                <FiAward size={14} />
                Rewards
                {points !== null && (
                  <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full font-bold leading-none">
                    {points >= 1000 ? `${(points / 1000).toFixed(1)}k` : points}
                  </span>
                )}
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-gray-600 hover:text-primary transition-colors">
              Admin
            </Link>
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary">
                <FiUser size={15} /> {user.name}
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
                <FiLogOut size={15} /> Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login"    className="btn-secondary text-sm py-1.5">Login</Link>
              <Link to="/register" className="btn-primary  text-sm py-1.5">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-gray-600">
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3 text-sm">
          <Link to="/facilities"  onClick={() => setOpen(false)} className="text-gray-700">Find Facilities</Link>
          {user?.role === 'admin' && (
            <Link to="/smart-dustbin" onClick={() => setOpen(false)} className="flex items-center gap-2 text-gray-700">
              <FiTrash2 size={14} /> Smart Dustbin
            </Link>
          )}
          {user && user.role === 'user' && (
            <>
              <Link to="/my-requests" onClick={() => setOpen(false)} className="text-gray-700">My Requests</Link>
              <Link to="/rewards"     onClick={() => setOpen(false)} className="flex items-center gap-2 text-gray-700">
                <FiAward size={14} /> Rewards
                {points !== null && (
                  <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{points}</span>
                )}
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setOpen(false)} className="text-gray-700">Admin</Link>
          )}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setOpen(false)} className="text-gray-700">Profile</Link>
              <button onClick={handleLogout} className="text-left text-red-500">Logout</button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login"    onClick={() => setOpen(false)} className="btn-secondary flex-1 text-center">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary  flex-1 text-center">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
