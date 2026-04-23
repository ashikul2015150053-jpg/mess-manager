import { format } from 'date-fns';

export function formatCurrency(amount) {
  return '৳' + Number(amount || 0).toLocaleString('en-BD');
}

export function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key) {
  if (!key) return '';
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return format(date, 'MMMM yyyy');
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function generateMonthOptions(count = 12) {
  const options = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({ key, label: format(d, 'MMMM yyyy') });
  }
  return options;
}

export function whatsappLink(phone, message) {
  // Normalize BD phone number to international format
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '88' + p;
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}
