import { useState, useRef, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// MEMBERS
const MEMBERS = [
  { name: 'Koteswara Rao Chennupati', initials: 'KC', pin: '1234' },
  { name: 'Ramanjaneyulu Chennupati', initials: 'RC', pin: '2345' },
  { name: 'Phani Gogineni', initials: 'PG', pin: '3456' },
  { name: 'Ganapathi Gorantla', initials: 'GG', pin: '4567' },
  { name: 'Ashok Kamani', initials: 'AK', pin: '5678' },
]

// CATEGORIES
const CAT_LABELS = {
  foundation: 'Foundation',
  structure: 'Structure / Brickwork',
  roofing: 'Roofing',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  flooring: 'Flooring',
  interior: 'Interior / Paint',
  exterior: 'Exterior / Compound',
  labor: 'Labor charges',
  other: 'Other',
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

// HELPERS
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN')
const fmtDate = v => { if (!v) return '-'; const [y,m,d] = v.split('-'); return `${d}/${m}/${y}` }
const todayISO = () => new Date().toISOString().split('T')[0]
const todayDMY = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

// DESIGN TOKENS
const C = {
  green: '#2D5016',
  green2: '#5A8A2C',
  gold: '#C9A84C',
  bg: '#F5F2ED',
  white: '#FFFFFF',
  text: '#1A1A1A',
  text2: '#6B6560',
  text3: '#9E9890',
  danger: '#C0392B',
  dangerBg: '#FDF0EE',
  successBg: '#EEF5E8',
  border: 'rgba(0,0,0,0.08)',
}

// LANDING & PIN SCREENS (simplified for now)
function Landing({ onEditor, onViewer }) {
  return (
    <div style={{padding: '40px 20px', textAlign: 'center', background: '#F5F2ED', minHeight: '100vh'}}>
      <h1 style={{color: C.green, fontSize: '2.2rem'}}>🛕 Doddavaram Ramalayam Temple</h1>
      <p>Construction Budget Tracker</p>
      <button onClick={onEditor} style={{padding: '15px 40px', fontSize: '1.1rem', margin: '10px'}}>Enter as Editor (PIN required)</button>
      <button onClick={onViewer} style={{padding: '15px 40px', fontSize: '1.1rem', margin: '10px', background: '#666'}}>View Only Mode</button>
    </div>
  )
}

function PinScreen({ onSuccess, onCancel }) {
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')

  const handleSubmit = () => {
    const member = MEMBERS.find(m => m.initials === selected && m.pin === pin)
    if (member) onSuccess(member.name)
    else alert('Invalid PIN')
  }

  return (
    <div style={{padding: '40px', textAlign: 'center'}}>
      <h2>Enter PIN</h2>
      <div>
        {MEMBERS.map(m => (
          <button key={m.initials} onClick={() => setSelected(m.initials)} style={{margin: '5px'}}>
            {m.initials}
          </button>
        ))}
      </div>
      {selected && (
        <>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="4-digit PIN" maxLength={4} />
          <button onClick={handleSubmit}>Login</button>
          <button onClick={onCancel}>Cancel</button>
        </>
      )}
    </div>
  )
}

// MAIN DASHBOARD
function Dashboard({ currentUser, isEditor, onExit }) {
  const [expenses, setExpenses] = useState([])
  const [idCtr, setIdCtr] = useState(0)
  const [filter, setFilter] = useState('all')

  // LOCALSTORAGE PERSISTENCE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('doddavaram-ramalayam-expenses-v3')
      if (saved) setExpenses(JSON.parse(saved))
      const savedId = localStorage.getItem('doddavaram-ramalayam-idctr-v3')
      if (savedId) setIdCtr(parseInt(savedId, 10) || 0)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('doddavaram-ramalayam-expenses-v3', JSON.stringify(expenses))
      localStorage.setItem('doddavaram-ramalayam-idctr-v3', idCtr.toString())
    }
  }, [expenses, idCtr])

  const addExpense = (newExpense) => {
    const expense = { ...newExpense, id: Date.now(), addedBy: currentUser, date: new Date().toISOString() }
    setExpenses(prev => [...prev, expense])
    setIdCtr(prev => prev + 1)
  }

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h1>🛕 Ramalayam Temple Budget Tracker</h1>
        <div>
          <span>{currentUser}</span>
          <button onClick={onExit} style={{marginLeft: '10px'}}>Exit</button>
        </div>
      </header>

      <div>
        <h3>Add Expense</h3>
        <input placeholder="Description" onChange={e => {/* handle form */}} />
        <button onClick={() => addExpense({desc: 'Test', category: 'foundation', amount: 1000, date: todayISO()})}>Add Test Expense</button>
      </div>

      <div>
        <h3>Expenses ({expenses.length})</h3>
        {expenses.map(exp => (
          <div key={exp.id} style={{padding: '10px', border: '1px solid #ddd', margin: '5px 0'}}>
            {exp.desc} - ₹{exp.amount} <button onClick={() => deleteExpense(exp.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [currentUser, setCurrentUser] = useState(null)
  const [isEditor, setIsEditor] = useState(false)

  if (screen === 'landing') return <Landing onEditor={() => setScreen('pin')} onViewer={() => { setCurrentUser('Guest'); setIsEditor(false); setScreen('main') }} />

  if (screen === 'pin') return <PinScreen onSuccess={(name) => { setCurrentUser(name); setIsEditor(true); setScreen('main') }} onCancel={() => setScreen('landing')} />

  return <Dashboard currentUser={currentUser} isEditor={isEditor} onExit={() => { setScreen('landing'); setCurrentUser(null); setIsEditor(false) }} />
}
