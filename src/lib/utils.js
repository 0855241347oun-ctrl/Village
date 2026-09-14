/**
 * Mask Thai ID card number - show only last 4 digits
 * Input:  "1234567890123"
 * Output: "X-XXXX-XXXXX-01-23"
 */
export function maskIdCard(idCard) {
  if (!idCard || idCard.length !== 13) return idCard || '-';
  const digits = idCard.replace(/\D/g, '');
  if (digits.length !== 13) return idCard;
  // Format: X-XXXX-XXXXX-XX-X with last 4 visible
  const last4 = digits.slice(9);
  return `X-XXXX-XXXXX-${last4.slice(0, 2)}-${last4.slice(2)}`;
}

/**
 * Format full ID card with proper grouping
 * Input:  "1234567890123"
 * Output: "1-2345-67890-12-3"
 */
export function formatIdCard(idCard) {
  if (!idCard) return '-';
  const digits = idCard.replace(/\D/g, '');
  if (digits.length !== 13) return idCard;
  return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return '-';
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Format date to Thai locale
 */
export function formatThaiDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Education level options
 */
export const EDUCATION_OPTIONS = [
  'ไม่ได้เรียน',
  'อนุบาล',
  'ประถมศึกษา',
  'มัธยมศึกษาตอนต้น',
  'มัธยมศึกษาตอนปลาย',
  'ปวช.',
  'ปวส.',
  'ปริญญาตรี',
  'ปริญญาโท',
  'ปริญญาเอก',
  'อื่นๆ',
];

/**
 * Marital status options
 */
export const MARITAL_STATUS_OPTIONS = [
  'โสด',
  'สมรส',
  'หม้าย',
  'หย่า',
  'แยกกันอยู่',
];
