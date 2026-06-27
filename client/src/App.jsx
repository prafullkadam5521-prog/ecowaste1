import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Home            from './pages/Home';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Facilities      from './pages/Facilities';
import FacilityDetail  from './pages/FacilityDetail';
import RequestService  from './pages/RequestService';
import TrackRequest    from './pages/TrackRequest';
import MyRequests      from './pages/MyRequests';
import Profile         from './pages/Profile';
import Rewards         from './pages/Rewards';          // ← NEW
import AdminDashboard  from './pages/AdminDashboard';
import AdminFacilities from './pages/AdminFacilities';
import AdminRequests   from './pages/AdminRequests';
import AdminUsers      from './pages/AdminUsers';
import AdminReports    from './pages/AdminReports';
import SmartDustbin    from './pages/SmartDustbin';

// Components
import Navbar  from './components/common/Navbar';
import Footer  from './components/common/Footer';
import Loader  from './components/common/Loader';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/facilities"     element={<Facilities />} />
        <Route path="/smart-dustbin"  element={<AdminRoute><SmartDustbin /></AdminRoute>} />
        <Route path="/facilities/:id" element={<FacilityDetail />} />

        <Route path="/request/:facilityId" element={<PrivateRoute><RequestService /></PrivateRoute>} />
        <Route path="/track/:requestId"    element={<PrivateRoute><TrackRequest /></PrivateRoute>} />
        <Route path="/my-requests"         element={<PrivateRoute><MyRequests /></PrivateRoute>} />
        <Route path="/profile"             element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/rewards"             element={<PrivateRoute><Rewards /></PrivateRoute>} />  {/* ← NEW */}

        <Route path="/admin"              element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/facilities"   element={<AdminRoute><AdminFacilities /></AdminRoute>} />
        <Route path="/admin/requests"     element={<AdminRoute><AdminRequests /></AdminRoute>} />
        <Route path="/admin/users"        element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/reports"      element={<AdminRoute><AdminReports /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
