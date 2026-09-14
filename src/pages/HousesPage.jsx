import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Modal from '../components/Modal';
import CustomSelect from '../components/CustomSelect';
import ConfirmDialog from '../components/ConfirmDialog';
import { Home, Plus, Pencil, Trash2, Users, ChevronRight, MapPin, RotateCcw } from 'lucide-react';

export default function HousesPage() {
  const { isSuperAdmin, adminVillageContext } = useAuth();
  const [searchParams] = useSearchParams();
  const [houses, setHouses] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(searchParams.get('zone') || '');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({ zone_id: '', house_number: '', address_detail: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchZones();
  }, [adminVillageContext]);

  useEffect(() => {
    fetchHouses();
  }, [selectedZone, adminVillageContext]);

  async function fetchZones() {
    let query = supabase.from('zones').select('*').order('name');
    if (isSuperAdmin && adminVillageContext !== 'all') {
      query = query.eq('village_name', adminVillageContext);
    }
    const { data } = await query;
    setZones(data || []);
  }

  async function fetchHouses() {
    let query = supabase
      .from('houses')
      .select('*, zones(name), residents(id)')
      .order('house_number');

    if (selectedZone) {
      query = query.eq('zone_id', selectedZone);
    }
    if (isSuperAdmin && adminVillageContext !== 'all') {
      query = query.eq('village_name', adminVillageContext);
    }

    const { data } = await query;
    setHouses((data || []).map((h) => ({
      ...h,
      residentCount: h.residents?.length || 0,
      zoneName: h.zones?.name || '-',
    })));
    setLoading(false);
  }

  function openModal(house = null) {
    if (house) {
      setEditingHouse(house);
      setFormData({
        zone_id: house.zone_id,
        house_number: house.house_number,
        address_detail: house.address_detail || '',
      });
    } else {
      setEditingHouse(null);
      setFormData({
        zone_id: selectedZone || (zones[0]?.id || ''),
        house_number: '',
        address_detail: '',
      });
    }
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      zone_id: formData.zone_id,
      house_number: formData.house_number,
      address_detail: formData.address_detail,
    };

    if (editingHouse) {
      const { error } = await supabase.from('houses').update(payload).eq('id', editingHouse.id);
      if (error) {
        setError(error.message.includes('duplicate') ? 'บ้านเลขที่นี้ซ้ำในโซนเดียวกัน' : error.message);
        setSaving(false);
        return;
      }
    } else {
      if (isSuperAdmin && adminVillageContext === 'all') {
        setError('กรุณาเลือกหมู่บ้านที่ต้องการเพิ่มข้อมูลจากเมนูด้านซ้าย');
        setSaving(false);
        return;
      }
      
      if (isSuperAdmin && adminVillageContext !== 'all') {
        payload.village_name = adminVillageContext;
      }

      const { error } = await supabase.from('houses').insert(payload);
      if (error) {
        setError(error.message.includes('duplicate') ? 'บ้านเลขที่นี้ซ้ำในโซนเดียวกัน' : error.message);
        setSaving(false);
        return;
      }
    }

    setModalOpen(false);
    setSaving(false);
    fetchHouses();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    await supabase.from('houses').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setDeleteLoading(false);
    fetchHouses();
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">บ้านเลขที่</h1>
          <p className="page-subtitle">จัดการบ้านเลขที่ในหมู่บ้าน</p>
        </div>
        {(!isSuperAdmin || adminVillageContext !== 'all') && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            เพิ่มบ้าน
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="filter-group">
          <label><MapPin size={14} /> โซนที่ตั้ง</label>
          <CustomSelect
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            options={zones.map(z => ({ value: z.id, label: z.name }))}
            placeholder="ทั้งหมด (ทุกโซน)"
          />
        </div>
        {selectedZone && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={() => setSelectedZone('')}
            title="ล้างตัวกรอง"
          >
            <RotateCcw size={15} />
            แสดงทุกโซน
          </button>
        )}
      </div>

      {houses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Home className="empty-state-icon" size={48} />
            <p className="empty-state-title">ยังไม่มีข้อมูลบ้าน</p>
            <p className="empty-state-text">เริ่มต้นโดยการเพิ่มบ้านในระบบ</p>
            {(!isSuperAdmin || adminVillageContext !== 'all') && (
              <button className="btn btn-primary" onClick={() => openModal()}>
                <Plus size={18} /> เพิ่มบ้านหลังแรก
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {houses.map((house) => (
            <Link
              key={house.id}
              to={`/residents?house=${house.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card card-clickable house-card">
                <div className="flex items-center justify-between">
                  <div className="stat-card-icon blue">
                    <Home size={22} />
                  </div>
                  <div className="flex gap-sm" onClick={(e) => e.preventDefault()}>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => { e.preventDefault(); openModal(house); }}
                      title="แก้ไข"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm text-danger"
                      onClick={(e) => { e.preventDefault(); setDeleteTarget(house); }}
                      title="ลบ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="house-card-name">บ้านเลขที่ {house.house_number}</h3>
                <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                  <MapPin size={14} className="text-secondary" />
                  <span className="text-sm text-secondary">{house.zoneName}</span>
                </div>
                {house.address_detail && (
                  <p className="text-sm text-secondary">{house.address_detail}</p>
                )}
                <div className="house-card-count">
                  <Users size={16} />
                  {house.residentCount} สมาชิก
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
        title={editingHouse ? 'แก้ไขบ้าน' : 'เพิ่มบ้านใหม่'}
      >
        <form onSubmit={handleSave}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">
              โซน <span className="required">*</span>
            </label>
            <CustomSelect
              value={formData.zone_id}
              onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
              options={zones.map(z => ({ value: z.id, label: z.name }))}
              placeholder="เลือกโซน"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              บ้านเลขที่ <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น 1, 2/1, 99"
              value={formData.house_number}
              onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">รายละเอียดที่อยู่</label>
            <textarea
              className="form-textarea"
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              value={formData.address_detail}
              onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="ลบบ้าน"
        message={`ต้องการลบบ้านเลขที่ "${deleteTarget?.house_number}" หรือไม่? สมาชิกในบ้านนี้จะถูกลบทั้งหมด`}
      />
    </div>
  );
}
