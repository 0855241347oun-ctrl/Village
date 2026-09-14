import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { MapPin, Home, Users, ArrowRight, UserPlus, TrendingUp, Sparkles, AlertTriangle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { profile, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState({ zones: 0, houses: 0, residents: 0 });
  const [recentResidents, setRecentResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    if (isSuperAdmin) {
      fetchPendingCount();
    }
  }, [isSuperAdmin]);

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingCount(count || 0);
  }

  async function fetchDashboardData() {
    try {
      const [zonesRes, housesRes, residentsRes, recentRes] = await Promise.all([
        supabase.from('zones').select('id', { count: 'exact', head: true }),
        supabase.from('houses').select('id', { count: 'exact', head: true }),
        supabase.from('residents').select('id', { count: 'exact', head: true }),
        supabase
          .from('residents')
          .select('id, first_name, last_name, nickname, created_at, houses(house_number, zones(name))')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setStats({
        zones: zonesRes.count || 0,
        houses: housesRes.count || 0,
        residents: residentsRes.count || 0,
      });
      setRecentResidents(recentRes.data || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <div className="gemini-pill-tag">
            <Sparkles size={14} className="gemini-sparkle-spin" /> Gemini AI Realtime Overview
          </div>
          <h1 className="page-title">
            สวัสดี, <span className="gemini-text-gradient">{profile?.full_name || 'ผู้ดูแลระบบ'}</span> 👋
          </h1>
          <p className="page-subtitle">
            ยินดีต้อนรับสู่ระบบจัดการหมู่บ้านอัจฉริยะ ติดตามข้อมูลประชากรและพื้นที่แบบเรียลไทม์
          </p>
        </div>
      </div>

      {/* Pending Approval Alert for Admin */}
      {isSuperAdmin && pendingCount > 0 && (
        <Link to="/admin/users" style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(249,171,0,0.12), rgba(234,67,53,0.08))',
              border: '1px solid rgba(249,171,0,0.3)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-md) var(--space-xl)',
              marginBottom: 'var(--space-xl)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-full)',
              background: 'rgba(249,171,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertTriangle size={20} style={{ color: '#f9ab00' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                🔔 มีผู้สมัครใหม่ {pendingCount} คนรอการอนุมัติ
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                คลิกเพื่อไปจัดการ →
              </div>
            </div>
            <span
              style={{
                background: 'linear-gradient(135deg, #ea4335, #f9ab00)',
                color: 'white',
                fontSize: 13,
                fontWeight: 800,
                borderRadius: 'var(--radius-full)',
                minWidth: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px',
                boxShadow: '0 2px 8px rgba(234,67,53,0.35)',
              }}
            >
              {pendingCount}
            </span>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <Link to="/zones" style={{ textDecoration: 'none' }}>
          <div className="card stat-card card-clickable">
            <div className="stat-card-icon purple">
              <MapPin size={24} />
            </div>
            <div className="stat-card-value">{stats.zones}</div>
            <div className="stat-card-label">โซนทั้งหมด</div>
          </div>
        </Link>

        <Link to="/houses" style={{ textDecoration: 'none' }}>
          <div className="card stat-card card-clickable">
            <div className="stat-card-icon blue">
              <Home size={24} />
            </div>
            <div className="stat-card-value">{stats.houses}</div>
            <div className="stat-card-label">บ้านทั้งหมด</div>
          </div>
        </Link>

        <Link to="/residents" style={{ textDecoration: 'none' }}>
          <div className="card stat-card card-clickable">
            <div className="stat-card-icon green">
              <Users size={24} />
            </div>
            <div className="stat-card-value">{stats.residents}</div>
            <div className="stat-card-label">สมาชิกทั้งหมด</div>
          </div>
        </Link>

        <div className="card stat-card">
          <div className="stat-card-icon orange">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card-value">
            {stats.houses > 0 ? (stats.residents / stats.houses).toFixed(1) : 0}
          </div>
          <div className="stat-card-label">เฉลี่ยคน/บ้าน</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-lg">
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
          ทางลัด
        </h2>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <Link to="/residents" className="btn btn-primary">
            <Users size={18} />
            ดูสมาชิกทั้งหมด
          </Link>
          <Link to="/houses" className="btn btn-secondary">
            <Home size={18} />
            จัดการบ้าน
          </Link>
          <Link to="/zones" className="btn btn-secondary">
            <MapPin size={18} />
            จัดการโซน
          </Link>
        </div>
      </div>

      {/* Recent Residents */}
      <div className="card">
        <div className="flex items-center justify-between mb-md">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
            สมาชิกล่าสุด
          </h2>
          <Link to="/residents" className="btn btn-ghost btn-sm">
            ดูทั้งหมด <ArrowRight size={16} />
          </Link>
        </div>

        {recentResidents.length === 0 ? (
          <div className="empty-state">
            <UserPlus className="empty-state-icon" size={48} />
            <p className="empty-state-title">ยังไม่มีข้อมูลสมาชิก</p>
            <p className="empty-state-text">เริ่มเพิ่มสมาชิกโดยไปที่หน้า "สมาชิก"</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ชื่อเล่น</th>
                  <th>โซน</th>
                  <th>บ้านเลขที่</th>
                </tr>
              </thead>
              <tbody>
                {recentResidents.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>
                      <Link to={`/residents/${r.id}`} style={{ color: 'var(--text-primary)' }}>
                        {r.first_name} {r.last_name}
                      </Link>
                    </td>
                    <td className="text-secondary">{r.nickname || '-'}</td>
                    <td>
                      <span className="badge badge-purple">
                        {r.houses?.zones?.name || '-'}
                      </span>
                    </td>
                    <td>{r.houses?.house_number || '-'}</td>
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
