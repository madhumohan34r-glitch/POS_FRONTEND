// Helpers for split payments and change calculations
export interface SplitPayment {
  method: 'cash' | 'card' | 'upi';
  amount: number;
  cashTendered?: number; // for cash, what customer handed over
}

export const sumPaid = (splits: SplitPayment[]) =>
  splits.reduce((sum, s) => sum + (Number.isFinite(s.amount) ? s.amount : 0), 0);

export const calcChange = (splits: SplitPayment[]) =>
  splits.reduce((sum, s) => {
    if (s.method !== 'cash') return sum;
    const tendered = s.cashTendered ?? s.amount;
    return sum + Math.max(0, tendered - s.amount);
  }, 0);

export const isFullyPaid = (splits: SplitPayment[], grandTotal: number) =>
  Math.round(sumPaid(splits) * 100) >= Math.round(grandTotal * 100);

export const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
