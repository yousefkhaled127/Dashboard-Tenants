// composable مشترك للـsession — يُستخدم في جميع الصفحات
export function useSession() {
  const session = useState('tahsilat-session', () => ({ role: '', id: '', name: '' }))

  function loadSession() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem('tahsilat-session')
      if (raw) {
        const s = JSON.parse(raw)
        session.value = s
      }
    } catch {}
  }

  function clearSession() {
    session.value = { role: '', id: '', name: '' }
    if (import.meta.client) localStorage.removeItem('tahsilat-session')
  }

  function saveSession(s: { role: string; id: string; name: string }) {
    session.value = s
    if (import.meta.client) localStorage.setItem('tahsilat-session', JSON.stringify(s))
  }

  return { session, loadSession, clearSession, saveSession }
}
