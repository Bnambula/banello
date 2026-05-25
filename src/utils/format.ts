// ============================================================
// BANELLO PLATFORM — Utility Functions
// ============================================================

export function fmtUGX(amount: number, compact = false): string {
  if (compact && amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (compact && amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'K';
  }
  return new Intl.NumberFormat('en-UG').format(Math.round(amount));
}

export function fmtDate(dateStr: string, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = new Date(dateStr);
  if (style === 'short') return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short' });
  if (style === 'long') return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' });
  return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtPct(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%';
}

export function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function calcBatchMargin(batch: {
  totalPurchaseCost: number;
  transportCost: number;
  handlingCost: number;
  gradeAQty: number;
  gradeBQty: number;
  gradeCQty: number;
  wasteQty: number;
}): { totalCost: number; estimatedRevenue: number; margin: number } {
  const totalCost = batch.totalPurchaseCost + batch.transportCost + batch.handlingCost;
  const estimatedRevenue =
    batch.gradeAQty * 17000 +
    batch.gradeBQty * 11000 +
    batch.gradeCQty * 5000;
  const margin = estimatedRevenue > 0 ? ((estimatedRevenue - totalCost) / estimatedRevenue) * 100 : 0;
  return { totalCost, estimatedRevenue, margin };
}

export function groupExpensesByCategory(expenses: Array<{ category: string; amount: number }>) {
  return expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
}

export function totalExpenses(expenses: Array<{ amount: number }>): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function totalRevenue(sales: Array<{ totalAmount: number }>): number {
  return sales.reduce((sum, s) => sum + s.totalAmount, 0);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    confirmed: 'green', pending: 'amber', overdue: 'red',
    partial: 'yellow', 'in-stock': 'green', 'in-transit': 'blue',
    sold: 'gray', wasted: 'red', active: 'green', review: 'amber',
  };
  return map[status] || 'gray';
}

export function generateInvoiceNumber(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${n}`;
}

export function generateOrderNumber(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `BNL-${n}`;
}

// Export data as CSV string
export function toCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return '';
  const keys = headers || Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(row =>
    keys.map(k => {
      const val = String((row as Record<string, unknown>)[k] ?? '');
      return val.includes(',') ? `"${val}"` : val;
    }).join(',')
  )];
  return rows.join('\n');
}

// Download helper
export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  const csv = toCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
