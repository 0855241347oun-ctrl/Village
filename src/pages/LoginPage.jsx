import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Building2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message === 'User already registered'
            ? 'อีเมลนี้ถูกใช้งานแล้ว'
            : error.message);
        } else {
          setSuccess('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยัน หรือลองเข้าสู่ระบบ');
          setIsRegister(false);
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
          <div className="login-logo-icon">
            <Building2 size={32} />
          </div>
          <h1>Village Management</h1>
          <p>ระบบจัดการข้อมูลคนในหมู่บ้าน</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
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
