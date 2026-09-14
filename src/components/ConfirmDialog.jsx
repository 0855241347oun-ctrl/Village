import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon">
            <AlertTriangle size={28} />
          </div>
          <h3 className="confirm-dialog-title">{title || 'ยืนยันการลบ'}</h3>
          <p className="confirm-dialog-message">
            {message || 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้'}
          </p>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
              ยกเลิก
            </button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? 'กำลังลบ...' : 'ลบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
