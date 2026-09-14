import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Building2, Eye, EyeOff, Sparkles, Phone, MapPin } from 'lucide-react';
import { VILLAGES } from '../lib/constants';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [villageName, setVillageName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setError('กรุณากรอกชื่อ-นามสกุล');
          setLoading(false);
          return;
        }
        if (!villageName) {
          setError('กรุณาเลือกหมู่บ้าน');
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setError('กรุณากรอกเบอร์โทรศัพท์');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, villageName, phone);
        if (error) {
          setError(error.message === 'User already registered'
            ? 'อีเมลนี้ถูกใช้งานแล้ว'
            : error.message);
        } else {
          setSuccess('สมัครสมาชิกสำเร็จ! บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ กรุณาลองเข้าสู่ระบบเพื่อตรวจสอบสถานะ');
          setIsRegister(false);
          setFullName('');
          setVillageName('');
          setPhone('');
          setPassword('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message === 'Invalid login credentials'
            ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
            : error.message);
        }
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="gemini-pill-tag" style={{ margin: '0 auto 12px auto' }}>
            <Sparkles size={13} className="gemini-sparkle-spin" /> Gemini AI Experience
          </div>
          <div className="login-logo-icon">
            <Sparkles size={34} className="gemini-sparkle-spin" />
          </div>
          <h1 className="gemini-brand-title" style={{ justifyContent: 'center', fontSize: '1.75rem' }}>
            Village <span className="gemini-ai-badge">AI</span>
          </h1>
          <p>ระบบจัดการหมู่บ้านอัจฉริยะ โฉมใหม่สไตล์ Gemini</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">
                  ชื่อ-นามสกุล <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="กรอกชื่อ-นามสกุล"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  เลือกบัญชีหมู่บ้าน <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  required
                >
                  <option value="">-- เลือกหมู่บ้าน --</option>
                  {VILLAGES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  เบอร์โทรศัพท์ <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="เช่น 081-234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">
              อีเมล <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              รหัสผ่าน <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัว)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ marginTop: 'var(--space-md)' }}
          >
            {loading
              ? (isRegister ? 'กำลังสมัคร...' : 'กำลังเข้าสู่ระบบ...')
              : (isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ')}
          </button>
        </form>

        <div className="login-toggle">
          {isRegister ? (
            <>
              มีบัญชีอยู่แล้ว?{' '}
              <button onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}>
                เข้าสู่ระบบ
              </button>
            </>
          ) : (
            <>
              ยังไม่มีบัญชี?{' '}
              <button onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}>
                สมัครสมาชิก
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
