import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import CustomSelect from '../components/CustomSelect';
import {
  maskIdCard, formatIdCard, calculateAge, formatThaiDate, formatDateForInput,
  EDUCATION_OPTIONS, MARITAL_STATUS_OPTIONS,
} from '../lib/utils';
import {
  ArrowLeft, Eye, EyeOff, Pencil, Trash2, MapPin, Home, Phone,
  GraduationCap, Heart, Calendar, CreditCard, User, FileText, Crown,
} from 'lucide-react';

export default function ResidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, user } = useAuth();
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIdCard, setShowIdCard] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [houses, setHouses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchResident();
    fetchHouses();
  }, [id]);

  async function fetchResident() {
    const { data, error } = await supabase
      .from('residents')
      .select('*, houses(house_number, address_detail, zones(name))')
      .eq('id', id)
      .single();

    if (error || !data) {
      navigate('/residents');
      return;
    }
    setResident(data);
    setLoading(false);
  }

  async function fetchHouses() {
    const { data } = await supabase
      .from('houses')
      .select('*, zones(name)')
      .order('house_number');
    setHouses(data || []);
  }

  function openEdit() {
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
    setEditError('');
    setEditOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setEditError('');

    const { error } = await supabase
      .from('residents')
      .update({
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
      })
      .eq('id', id);

    if (error) {
      setEditError(error.message);
      setSaving(false);
      return;
    }

    setEditOpen(false);
    setSaving(false);
    fetchResident();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    await supabase.from('residents').delete().eq('id', id);
    setDeleteLoading(false);
    navigate('/residents');
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!resident) return null;

  const age = calculateAge(resident.date_of_birth);
  const initial = resident.first_name?.charAt(0) || '?';

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/residents">สมาชิก</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{resident.first_name} {resident.last_name}</span>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> ย้อนกลับ
          </button>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-secondary" onClick={openEdit}>
            <Pencil size={16} /> แก้ไข
          </button>
          <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={16} /> ลบ
          </button>
        </div>
      </div>

      {/* Detail Card */}
      <div className="detail-card">
        <div className="detail-header">
          <div className="detail-avatar">{initial}</div>
          <div>
            <div className="detail-name">
              {resident.first_name} {resident.last_name}
              {resident.is_head_of_house && (
                <span className="badge badge-green" style={{ marginLeft: '12px', verticalAlign: 'middle' }}>
                  <Crown size={12} /> หัวหน้าครัวเรือน
                </span>
              )}
            </div>
            <div className="detail-subtitle">
              {resident.nickname && `"${resident.nickname}" • `}
              {resident.houses?.zones?.name} • บ้านเลขที่ {resident.houses?.house_number}
            </div>
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-grid">
            {/* ID Card */}
            <div className="detail-field">
              <span className="detail-field-label">
                <CreditCard size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                เลขบัตรประชาชน
              </span>
              <span className="detail-field-value font-mono">
                {showIdCard ? formatIdCard(resident.id_card) : maskIdCard(resident.id_card)}
                {resident.id_card && isSuperAdmin && (
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => setShowIdCard(!showIdCard)}
                    title={showIdCard ? 'ซ่อน' : 'แสดง'}
                  >
                    {showIdCard ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </span>
            </div>

            {/* Nickname */}
            <div className="detail-field">
              <span className="detail-field-label">
                <User size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                ชื่อเล่น
              </span>
              <span className="detail-field-value">{resident.nickname || '-'}</span>
            </div>

            {/* DOB */}
            <div className="detail-field">
              <span className="detail-field-label">
                <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                วันเดือนปีเกิด
              </span>
              <span className="detail-field-value">{formatThaiDate(resident.date_of_birth)}</span>
            </div>

            {/* Age */}
            <div className="detail-field">
              <span className="detail-field-label">อายุ</span>
              <span className="detail-field-value">
                <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {age}
                </span>
                {' '}ปี
              </span>
            </div>

            {/* Education */}
            <div className="detail-field">
              <span className="detail-field-label">
                <GraduationCap size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                การศึกษา
              </span>
              <span className="detail-field-value">{resident.education || '-'}</span>
            </div>

            {/* Marital */}
            <div className="detail-field">
              <span className="detail-field-label">
                <Heart size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                สถานภาพ
              </span>
              <span className="detail-field-value">
                <span className="badge badge-primary">{resident.marital_status || '-'}</span>
              </span>
            </div>

            {/* Phone */}
            <div className="detail-field">
              <span className="detail-field-label">
                <Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                เบอร์โทร
              </span>
              <span className="detail-field-value">{resident.phone || '-'}</span>
            </div>

            {/* Address */}
            <div className="detail-field">
              <span className="detail-field-label">
                <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                โซน
              </span>
              <span className="detail-field-value">{resident.houses?.zones?.name || '-'}</span>
            </div>

            <div className="detail-field">
              <span className="detail-field-label">
                <Home size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                บ้านเลขที่
              </span>
              <span className="detail-field-value">{resident.houses?.house_number || '-'}</span>
            </div>
          </div>

          {/* Notes */}
          {resident.notes && (
            <div className="detail-field" style={{ marginTop: 'var(--space-xl)' }}>
              <span className="detail-field-label">
                <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                หมายเหตุ
              </span>
              <span className="detail-field-value" style={{ whiteSpace: 'pre-wrap' }}>
                {resident.notes}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="แก้ไขข้อมูลสมาชิก" size="lg">
        <form onSubmit={handleSave}>
          {editError && <div className="alert alert-error">{editError}</div>}

          <div className="form-group">
            <label className="form-label">บ้าน <span className="required">*</span></label>
            <CustomSelect
              value={formData.house_id}
              onChange={(e) => setFormData({ ...formData, house_id: e.target.value })}
              options={houses.map(h => ({
                value: h.id,
                label: `${h.zones?.name || 'ไม่มีโซน'} — เลขที่ ${h.house_number}`
              }))}
              placeholder="เลือกบ้าน"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ชื่อ <span className="required">*</span></label>
              <input type="text" className="form-input" value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">นามสกุล <span className="required">*</span></label>
              <input type="text" className="form-input" value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ชื่อเล่น</label>
              <input type="text" className="form-input" value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">เบอร์โทร</label>
              <input type="tel" className="form-input" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">เลขบัตรประชาชน</label>
            <input type="text" className="form-input" maxLength={13} value={formData.id_card}
              onChange={(e) => setFormData({ ...formData, id_card: e.target.value.replace(/\D/g, '') })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> วันเดือนปีเกิด
              </label>
              <input type="date" className="form-input" value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
              {formData.date_of_birth && (
                <div className="age-badge-live">
                  🎂 อายุประมาณ {calculateAge(formData.date_of_birth)} ปี
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">สถานภาพ</label>
              <CustomSelect
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                options={MARITAL_STATUS_OPTIONS.map(o => ({ value: o, label: o }))}
                placeholder="เลือก"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">การศึกษา</label>
            <CustomSelect
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              options={EDUCATION_OPTIONS.map(o => ({ value: o, label: o }))}
              placeholder="เลือก"
            />
          </div>

          <div className="form-group">
            <label className="form-label">หมายเหตุ</label>
            <textarea className="form-textarea" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.is_head_of_house}
                onChange={(e) => setFormData({ ...formData, is_head_of_house: e.target.checked })} />
              <span>หัวหน้าครัวเรือน</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="ลบสมาชิก"
        message={`ต้องการลบ "${resident.first_name} ${resident.last_name}" หรือไม่?`}
      />
    </div>
  );
}
