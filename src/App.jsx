import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Clock, LogOut, RefreshCw, XCircle, Sparkles } from 'lucide-react';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ZonesPage from './pages/ZonesPage';
import HousesPage from './pages/HousesPage';
import ResidentsPage from './pages/ResidentsPage';
import ResidentDetailPage from './pages/ResidentDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';

function PendingApprovalScreen() {
  const { profile, signOut, refreshProfile, status } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  const isRejected = status === 'rejected';

  return (
    <div className="login-page" style={{ flexDirection: 'column', gap: '1.5rem' }}>
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ margin: '0 auto 1rem auto' }}>
          {isRejected ? (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(234, 67, 53, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto'
            }}>
              <XCircle size={36} style={{ color: '#ea4335' }} />
            </div>
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(155,114,207,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto'
            }}>
              <Clock size={36} style={{ color: '#8ab4f8' }} />
            </div>
          )}
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e3e3e3', marginBottom: '0.5rem' }}>
          {isRejected ? 'บัญชีถูกปฏิเสธ' : 'รอการอนุมัติจากผู้ดูแลระบบ'}
        </h1>

        <p style={{ color: '#c4c7c5', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          {isRejected
            ? 'บัญชีของคุณถูกปฏิเสธโดยผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลเพื่อสอบถามเพิ่มเติม'
            : 'บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบอนุมัติการเข้าใช้งาน'}
        </p>

        {profile?.village_name && (
          <div className="gemini-pill-tag" style={{ margin: '0 auto 1rem auto', fontSize: '0.8rem' }}>
            <Sparkles size={12} /> {profile.village_name}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isRejected && (
            <button
              className="btn btn-primary"
              onClick={handleRefresh}
              disabled={checking}
              style={{ minWidth: 160 }}
            >
              <RefreshCw size={16} className={checking ? 'spinner-sm' : ''} />
              {checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะ'}
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={signOut}
            style={{ minWidth: 140 }}
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading, isApproved } = useAuth();

  if (loading) {
    return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // ผู้ใช้ล็อกอินแล้ว แต่ยังไม่ได้รับอนุมัติ
  if (!isApproved) {
    return <PendingApprovalScreen />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/zones" element={<ZonesPage />} />
        <Route path="/houses" element={<HousesPage />} />
        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/residents/:id" element={<ResidentDetailPage />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
