import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Shield, UserCog, Search } from 'lucide-react';

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function toggleRole(userId, currentRole) {
    if (userId === profile.id) return; // Can't change own role
    setUpdating(userId);
    const newRole = currentRole === 'super_admin' ? 'user' : 'super_admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    await fetchUsers();
    setUpdating(null);
  }

  const filtered = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">จัดการผู้ใช้</h1>
          <p className="page-subtitle">{users.length} ผู้ใช้ทั้งหมด</p>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flex: 1 }}>
          <label>ค้นหา</label>
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาอีเมล, ชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-mobile-cards">
        {/* Desktop */}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ผู้ใช้</th>
                <th>อีเมล</th>
                <th>บทบาท</th>
                <th>วันที่สมัคร</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>
                    <div className="flex items-center gap-md">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-full)',
                          background: u.role === 'super_admin' ? 'var(--bg-gradient)' : 'var(--bg-input)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: u.role === 'super_admin' ? 'white' : 'var(--text-secondary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {u.full_name?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                      </div>
                      {u.full_name || '-'}
                    </div>
                  </td>
                  <td className="text-sm text-secondary">{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'super_admin' ? 'badge-purple' : 'badge-green'}`}>
                      {u.role === 'super_admin' ? (
                        <><Shield size={12} /> Super Admin</>
                      ) : (
                        <><UserCog size={12} /> User</>
                      )}
                    </span>
                  </td>
                  <td className="text-sm text-secondary">
                    {new Date(u.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td>
                    {u.id !== profile.id ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleRole(u.id, u.role)}
                        disabled={updating === u.id}
                      >
                        {updating === u.id
                          ? 'กำลังเปลี่ยน...'
                          : u.role === 'super_admin'
                            ? 'ลดเป็น User'
                            : 'เลื่อนเป็น Admin'}
                      </button>
                    ) : (
                      <span className="text-xs text-secondary">(คุณ)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-cards">
          {filtered.map((u) => (
            <div key={u.id} className="mobile-card">
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-title">{u.full_name || u.email}</div>
                  <div className="text-sm text-secondary">{u.email}</div>
                </div>
                <span className={`badge ${u.role === 'super_admin' ? 'badge-purple' : 'badge-green'}`}>
                  {u.role === 'super_admin' ? 'Admin' : 'User'}
                </span>
              </div>
              {u.id !== profile.id && (
                <div className="mobile-card-actions">
                  <button
                    className="btn btn-secondary btn-sm w-full"
                    onClick={() => toggleRole(u.id, u.role)}
                    disabled={updating === u.id}
                  >
                    {updating === u.id
                      ? 'กำลังเปลี่ยน...'
                      : u.role === 'super_admin'
                        ? 'ลดเป็น User'
                        : 'เลื่อนเป็น Admin'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
