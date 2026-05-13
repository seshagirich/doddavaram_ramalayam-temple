import { useState, useRef, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ─── MEMBERS ────────────────────────────────────────────────────────────────
const MEMBERS = [
  { name: 'Koteswara Rao Chennupati', initials: 'KC', pin: '1234' },
  { name: 'Ramanjaneyulu Chennupati', initials: 'RC', pin: '2345' },
  { name: 'Phani Gogineni',           initials: 'PG', pin: '3456' },
  { name: 'Ganapathi Gorantla',       initials: 'GG', pin: '4567' },
  { name: 'Ashok Kamani',             initials: 'AK', pin: '5678' },
]

// ─── CATEGORIES ─────────────────────────────────────────────────────────────
const CAT_LABELS = {
  foundation: 'Foundation',
  structure:  'Structure / Brickwork',
  roofing:    'Roofing',
  electrical: 'Electrical',
  plumbing:   'Plumbing',
  flooring:   'Flooring',
  interior:   'Interior / Paint',
  exterior:   'Exterior / Compound',
  labor:      'Labor charges',
  other:      'Other',
}

const CAT_COLORS = {
  foundation: { bg: '#E6F1FB', color: '#0C447C' },
  structure:  { bg: '#EAF3DE', color: '#27500A' },
  roofing:    { bg: '#FAEEDA', color: '#633806' },
  electrical: { bg: '#FBEAF0', color: '#72243E' },
  plumbing:   { bg: '#E1F5EE', color: '#085041' },
  flooring:   { bg: '#EEEDFE', color: '#3C3489' },
  interior:   { bg: '#FAECE7', color: '#712B13' },
  exterior:   { bg: '#F1EFE8', color: '#444441' },
  labor:      { bg: '#FCEBEB', color: '#791F1F' },
  other:      { bg: '#D3D1C7', color: '#2C2C2A' },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt      = n  => '₹' + Math.round(n).toLocaleString('en-IN')
const fmtDate  = v  => { if (!v) return '-'; const [y,m,d] = v.split('-'); return `${d}/${m}/${y}` }
const todayISO = () => new Date().toISOString().split('T')[0]
const todayDMY = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
const flLabel = f =>
  f === 'all' ? 'All Time' :
  f === '1m'  ? 'Last 1 Month' :
  f === '3m'  ? 'Last 3 Months' : 'Last 6 Months'

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  green:     '#2D5016',
  green2:    '#5A8A2C',
  gold:      '#C9A84C',
  bg:        '#F5F2ED',
  white:     '#FFFFFF',
  text:      '#1A1A1A',
  text2:     '#6B6560',
  text3:     '#9E9890',
  danger:    '#C0392B',
  dangerBg:  '#FDF0EE',
  successBg: '#EEF5E8',
  border:    'rgba(0,0,0,0.08)',
  border2:   'rgba(0,0,0,0.14)',
}

// ... (keeping the rest of the file the same but adding useEffect in Dashboard)

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ currentUser, isEditor, onExit }) {
  const [expenses, setExpenses] = useState([])
  const [idCtr,    setIdCtr]    = useState(0)
  const [editId,   setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({})
  const [filter,   setFilter]   = useState('1m')
  const [showMenu, setShowMenu] = useState(false)
  const [formErr,  setFormErr]  = useState('')
  const [form,     setForm]     = useState({
    desc: '', category: 'foundation', date: todayISO(), amount: ''
  })

  // ── ROBUST LOCALSTORAGE PERSISTENCE (Fixed) ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedExpenses = localStorage.getItem('doddavaram-ramalayam-expenses-v3')
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses))
      }
      const savedIdCtr = localStorage.getItem('doddavaram-ramalayam-idctr-v3')
      if (savedIdCtr) {
        setIdCtr(parseInt(savedIdCtr, 10) || 0)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('doddavaram-ramalayam-expenses-v3', JSON.stringify(expenses))
      localStorage.setItem('doddavaram-ramalayam-idctr-v3', idCtr.toString())
    }
  }, [expenses, idCtr])
  // ─────────────────────────────────────────────

  // (rest of the Dashboard function remains the same as before)

  // ... rest of code ... 

export default function App() {
  const [screen,      setScreen]      = useState('landing')
  const [currentUser, setCurrentUser] = useState(null)
  const [isEditor,    setIsEditor]    = useState(false)

  if (screen === 'landing') return (
    <Landing
      onEditor={() => setScreen('pin')}
      onViewer={() => { setCurrentUser('Guest Viewer'); setIsEditor(false); setScreen('main') }}
    />
  )
  if (screen === 'pin') return (
    <PinScreen
      onSuccess={name => { setCurrentUser(name); setIsEditor(true); setScreen('main') }}
      onCancel={() => setScreen('landing')}
    />
  )
  return (
    <Dashboard
      currentUser={currentUser}
      isEditor={isEditor}
      onExit={() => { setScreen('landing'); setCurrentUser(null); setIsEditor(false) }}
    />
  )
}
