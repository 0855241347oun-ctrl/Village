import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { VILLAGES } from '../lib/constants';
import Modal from '../components/Modal';
import {
  Shield, UserCog, Search, CheckCircle, XCircle,
  Clock, Phone, MapPin, Edit3, AlertTriangle, Sparkles,
  UserCheck, UserX
} from 'lucide-react';

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  // Village Edit Modal
  const [villageModalOpen, setVillageModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editVillage, setEditVillage] = useState('');
  const [savingVillage, setSavingVillage] = useState(false);

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
    if (userId === profile.id) return;
    setUpdating(userId);
    const newRole = currentRole === 'super_admin' ? 'user' : 'super_admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    await fetchUsers();
    setUpdating(null);
  }

  async function updateStatus(userId, newStatus) {
    setUpdating(userId);
    await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    await fetchUsers();
    setUpdating(null);
  }

  function openVillageModal(user) {
    setEditingUser(user);
    setEditVillage(user.village_name || '');
    setVillageModalOpen(true);
  }

  async function handleSaveVillage(e) {
    e.preventDefault();
    if (!editingUser) return;
    setSavingVillage(true);
    await supabase
      .from('profiles')
      .update({ village_name: editVillage })
      .eq('id', editingUser.id);
    setSavingVillage(false);
    setVillageModalOpen(false);
    setEditingUser(null);
    await fetchUsers();
  }

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const pendingCount = pendingUsers.length;

  const filtered = users.filter((u) => {
    // Status filter
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    // Search filter
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term) ||
      u.village_name?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-green"><CheckCircle size={12} /> อนุมัติแล้ว</span>;
      case 'rejected':
        return <span className="badge badge-red"><XCircle size={12} /> ปฏิเสธ</span>;
      case 'pending':
      default:
        return <span className="badge badge-orange"><Clock size={12} /> รอการอนุมัติ</span>;
    }
  };

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

      {/* Pending Notification Banner */}
      {pendingCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249,171,0,0.12), rgba(234,67,53,0.08))',
            border: '1px solid rgba(249,171,0,0.3)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-lg) var(--space-xl)',
            marginBottom: 'var(--space-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
            flexWrap: 'wrap',
            animation: 'slideUp 0.4s ease',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-full)',
            background: 'rgba(249,171,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle size={24} style={{ color: '#f9ab00' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', marginBottom: 2 }}>
              มีผู้สมัครใหม่ {pendingCount} คนรอการอนุมัติ!
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              กรุณาตรวจสอบและอนุมัติหรือปฏิเสธผู้ใช้ด้านล่าง
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setStatusFilter('pending')}
          >
            <Clock size={14} /> ดูรายชื่อที่รอ
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-group">
          <label><MapPin size={14} /> สถานะ</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอการอนุมัติ ({users.filter(u => u.status === 'pending').length})</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>ค้นหา</label>
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาอีเมล, ชื่อ, หมู่บ้าน, เบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-mobile-cards">
        {/* Desktop Table */}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ผู้ใช้</th>
                <th>อีเมล</th>
                <th>หมู่บ้าน</th>
                <th>เบอร์โทร</th>
                <th>สถานะ</th>
                <th>บทบาท</th>
                <th>วันที่สมัคร</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={u.status === 'pending' ? { background: 'rgba(249,171,0,0.04)' } : {}}>
                  <td style={{ fontWeight: 500 }}>
                    <div className="flex items-center gap-md">
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-full)',
                          background: u.status === 'pending'
                            ? 'linear-gradient(135deg, rgba(249,171,0,0.3), rgba(234,67,53,0.2))'
                            : u.role === 'super_admin'
                              ? 'var(--bg-gradient-gemini)'
                              : 'var(--bg-input)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: u.status === 'pending'
                            ? '#f9ab00'
                            : u.role === 'super_admin'
                              ? 'white'
                              : 'var(--text-secondary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 700,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="text-sm" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.village_name || '-'}
                      </span>
                      {u.id !== profile.id && (
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => openVillageModal(u)}
                          title="แก้ไขหมู่บ้าน"
                          style={{ padding: 4, minWidth: 'auto' }}
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="text-sm">
                    {u.phone ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={13} style={{ color: 'var(--text-tertiary)' }} />
                        {u.phone}
                      </div>
                    ) : '-'}
                  </td>
                  <td>{getStatusBadge(u.status)}</td>
                  <td>
                    <span className={`badge ${u.role === 'super_admin' ? 'badge-purple' : 'badge-primary'}`}>
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
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* Approve / Reject */}
                        {u.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: 'rgba(16,185,129,0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16,185,129,0.3)',
                                padding: '4px 10px',
                              }}
                              onClick={() => updateStatus(u.id, 'approved')}
                              disabled={updating === u.id}
                              title="อนุมัติ"
                            >
                              <UserCheck size={14} /> อนุมัติ
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: 'rgba(234,67,53,0.12)',
                                color: '#ea4335',
                                border: '1px solid rgba(234,67,53,0.3)',
                                padding: '4px 10px',
                              }}
                              onClick={() => updateStatus(u.id, 'rejected')}
                              disabled={updating === u.id}
                              title="ปฏิเสธ"
                            >
                              <UserX size={14} /> ปฏิเสธ
                            </button>
                          </>
                        )}
                        {u.status === 'rejected' && (
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'rgba(16,185,129,0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16,185,129,0.3)',
                              padding: '4px 10px',
                            }}
                            onClick={() => updateStatus(u.id, 'approved')}
                            disabled={updating === u.id}
                          >
                            <UserCheck size={14} /> อนุมัติ
                          </button>
                        )}
                        {u.status === 'approved' && (
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
                        )}
                      </div>
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
            <div key={u.id} className="mobile-card" style={u.status === 'pending' ? { borderColor: 'rgba(249,171,0,0.4)' } : {}}>
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-title">{u.full_name || u.email}</div>
                  <div className="text-sm text-secondary">{u.email}</div>
                </div>
                {getStatusBadge(u.status)}
              </div>

              <div className="mobile-card-body">
                <div className="mobile-card-field">
                  <span className="mobile-card-field-label">หมู่บ้าน</span>
                  <span className="mobile-card-field-value">
                    {u.village_name || '-'}
                    {u.id !== profile.id && (
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => openVillageModal(u)}
                        style={{ padding: 2, minWidth: 'auto', marginLeft: 4 }}
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                  </span>
                </div>
                <div className="mobile-card-field">
                  <span className="mobile-card-field-label">เบอร์โทร</span>
                  <span className="mobile-card-field-value">{u.phone || '-'}</span>
                </div>
                <div className="mobile-card-field">
                  <span className="mobile-card-field-label">บทบาท</span>
                  <span className="mobile-card-field-value">
                    <span className={`badge ${u.role === 'super_admin' ? 'badge-purple' : 'badge-primary'}`}>
                      {u.role === 'super_admin' ? 'Admin' : 'User'}
                    </span>
                  </span>
                </div>
                <div className="mobile-card-field">
                  <span className="mobile-card-field-label">วันที่สมัคร</span>
                  <span className="mobile-card-field-value text-sm">
                    {new Date(u.created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>

              {u.id !== profile.id && (
                <div className="mobile-card-actions">
                  {u.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-sm"
                        style={{
                          flex: 1,
                          background: 'rgba(16,185,129,0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.3)',
                        }}
                        onClick={() => updateStatus(u.id, 'approved')}
                        disabled={updating === u.id}
                      >
                        <UserCheck size={14} /> อนุมัติ
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{
                          flex: 1,
                          background: 'rgba(234,67,53,0.12)',
                          color: '#ea4335',
                          border: '1px solid rgba(234,67,53,0.3)',
                        }}
                        onClick={() => updateStatus(u.id, 'rejected')}
                        disabled={updating === u.id}
                      >
                        <UserX size={14} /> ปฏิเสธ
                      </button>
                    </>
                  )}
                  {u.status === 'rejected' && (
                    <button
                      className="btn btn-sm w-full"
                      style={{
                        background: 'rgba(16,185,129,0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.3)',
                      }}
                      onClick={() => updateStatus(u.id, 'approved')}
                      disabled={updating === u.id}
                    >
                      <UserCheck size={14} /> อนุมัติ
                    </button>
                  )}
                  {u.status === 'approved' && (
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
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Village Edit Modal */}
      <Modal
        isOpen={villageModalOpen}
        onClose={() => setVillageModalOpen(false)}
        title="แก้ไขหมู่บ้าน"
      >
        <form onSubmit={handleSaveVillage}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-sm)' }}>
              แก้ไขหมู่บ้านของ: <strong>{editingUser?.full_name || editingUser?.email}</strong>
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">
              <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              เลือกหมู่บ้าน
            </label>
            <select
              className="form-select"
              value={editVillage}
              onChange={(e) => setEditVillage(e.target.value)}
              required
            >
              <option value="">-- เลือกหมู่บ้าน --</option>
              {VILLAGES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setVillageModalOpen(false)}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingVillage}>
              {savingVillage ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
