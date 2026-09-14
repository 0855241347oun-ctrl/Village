import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard,
  MapPin,
  Home,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Building2,
} from 'lucide-react';

function Sidebar({ isOpen, onClose }) {
  const { profile, signOut, isSuperAdmin } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'แดชบอร์ด' },
    { to: '/zones', icon: MapPin, label: 'โซน' },
    { to: '/houses', icon: Home, label: 'บ้านเลขที่' },
    { to: '/residents', icon: Users, label: 'สมาชิก' },
  ];

  const adminLinks = [
    { to: '/admin/users', icon: Shield, label: 'จัดการผู้ใช้' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    return profile?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Building2 size={22} />
          </div>
          <div>
            <h1>Village</h1>
            <span>ระบบจัดการหมู่บ้าน</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">เมนูหลัก</div>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={onClose}
            >
              <link.icon className="sidebar-link-icon" size={20} />
              {link.label}
            </Link>
          ))}

          {isSuperAdmin && (
            <>
              <div className="sidebar-section-title">ผู้ดูแลระบบ</div>
              {adminLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <link.icon className="sidebar-link-icon" size={20} />
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {profile?.full_name || profile?.email}
              </div>
              <div className="sidebar-user-role">
                {isSuperAdmin ? 'Super Admin' : 'User'}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={handleLogout}
              title="ออกจากระบบ"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function MobileNav() {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'หน้าหลัก' },
    { to: '/zones', icon: MapPin, label: 'โซน' },
    { to: '/houses', icon: Home, label: 'บ้าน' },
    { to: '/residents', icon: Users, label: 'สมาชิก' },
    ...(isSuperAdmin ? [{ to: '/admin/users', icon: Shield, label: 'แอดมิน' }] : []),
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mobile-nav">
      <ul className="mobile-nav-items">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={`mobile-nav-link ${isActive(link.to) ? 'active' : ''}`}
            >
              <link.icon size={22} />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('village-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('village-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <header className="header">
        <div className="header-left">
          <button
            className="header-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme} title="สลับธีม">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <MobileNav />
    </div>
  );
}
