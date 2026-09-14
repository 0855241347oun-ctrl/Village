import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { MapPin, Plus, Pencil, Trash2, Home, ChevronRight } from 'lucide-react';

export default function ZonesPage() {
  const { isSuperAdmin } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchZones();
  }, []);

  async function fetchZones() {
    const { data, error } = await supabase
      .from('zones')
      .select('*, houses(id)')
      .order('name');

    if (!error) {
      setZones(data.map((z) => ({ ...z, houseCount: z.houses?.length || 0 })));
    }
    setLoading(false);
  }

  function openModal(zone = null) {
    if (zone) {
      setEditingZone(zone);
      setFormData({ name: zone.name, description: zone.description || '' });
    } else {
      setEditingZone(null);
      setFormData({ name: '', description: '' });
    }
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (editingZone) {
      const { error } = await supabase
        .from('zones')
        .update({ name: formData.name, description: formData.description })
        .eq('id', editingZone.id);
      if (error) {
        setError(error.message.includes('duplicate') ? 'ชื่อโซนนี้มีอยู่แล้ว' : error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('zones')
        .insert({ name: formData.name, description: formData.description });
      if (error) {
        setError(error.message.includes('duplicate') ? 'ชื่อโซนนี้มีอยู่แล้ว' : error.message);
        setSaving(false);
        return;
      }
    }

    setModalOpen(false);
    setSaving(false);
    fetchZones();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    await supabase.from('zones').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setDeleteLoading(false);
    fetchZones();
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
          <h1 className="page-title">โซนในหมู่บ้าน</h1>
          <p className="page-subtitle">จัดการโซนพื้นที่ในหมู่บ้าน</p>
        </div>
        {isSuperAdmin && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            เพิ่มโซน
          </button>
        )}
      </div>

      {zones.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <MapPin className="empty-state-icon" size={48} />
            <p className="empty-state-title">ยังไม่มีข้อมูลโซน</p>
            <p className="empty-state-text">เริ่มต้นโดยการเพิ่มโซนในหมู่บ้าน</p>
            {isSuperAdmin && (
              <button className="btn btn-primary" onClick={() => openModal()}>
                <Plus size={18} /> เพิ่มโซนแรก
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {zones.map((zone) => (
            <Link
              key={zone.id}
              to={`/houses?zone=${zone.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card card-clickable zone-card">
                <div className="flex items-center justify-between">
                  <div className="stat-card-icon purple">
                    <MapPin size={22} />
                  </div>
                  {isSuperAdmin && (
                    <div className="flex gap-sm" onClick={(e) => e.preventDefault()}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={(e) => { e.preventDefault(); openModal(zone); }}
                        title="แก้ไข"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm text-danger"
                        onClick={(e) => { e.preventDefault(); setDeleteTarget(zone); }}
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="zone-card-name">{zone.name}</h3>
                {zone.description && (
                  <p className="zone-card-desc">{zone.description}</p>
                )}
                <div className="zone-card-count">
                  <Home size={16} />
                  {zone.houseCount} หลังคาเรือน
                  <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingZone ? 'แก้ไขโซน' : 'เพิ่มโซนใหม่'}
      >
        <form onSubmit={handleSave}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">
              ชื่อโซน <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น โซน A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">คำอธิบาย</label>
            <textarea
              className="form-textarea"
              placeholder="รายละเอียดเพิ่มเติม"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="ลบโซน"
        message={`ต้องการลบ "${deleteTarget?.name}" หรือไม่? บ้านและสมาชิกในโซนนี้จะถูกลบทั้งหมด`}
      />
    </div>
  );
}
