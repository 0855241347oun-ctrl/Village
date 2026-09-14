import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { maskIdCard, calculateAge, formatDateForInput, EDUCATION_OPTIONS, MARITAL_STATUS_OPTIONS } from '../lib/utils';
import {
  Users, Plus, Pencil, Trash2, Search, Eye, UserPlus, RotateCcw, MapPin, Home, Phone, Calendar,
} from 'lucide-react';

export default function ResidentsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [residents, setResidents] = useState([]);
  const [zones, setZones] = useState([]);
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedHouse, setSelectedHouse] = useState(searchParams.get('house') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const emptyForm = {
    house_id: '',
    first_name: '',
    last_name: '',
    nickname: '',
    id_card: '',
    date_of_birth: '',
    education: '',
    marital_status: '',
    phone: '',
    notes: '',
    is_head_of_house: false,
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchZonesAndHouses();
  }, []);

  useEffect(() => {
    fetchResidents();
  }, [selectedZone, selectedHouse]);

  useEffect(() => {
    if (selectedZone) {
      setFilteredHouses(houses.filter((h) => h.zone_id === selectedZone));
    } else {
      setFilteredHouses(houses);
    }
  }, [selectedZone, houses]);

  // When navigating with ?house=xxx, resolve the zone
  useEffect(() => {
    if (selectedHouse && houses.length > 0) {
      const house = houses.find((h) => h.id === selectedHouse);
      if (house) {
        setSelectedZone(house.zone_id);
      }
    }
  }, [selectedHouse, houses]);

  async function fetchZonesAndHouses() {
    const [zonesRes, housesRes] = await Promise.all([
      supabase.from('zones').select('*').order('name'),
      supabase.from('houses').select('*, zones(name)').order('house_number'),
    ]);
    setZones(zonesRes.data || []);
    setHouses(housesRes.data || []);
  }

  async function fetchResidents() {
    let query = supabase
      .from('residents')
      .select('*, houses(house_number, zone_id, zones(name))')
      .order('first_name');

    if (selectedHouse) {
      query = query.eq('house_id', selectedHouse);
    } else if (selectedZone) {
      // Get house IDs for the zone
      const { data: zoneHouses } = await supabase
        .from('houses')
        .select('id')
        .eq('zone_id', selectedZone);
      const houseIds = (zoneHouses || []).map((h) => h.id);
      if (houseIds.length > 0) {
        query = query.in('house_id', houseIds);
      } else {
        setResidents([]);
        setLoading(false);
        return;
      }
    }

    const { data } = await query;
    setResidents(data || []);
    setLoading(false);
  }

  const filteredResidents = residents.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.first_name?.toLowerCase().includes(term) ||
      r.last_name?.toLowerCase().includes(term) ||
      r.nickname?.toLowerCase().includes(term)
    );
  });

  function openModal(resident = null) {
    if (resident) {
      setEditingResident(resident);
      setFormData({
        house_id: resident.house_id,
        first_name: resident.first_name,
        last_name: resident.last_name,
        nickname: resident.nickname || '',
        id_card: resident.id_card || '',
        date_of_birth: formatDateForInput(resident.date_of_birth),
        education: resident.education || '',
        marital_status: resident.marital_status || '',
        phone: resident.phone || '',
        notes: resident.notes || '',
        is_head_of_house: resident.is_head_of_house || false,
      });
    } else {
      setEditingResident(null);
      setFormData({ ...emptyForm, house_id: selectedHouse || '' });
    }
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      house_id: formData.house_id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      nickname: formData.nickname || null,
      id_card: formData.id_card || null,
      date_of_birth: formData.date_of_birth || null,
      education: formData.education || null,
      marital_status: formData.marital_status || null,
      phone: formData.phone || null,
      notes: formData.notes || null,
      is_head_of_house: formData.is_head_of_house,
    };

    if (editingResident) {
      const { error } = await supabase
        .from('residents')
        .update(payload)
        .eq('id', editingResident.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase
        .from('residents')
        .insert({ ...payload, created_by: user.id });
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setModalOpen(false);
    setSaving(false);
    fetchResidents();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    await supabase.from('residents').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setDeleteLoading(false);
    fetchResidents();
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">สมาชิกในหมู่บ้าน</h1>
          <p className="page-subtitle">
            {filteredResidents.length} คน
            {selectedZone && zones.find((z) => z.id === selectedZone)
              ? ` ใน${zones.find((z) => z.id === selectedZone).name}`
              : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <UserPlus size={18} />
          เพิ่มสมาชิก
        </button>
      </div>

      {/* Cascading Filter */}
      <div className="filter-bar">
        <div className="filter-group">
          <label><MapPin size={14} /> โซนที่ตั้ง</label>
          <select
            className="form-select"
            value={selectedZone}
            onChange={(e) => {
              setSelectedZone(e.target.value);
              setSelectedHouse('');
            }}
          >
            <option value="">ทั้งหมด (ทุกโซน)</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label><Home size={14} /> บ้านเลขที่</label>
          <select
            className="form-select"
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
          >
            <option value="">ทั้งหมด (ทุกบ้าน)</option>
            {filteredHouses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.house_number} {!selectedZone && h.zones ? `(${h.zones.name})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label><Search size={14} /> ค้นหาชื่อ/เลขบัตร</label>
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาชื่อ, นามสกุล, ชื่อเล่น..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {(selectedZone || selectedHouse || searchTerm) && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={() => {
              setSelectedZone('');
              setSelectedHouse('');
              setSearchTerm('');
            }}
            title="ล้างตัวกรองทั้งหมด"
          >
            <RotateCcw size={15} />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Results */}
      {filteredResidents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users className="empty-state-icon" size={48} />
            <p className="empty-state-title">ไม่พบข้อมูลสมาชิก</p>
            <p className="empty-state-text">
              {searchTerm ? 'ลองเปลี่ยนคำค้นหา' : 'เริ่มต้นโดยการเพิ่มสมาชิก'}
            </p>
            {!searchTerm && (
              <button className="btn btn-primary" onClick={() => openModal()}>
                <UserPlus size={18} /> เพิ่มสมาชิกคนแรก
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="table-mobile-cards">
          {/* Desktop Table */}
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ชื่อเล่น</th>
                  <th>เลขบัตรประชาชน</th>
                  <th>อายุ</th>
                  <th>สถานภาพ</th>
                  <th>โซน / บ้าน</th>
                  <th style={{ width: '120px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>
                      {r.first_name} {r.last_name}
                      {r.is_head_of_house && (
                        <span className="badge badge-green" style={{ marginLeft: '8px' }}>
                          หัวหน้า
                        </span>
                      )}
                    </td>
                    <td className="text-secondary">{r.nickname || '-'}</td>
                    <td className="font-mono text-sm">{maskIdCard(r.id_card)}</td>
                    <td>{calculateAge(r.date_of_birth)} ปี</td>
                    <td>
                      <span className="badge badge-primary">
                        {r.marital_status || '-'}
                      </span>
                    </td>
                    <td className="text-sm">
                      {r.houses?.zones?.name} / เลขที่ {r.houses?.house_number}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          to={`/residents/${r.id}`}
                          className="btn btn-ghost btn-icon btn-sm"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => openModal(r)}
                          title="แก้ไข"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm text-danger"
                          onClick={() => setDeleteTarget(r)}
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-cards">
            {filteredResidents.map((r) => (
              <div key={r.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-title">
                      {r.first_name} {r.last_name}
                      {r.is_head_of_house && (
                        <span className="badge badge-green" style={{ marginLeft: '8px' }}>
                          หัวหน้า
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-secondary">{r.nickname || ''}</div>
                  </div>
                </div>
                <div className="mobile-card-body">
                  <div className="mobile-card-field">
                    <span className="mobile-card-field-label">เลขบัตร</span>
                    <span className="mobile-card-field-value font-mono">{maskIdCard(r.id_card)}</span>
                  </div>
                  <div className="mobile-card-field">
                    <span className="mobile-card-field-label">อายุ</span>
                    <span className="mobile-card-field-value">{calculateAge(r.date_of_birth)} ปี</span>
                  </div>
                  <div className="mobile-card-field">
                    <span className="mobile-card-field-label">สถานภาพ</span>
                    <span className="mobile-card-field-value">{r.marital_status || '-'}</span>
                  </div>
                  <div className="mobile-card-field">
                    <span className="mobile-card-field-label">ที่อยู่</span>
                    <span className="mobile-card-field-value">
                      {r.houses?.zones?.name} / {r.houses?.house_number}
                    </span>
                  </div>
                </div>
                <div className="mobile-card-actions">
                  <Link to={`/residents/${r.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    <Eye size={14} /> ดูรายละเอียด
                  </Link>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal(r)}>
                    <Pencil size={16} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => setDeleteTarget(r)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingResident ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}
        size="lg"
      >
        <form onSubmit={handleSave}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">
              บ้าน <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={formData.house_id}
              onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}
              required
            >
              <option value="">เลือกบ้าน</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.zones?.name} — เลขที่ {h.house_number}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                ชื่อ <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="ชื่อจริง"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                นามสกุล <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="นามสกุล"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ชื่อเล่น</label>
              <input
                type="text"
                className="form-input"
                placeholder="ชื่อเล่น"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">เบอร์โทร</label>
              <input
                type="tel"
                className="form-input"
                placeholder="0xx-xxx-xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">เลขบัตรประชาชน</label>
            <input
              type="text"
              className="form-input"
              placeholder="เลข 13 หลัก"
              maxLength={13}
              value={formData.id_card}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, id_card: val });
              }}
            />
            <p className="form-hint">เลขบัตรจะถูกซ่อนเมื่อแสดงผล (แสดงเฉพาะ 4 ตัวท้าย)</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> วันเดือนปีเกิด
              </label>
              <input
                type="date"
                className="form-input"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
              {formData.date_of_birth && (
                <div className="age-badge-live">
                  🎂 อายุประมาณ {calculateAge(formData.date_of_birth)} ปี
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">สถานภาพ</label>
              <select
                className="form-select"
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
              >
                <option value="">เลือกสถานภาพ</option>
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">การศึกษา</label>
            <select
              className="form-select"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            >
              <option value="">เลือกระดับการศึกษา</option>
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">หมายเหตุ</label>
            <textarea
              className="form-textarea"
              placeholder="หมายเหตุเพิ่มเติม"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_head_of_house}
                onChange={(e) => setFormData({ ...formData, is_head_of_house: e.target.checked })}
              />
              <span className="form-label" style={{ marginBottom: 0 }}>หัวหน้าครัวเรือน</span>
            </label>
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
        title="ลบสมาชิก"
        message={`ต้องการลบ "${deleteTarget?.first_name} ${deleteTarget?.last_name}" หรือไม่?`}
      />
    </div>
  );
}
