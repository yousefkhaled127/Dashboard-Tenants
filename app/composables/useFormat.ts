// ============================================================
// useFormat — دوال تنسيق خالصة (بدون اعتماد على الحالة)
// ============================================================

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export function useFormat() {
  const monthKey = (d: Date = new Date()) =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')

  const monthLabel = (mk: string) => {
    const [y, m] = mk.split('-').map(Number)
    return MONTHS_AR[m - 1] + ' ' + y
  }

  const fmtDate = (iso: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ar-SA-u-nu-latn', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const fmtMoney = (n: number | string) =>
    (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ر.س'

  const todayISO = () => new Date().toISOString().slice(0, 10)

  const lastNMonths = (n: number) => {
    const arr: string[] = []
    const d = new Date()
    for (let i = n - 1; i >= 0; i--) {
      const dd = new Date(d.getFullYear(), d.getMonth() - i, 1)
      arr.push(monthKey(dd))
    }
    return arr
  }

  return { monthKey, monthLabel, fmtDate, fmtMoney, todayISO, lastNMonths }
}
