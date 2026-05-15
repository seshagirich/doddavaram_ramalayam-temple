import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://clubpmammzlyikfafcqz.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_FmdHE4Su4ghQB-h3G58pqg_zLpGuQ2l'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── MEMBERS ────────────────────────────────────────────────────────────────
const MEMBERS = [
  { name: 'Koteswara Rao Chennupati', initials: 'KC', pin: '1234' },
  { name: 'Ramanjaneyulu Chennupati', initials: 'RC', pin: '2345' },
  { name: 'Phani Gogineni',           initials: 'PG', pin: '3456' },
  { name: 'Ganapathi Gorantla',       initials: 'GG', pin: '4567' },
  { name: 'Srinu Gorantla',           initials: 'AK', pin: '5678' },
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
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN')
const fmtDate = v => { if (!v) return '-'; const [y,m,d] = v.split('-'); return `${d}/${m}/${y}` }
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

// ─── LANDING SCREEN ──────────────────────────────────────────────────────────
function Landing({ onEditor, onViewer }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${C.bg} 0%, #EDE8E0 100%)`,
      padding: '2rem', gap: '2rem'
    }}>
      <div style={{
        width: 100, height: 100, background: C.green,
        borderRadius: 30, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 40px rgba(45, 80, 22, 0.3)'
      }}>
        <div style={{ fontSize: 50 }}>🛕</div>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 36, color: C.text, fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
          Sri Ramalayam Temple
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.green, marginBottom: 8 }}>
          Doddavaram Construction Budget Tracker
        </div>
        <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.5 }}>
          Transparent expense &amp; donation management for the sacred temple<br />
          <span style={{ color: C.green2, fontWeight: 600 }}>✓ Live cloud sync for everyone</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 380 }}>
        <button onClick={onEditor} style={{
          height: 58, background: C.green, color: C.white,
          border: 'none', borderRadius: 16, fontSize: 16,
          fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(45, 80, 22, 0.35)',
          transition: 'all 0.2s'
        }}>
          🔐 &nbsp; Enter as Editor (PIN required)
        </button>
        <button onClick={onViewer} style={{
          height: 58, background: C.white, color: C.text,
          border: `2px solid ${C.border2}`, borderRadius: 16,
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
          👁 &nbsp; View Only (No PIN needed)
        </button>
      </div>

      <div style={{ fontSize: 12, color: C.text3, textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
        All expenses &amp; donations are saved to the cloud and visible to everyone instantly.
      </div>
    </div>
  )
}

// ─── PIN SCREEN ───────────────────────────────────────────────────────────────
function PinScreen({ onSuccess, onCancel }) {
  const [selected, setSelected] = useState(null)
  const [digits, setDigits] = useState([])
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const pickMember = i => {
    setSelected(i)
    setDigits([])
    setError('')
  }

  const verify = digs => {
    if (selected === null) {
      setError('Please select your name first.')
      return
    }
    if (digs.join('') === MEMBERS[selected].pin) {
      onSuccess(MEMBERS[selected].name)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setError('Incorrect PIN. Please try again.')
      setDigits([])
    }
  }

  const pressKey = k => {
    if (digits.length >= 4) return
    const next = [...digits, k]
    setDigits(next)
    if (next.length === 4) setTimeout(() => verify(next), 200)
  }

  const pressBack = () => {
    setDigits(digits.slice(0, -1))
    setError('')
  }

  const pinLen = digits.length
  const statusMsg = () => {
    if (error) return null
    if (selected === null) return 'Select your name above to begin'
    if (pinLen === 0) return 'Now enter your 4-digit PIN below'
    if (pinLen < 4) return `${4 - pinLen} more digit${4 - pinLen > 1 ? 's' : ''} needed`
    return 'Verifying…'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${C.bg} 0%, #EDE8E0 100%)`,
      padding: '1.5rem'
    }}>
      <div style={{
        background: C.white, borderRadius: 28, padding: '2.5rem 2rem',
        width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>
            Editor Access
          </div>
          <div style={{ fontSize: 13, color: C.text2 }}>
            Select your name, then enter your secret PIN
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.green,
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10
          }}>
            Step 1 — Select your name
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {MEMBERS.map((m, i) => (
              <div key={i} onClick={() => pickMember(i)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                border: `2px solid ${selected === i ? C.green : C.border2}`,
                background: selected === i ? C.successBg : C.bg,
                transition: 'all 0.15s'
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: C.white,
                  background: selected === i ? C.green : C.text3
                }}>
                  {m.initials}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {m.name.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.green,
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12
          }}>
            Step 2 — Enter your 4-digit PIN
          </div>

          <div style={{
            display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 18,
            animation: shake ? 'shake 0.4s ease' : 'none'
          }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `3px solid ${i < pinLen ? C.green : 'rgba(0,0,0,0.18)'}`,
                background: i < pinLen ? C.green : C.white,
                transition: 'all 0.15s'
              }} />
            ))}
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12, maxWidth: 280, margin: '0 auto 16px'
          }}>
            {['1','2','3','4','5','6','7','8','9'].map(k => (
              <button key={k} onClick={() => pressKey(k)} style={{
                height: 56, background: C.bg,
                border: `1.5px solid ${C.border}`, borderRadius: 14,
                fontSize: 22, fontWeight: 600, cursor: 'pointer', color: C.text,
                transition: 'all 0.1s'
              }}>
                {k}
              </button>
            ))}
            <div />
            <button onClick={() => pressKey('0')} style={{
              height: 56, background: C.bg,
              border: `1.5px solid ${C.border}`, borderRadius: 14,
              fontSize: 22, fontWeight: 600, cursor: 'pointer', color: C.text
            }}>
              0
            </button>
            <button onClick={pressBack} style={{
              height: 56, background: C.dangerBg,
              border: '1.5px solid #e8aea9', borderRadius: 14,
              fontSize: 18, cursor: 'pointer', color: C.danger
            }}>
              ⌫
            </button>
          </div>
        </div>

        <div style={{ minHeight: 26, textAlign: 'center', marginBottom: 20 }}>
          {error
            ? <span style={{ color: C.danger, fontSize: 13, fontWeight: 600 }}>{error}</span>
            : <span style={{ color: C.text3, fontSize: 12 }}>{statusMsg()}</span>
          }
        </div>

        <button onClick={onCancel} style={{
          width: '100%', height: 46, background: 'transparent',
          border: `1px solid ${C.border2}`, borderRadius: 12,
          color: C.text2, fontSize: 14, cursor: 'pointer', fontWeight: 600
        }}>
          ← Back to home
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          20% { transform: translateX(-6px) }
          40% { transform: translateX(6px) }
          60% { transform: translateX(-4px) }
          80% { transform: translateX(4px) }
        }
      `}</style>
    </div>
  )
}

// ─── DASHBOARD (EXPENSES + DONATIONS) ─────────────────────────────────────────
function Dashboard({ currentUser, isEditor, onExit }) {
  const [expenses, setExpenses] = useState([])
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [filter, setFilter] = useState('1m')
  const [showMenu, setShowMenu] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [donationFormErr, setDonationFormErr] = useState('')
  const [activeTab, setActiveTab] = useState('expenses')

  const [form, setForm] = useState({
    description: '', category: 'foundation', date: todayISO(), amount: ''
  })
  const [donationForm, setDonationForm] = useState({
    donor_name: '', amount: '', date: todayISO(), notes: ''
  })
  const [syncStatus, setSyncStatus] = useState('🟢 Live')

  // ── SUPABASE: Fetch + Realtime for BOTH tables ──
  useEffect(() => {
    let expenseChannel, donationChannel

    const loadAllData = async () => {
      setLoading(true)
      const [expRes, donRes] = await Promise.all([
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('donations').select('*').order('date', { ascending: false })
      ])

      if (expRes.error) console.error('Expenses error:', expRes.error)
      if (donRes.error) console.error('Donations error:', donRes.error)

      setExpenses(expRes.data || [])
      setDonations(donRes.data || [])
      setSyncStatus('🟢 Live')
      setLoading(false)
    }

    loadAllData()

    // Realtime for expenses
    expenseChannel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        if (payload.eventType === 'INSERT') setExpenses(prev => [payload.new, ...prev])
        else if (payload.eventType === 'UPDATE') setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new : e))
        else if (payload.eventType === 'DELETE') setExpenses(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .subscribe()

    // Realtime for donations
    donationChannel = supabase
      .channel('donations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload) => {
        if (payload.eventType === 'INSERT') setDonations(prev => [payload.new, ...prev])
        else if (payload.eventType === 'UPDATE') setDonations(prev => prev.map(d => d.id === payload.new.id ? payload.new : d))
        else if (payload.eventType === 'DELETE') setDonations(prev => prev.filter(d => d.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      if (expenseChannel) supabase.removeChannel(expenseChannel)
      if (donationChannel) supabase.removeChannel(donationChannel)
    }
  }, [])

  // ── Filtered data ──
  const getFilteredExpenses = () => {
    if (filter === 'all') return expenses
    const now = new Date()
    const months = filter === '1m' ? 1 : filter === '3m' ? 3 : 6
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    return expenses.filter(e => new Date(e.date) >= cutoff)
  }
  const filteredExpenses = getFilteredExpenses()
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0)

  const filteredDonations = donations
  const totalDonations = filteredDonations.reduce((s, d) => s + Number(d.amount), 0)
  const netBalance = totalDonations - totalExpenses

  const catTotals = {}
  filteredExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount) })

  // ── CRUD: Expenses ──
  const addExpense = async () => {
    if (!form.description.trim()) { setFormErr('Please enter a description.'); return }
    if (!form.date) { setFormErr('Please select a date.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setFormErr('Please enter a valid amount.'); return }

    setFormErr('')
    const newExpense = {
      description: form.description.trim(),
      category: form.category,
      date: form.date,
      amount: Number(form.amount),
      added_by: currentUser
    }

    const { error } = await supabase.from('expenses').insert([newExpense])
    if (error) { alert('Failed to save expense: ' + error.message); return }
    setForm(f => ({ ...f, description: '', amount: '' }))
  }

  const startEdit = e => {
    setEditId(e.id)
    setEditForm({ description: e.description, category: e.category, date: e.date, amount: e.amount })
  }

  const cancelEdit = () => { setEditId(null); setEditForm({}) }

  const saveEdit = async (id) => {
    if (!editForm.description.trim()) { alert('Description cannot be empty'); return }
    if (!editForm.date) { alert('Please select a date'); return }
    if (!editForm.amount || Number(editForm.amount) <= 0) { alert('Please enter a valid amount'); return }

    const { error } = await supabase.from('expenses').update({
      description: editForm.description.trim(),
      category: editForm.category,
      date: editForm.date,
      amount: Number(editForm.amount)
    }).eq('id', id)

    if (error) { alert('Failed to update: ' + error.message); return }
    setEditId(null)
  }

  const deleteExp = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) alert('Failed to delete: ' + error.message)
  }

  // ── CRUD: Donations ──
  const addDonation = async () => {
    if (!donationForm.donor_name.trim()) { setDonationFormErr('Please enter donor name.'); return }
    if (!donationForm.amount || Number(donationForm.amount) <= 0) { setDonationFormErr('Please enter a valid amount.'); return }
    if (!donationForm.date) { setDonationFormErr('Please select a date.'); return }

    setDonationFormErr('')
    const newDonation = {
      donor_name: donationForm.donor_name.trim(),
      amount: Number(donationForm.amount),
      date: donationForm.date,
      notes: donationForm.notes.trim(),
      added_by: currentUser
    }

    const { error } = await supabase.from('donations').insert([newDonation])
    if (error) { alert('Failed to save donation: ' + error.message); return }
    setDonationForm({ donor_name: '', amount: '', date: todayISO(), notes: '' })
  }

  const deleteDonation = async (id) => {
    if (!window.confirm('Delete this donation record?')) return
    const { error } = await supabase.from('donations').delete().eq('id', id)
    if (error) alert('Failed to delete donation: ' + error.message)
  }

  // ── PDF ──
  const downloadPDF = () => {
    setShowMenu(false)
    if (!filteredExpenses.length) { alert('No expenses for this period.'); return }

    const fl = flLabel(filter)
    const ds = todayDMY()
    const total = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    doc.setFillColor(45, 80, 22)
    doc.rect(0, 0, 210, 42, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Sri Ramalayam Temple', 14, 16)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Construction Budget Tracker — Expense Report', 14, 23)
    doc.setFontSize(9)
    doc.text(`Period: ${fl}   |   Generated: ${ds}   |   By: ${currentUser}`, 14, 30)
    doc.text(`Total Entries: ${filteredExpenses.length}   |   Grand Total: ₹${Math.round(total).toLocaleString('en-IN')}`, 14, 36)

    autoTable(doc, {
      startY: 50,
      head: [['#', 'Description', 'Category', 'Date', 'Amount', 'Added by']],
      body: filteredExpenses.map((e, i) => [
        i + 1, e.description, CAT_LABELS[e.category], fmtDate(e.date),
        '₹' + Math.round(e.amount).toLocaleString('en-IN'), e.added_by || '-'
      ]),
      foot: [['', '', '', 'Grand Total', '₹' + Math.round(total).toLocaleString('en-IN'), '']],
      headStyles: { fillColor: [45, 80, 22], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 4 },
      footStyles: { fillColor: [238, 245, 232], textColor: [45, 80, 22], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30], cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 246, 242] },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 4: { halign: 'right', cellWidth: 32 } },
      margin: { left: 14, right: 14 },
    })

    doc.save(`Ramalayam_Expenses_${fl.replace(/ /g, '_')}_${ds.replace(/\//g, '-')}.pdf`)
  }

  const DOWNLOADS = [
    { icon: '📄', label: 'PDF Report (Expenses)', sub: 'Best for sharing', fn: downloadPDF },
    { icon: '📊', label: 'Excel (.xlsx)', sub: 'Full report', fn: () => alert('Excel export coming soon!') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg }} onClick={() => showMenu && setShowMenu(false)}>
      {/* Header */}
      <div style={{
        background: C.green, padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(45, 80, 22, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 28 }}>🛕</div>
          <div>
            <div style={{ fontSize: 20, color: C.white, fontWeight: 700, lineHeight: 1.1 }}>
              Ramalayam Temple
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
              Doddavaram Construction Budget Tracker <span style={{ color: '#C9A84C' }}>• LIVE CLOUD</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {currentUser}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {isEditor ? 'Editor' : 'Viewer'} • {syncStatus}
            </div>
          </div>
          <button onClick={onExit} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: C.white, padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600
          }}>
            Exit
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ background: C.green, borderRadius: 20, padding: '20px 28px', flex: 1, minWidth: 220, boxShadow: '0 10px 30px rgba(45, 80, 22, 0.25)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>TOTAL EXPENSES</div>
            <div style={{ fontSize: 36, color: C.white, fontWeight: 800, marginTop: 4 }}>{fmt(totalExpenses)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{filteredExpenses.length} entries</div>
          </div>

          <div style={{ background: '#2E7D32', borderRadius: 20, padding: '20px 28px', flex: 1, minWidth: 220, boxShadow: '0 10px 30px rgba(46, 125, 50, 0.25)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>TOTAL DONATIONS</div>
            <div style={{ fontSize: 36, color: C.white, fontWeight: 800, marginTop: 4 }}>{fmt(totalDonations)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{donations.length} donations received</div>
          </div>

          <div style={{ background: netBalance >= 0 ? '#1B5E20' : C.danger, borderRadius: 20, padding: '20px 28px', flex: 1, minWidth: 220, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>NET BALANCE</div>
            <div style={{ fontSize: 36, color: C.white, fontWeight: 800, marginTop: 4 }}>{fmt(netBalance)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{netBalance >= 0 ? 'Surplus' : 'Deficit'}</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setActiveTab('expenses')} style={{
            padding: '10px 24px', borderRadius: 999, fontSize: 14, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            background: activeTab === 'expenses' ? C.green : C.white,
            color: activeTab === 'expenses' ? C.white : C.text,
            boxShadow: activeTab === 'expenses' ? '0 2px 8px rgba(45, 80, 22, 0.25)' : '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            💸 Expenses
          </button>
          <button onClick={() => setActiveTab('donations')} style={{
            padding: '10px 24px', borderRadius: 999, fontSize: 14, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            background: activeTab === 'donations' ? '#2E7D32' : C.white,
            color: activeTab === 'donations' ? C.white : C.text,
            boxShadow: activeTab === 'donations' ? '0 2px 8px rgba(46, 125, 50, 0.25)' : '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            🙏 Donations Received
          </button>
        </div>

        {/* EXPENSES SECTION */}
        {activeTab === 'expenses' && (
          <>
            {isEditor && (
              <div style={{ background: C.white, borderRadius: 18, padding: '24px 26px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 14 }}>ADD EXPENSE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 5 }}>DESCRIPTION</div>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Cement bags, Labor charges..." style={{ width: '100%', height: 44, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '0 14px', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 5 }}>CATEGORY</div>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', height: 44, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '0 12px', fontSize: 14, outline: 'none', background: C.white }}>
                      {Object.entries(CAT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 5 }}>DATE</div>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', height: 44, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '0 12px', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 5 }}>AMOUNT (₹)</div>
                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" style={{ width: '100%', height: 44, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '0 14px', fontSize: 14, outline: 'none' }} />
                  </div>
                  <button onClick={addExpense} style={{ height: 44, background: C.green, color: C.white, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, padding: '0 28px', cursor: 'pointer' }}>+ Add Expense</button>
                </div>
                {formErr && <div style={{ color: C.danger, fontSize: 12, marginTop: 10, fontWeight: 500 }}>{formErr}</div>}
              </div>
            )}

            {/* Expenses Table */}
            <div style={{ background: C.white, borderRadius: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>ALL EXPENSES (LIVE)</div>
                <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>Showing {filteredExpenses.length} entries — Total: {fmt(totalExpenses)}</div>
              </div>

              {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: C.text2 }}>Loading live data...</div>
              ) : filteredExpenses.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: C.text2 }}>No expenses yet. Add the first one above.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8F6F2' }}>
                        <th style={{ padding: '12px 18px', textAlign: 'left', color: C.text2, fontWeight: 600, fontSize: 11 }}>DESCRIPTION</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', color: C.text2, fontWeight: 600, fontSize: 11 }}>CATEGORY</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', color: C.text2, fontWeight: 600, fontSize: 11 }}>DATE</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', color: C.text2, fontWeight: 600, fontSize: 11 }}>AMOUNT</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', color: C.text2, fontWeight: 600, fontSize: 11 }}>ADDED BY</th>
                        {isEditor && <th style={{ padding: '12px 18px', textAlign: 'center', color: C.text2, fontWeight: 600, fontSize: 11, width: 90 }}>ACTIONS</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((e, idx) => (
                        <tr key={e.id} style={{ borderTop: idx > 0 ? `1px solid ${C.border}` : 'none' }}>
                          <td style={{ padding: '13px 18px', fontWeight: 500, color: C.text }}>
                            {editId === e.id ? (
                              <input value={editForm.description} onChange={ev => setEditForm({ ...editForm, description: ev.target.value })} style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: `1px solid ${C.green2}`, borderRadius: 6 }} />
                            ) : e.description}
                          </td>
                          <td style={{ padding: '13px 18px' }}>
                            {editId === e.id ? (
                              <select value={editForm.category} onChange={ev => setEditForm({ ...editForm, category: ev.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: `1px solid ${C.green2}`, borderRadius: 6 }}>
                                {Object.entries(CAT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                              </select>
                            ) : (
                              <span style={{ background: CAT_COLORS[e.category]?.bg, color: CAT_COLORS[e.category]?.color, padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                                {CAT_LABELS[e.category]}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '13px 18px', color: C.text2, fontSize: 12 }}>{editId === e.id ? <input type="date" value={editForm.date} onChange={ev => setEditForm({ ...editForm, date: ev.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: `1px solid ${C.green2}`, borderRadius: 6 }} /> : fmtDate(e.date)}</td>
                          <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 700, color: C.text, fontSize: 14 }}>{editId === e.id ? <input type="number" value={editForm.amount} onChange={ev => setEditForm({ ...editForm, amount: ev.target.value })} style={{ width: 90, padding: '4px 8px', fontSize: 13, border: `1px solid ${C.green2}`, borderRadius: 6, textAlign: 'right' }} /> : fmt(e.amount)}</td>
                          <td style={{ padding: '13px 18px', color: C.text2, fontSize: 12 }}>{e.added_by || '-'}</td>
                          {isEditor && (
                            <td style={{ padding: '13px 18px', textAlign: 'center' }}>
                              {editId === e.id ? (
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                  <button onClick={() => saveEdit(e.id)} style={{ padding: '4px 10px', fontSize: 11, background: C.green, color: C.white, border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
                                  <button onClick={cancelEdit} style={{ padding: '4px 10px', fontSize: 11, background: C.white, color: C.text2, border: `1px solid ${C.border2}`, borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                  <button onClick={() => startEdit(e)} style={{ padding: '4px 8px', fontSize: 11, background: C.white, color: C.green, border: `1px solid ${C.green2}`, borderRadius: 6, cursor: 'pointer' }}>Edit</button>
                                  <button onClick={() => deleteExp(e.id)} style={{ padding: '4px 8px', fontSize: 11, background: C.white, color: C.danger, border: '1px solid #e8aea9', borderRadius: 6, cursor: 'pointer' }}>Del</button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* DONATIONS SECTION */}
        {activeTab === 'donations' && (
          <>
            {isEditor && (
              <div style={{ background: '#E8F5E9', borderRadius: 18, padding: '24px 26px', marginBottom: 24, boxShadow: '0 4px 20px rgba(46, 125, 50, 0.1)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2E7D32', marginBottom: 14 }}>ADD DONATION RECEIVED</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', gap: 12, alignItems: 'end' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#2E7D32', fontWeight: 600, marginBottom: 5 }}>DONOR NAME</div>
                    <input value={donationForm.donor_name} onChange={e => setDonationForm({ ...donationForm, donor_name: e.target.value })} placeholder="e.g. Smt. Lakshmi Devi" style={{ width: '100%', height: 44, border: `1px solid #81C784`, borderRadius: 10, padding: '0 14px', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#2E7D32', fontWeight: 600, marginBottom: 5 }}>AMOUNT (₹)</div>
                    <input type="number" value={donationForm.amount} onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })} placeholder="0" style={{ width: '100%', height: 44, border: `1px solid #81C784`, borderRadius: 10, padding: '0 14px', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#2E7D32', fontWeight: 600, marginBottom: 5 }}>DATE</div>
                    <input type="date" value={donationForm.date} onChange={e => setDonationForm({ ...donationForm, date: e.target.value })} style={{ width: '100%', height: 44, border: `1px solid #81C784`, borderRadius: 10, padding: '0 12px', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#2E7D32', fontWeight: 600, marginBottom: 5 }}>NOTES (optional)</div>
                    <input value={donationForm.notes} onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })} placeholder="For temple construction" style={{ width: '100%', height: 44, border: `1px solid #81C784`, borderRadius: 10, padding: '0 14px', fontSize: 14, outline: 'none' }} />
                  </div>
                  <button onClick={addDonation} style={{ height: 44, background: '#2E7D32', color: C.white, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, padding: '0 28px', cursor: 'pointer' }}>+ Add Donation</button>
                </div>
                {donationFormErr && <div style={{ color: C.danger, fontSize: 12, marginTop: 10, fontWeight: 500 }}>{donationFormErr}</div>}
              </div>
            )}

            {/* Donations Table */}
            <div style={{ background: C.white, borderRadius: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2E7D32' }}>DONATIONS RECEIVED (LIVE FROM DEVOTEES)</div>
                <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>Total: {fmt(totalDonations)} from {donations.length} generous donors</div>
              </div>

              {donations.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: C.text2 }}>
                  <div style={{ fontSize: 42, marginBottom: 12, opacity: 0.3 }}>🙏</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No donations yet</div>
                  <div style={{ fontSize: 13 }}>Record the first donation above — it will appear live for everyone.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#E8F5E9' }}>
                        <th style={{ padding: '12px 18px', textAlign: 'left', color: '#2E7D32', fontWeight: 600, fontSize: 11 }}>DONOR NAME</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', color: '#2E7D32', fontWeight: 600, fontSize: 11 }}>DATE</th>
                        <th style={{ padding: '12px 18px', textAlign: 'right', color: '#2E7D32', fontWeight: 600, fontSize: 11 }}>AMOUNT</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', color: '#2E7D32', fontWeight: 600, fontSize: 11 }}>NOTES</th>
                        <th style={{ padding: '12px 18px', textAlign: 'left', color: '#2E7D32', fontWeight: 600, fontSize: 11 }}>RECORDED BY</th>
                        {isEditor && <th style={{ padding: '12px 18px', textAlign: 'center', color: '#2E7D32', fontWeight: 600, fontSize: 11, width: 70 }}>ACTIONS</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map((d, idx) => (
                        <tr key={d.id} style={{ borderTop: idx > 0 ? `1px solid ${C.border}` : 'none' }}>
                          <td style={{ padding: '13px 18px', fontWeight: 600, color: C.text }}>{d.donor_name}</td>
                          <td style={{ padding: '13px 18px', color: C.text2, fontSize: 12 }}>{fmtDate(d.date)}</td>
                          <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 700, color: '#2E7D32', fontSize: 14 }}>{fmt(d.amount)}</td>
                          <td style={{ padding: '13px 18px', color: C.text2, fontSize: 12 }}>{d.notes || '-'}</td>
                          <td style={{ padding: '13px 18px', color: C.text2, fontSize: 12 }}>{d.added_by || '-'}</td>
                          {isEditor && (
                            <td style={{ padding: '13px 18px', textAlign: 'center' }}>
                              <button onClick={() => deleteDonation(d.id)} style={{ padding: '4px 10px', fontSize: 11, background: C.white, color: C.danger, border: '1px solid #e8aea9', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Category Breakdown (Expenses only) */}
        {activeTab === 'expenses' && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 12, paddingLeft: 6 }}>SPENDING BY CATEGORY</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {Object.keys(catTotals).length === 0 ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: C.text2, background: C.white, borderRadius: 14, border: `1px solid ${C.border}` }}>No data yet</div>
              ) : (
                Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                  <div key={cat} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: C.text2, marginBottom: 4, fontWeight: 600 }}>{CAT_LABELS[cat]}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{fmt(total)}</div>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{Math.round((total / totalExpenses) * 100)}% of total</div>
                    <div style={{ height: 4, background: C.successBg, borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((total / totalExpenses) * 100)}%`, background: C.green2, borderRadius: 999 }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('landing')
  const [currentUser, setCurrentUser] = useState(null)
  const [isEditor, setIsEditor] = useState(false)

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