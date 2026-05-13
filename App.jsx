import { useState, useEffect } from 'react'
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
          Transparent expense management for the sacred temple construction project
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
        Editors can add, edit & delete expenses.<br />
        Viewers can see all expenses & download reports.
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

        {/* Step 1 */}
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

        {/* Step 2 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.green,
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12
          }}>
            Step 2 — Enter your 4-digit PIN
          </div>

          {/* PIN dots */}
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

          {/* Keypad */}
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

        {/* Status */}
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ currentUser, isEditor, onExit }) {
  const [expenses, setExpenses] = useState([])
  const [idCtr, setIdCtr] = useState(0)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [filter, setFilter] = useState('1m')
  const [showMenu, setShowMenu] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [form, setForm] = useState({
    desc: '', category: 'foundation', date: todayISO(), amount: ''
  })

  // ── ROBUST LOCALSTORAGE PERSISTENCE ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedExpenses = localStorage.getItem('doddavaram-ramalayam-expenses-v3')
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses))

      const savedIdCtr = localStorage.getItem('doddavaram-ramalayam-idctr-v3')
      if (savedIdCtr) setIdCtr(parseInt(savedIdCtr, 10) || 0)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('doddavaram-ramalayam-expenses-v3', JSON.stringify(expenses))
      localStorage.setItem('doddavaram-ramalayam-idctr-v3', idCtr.toString())
    }
  }, [expenses, idCtr])

  // ── filtered data ──
  const getFiltered = () => {
    if (filter === 'all') return expenses
    const now = new Date()
    const months = filter === '1m' ? 1 : filter === '3m' ? 3 : 6
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    return expenses.filter(e => new Date(e.date) >= cutoff)
  }
  const filtered = getFiltered()
  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0)
  const catTotals = {}
  filtered.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })

  // ── CRUD ──
  const addExpense = () => {
    if (!form.desc.trim()) { setFormErr('Please enter a description.'); return }
    if (!form.date) { setFormErr('Please select a date.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setFormErr('Please enter a valid amount.'); return }

    const newExpense = {
      id: idCtr + 1,
      desc: form.desc.trim(),
      category: form.category,
      date: form.date,
      amount: Number(form.amount),
      addedBy: currentUser
    }
    setExpenses(p => [...p, newExpense])
    setIdCtr(idCtr + 1)
    setForm(f => ({ ...f, desc: '', amount: '' }))
    setFormErr('')
  }

  const startEdit = e => {
    setEditId(e.id)
    setEditForm({ desc: e.desc, category: e.category, date: e.date, amount: e.amount })
  }
  const cancelEdit = () => { setEditId(null); setEditForm({}) }
  const saveEdit = id => {
    if (!editForm.desc.trim()) { alert('Description cannot be empty'); return }
    if (!editForm.date) { alert('Please select a date'); return }
    if (!editForm.amount || Number(editForm.amount) <= 0) { alert('Please enter a valid amount'); return }

    setExpenses(p => p.map(e => e.id === id ? { ...e, ...editForm, amount: Number(editForm.amount) } : e))
    setEditId(null)
  }
  const deleteExp = id => {
    if (window.confirm('Delete this expense?')) {
      setExpenses(p => p.filter(e => e.id !== id))
    }
  }

  // ── PDF ──
  const downloadPDF = () => {
    setShowMenu(false)
    if (!filtered.length) { alert('No expenses for this period.'); return }

    const fl = flLabel(filter)
    const ds = todayDMY()
    const total = filtered.reduce((s, e) => s + e.amount, 0)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Header
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
    doc.text(`Total Entries: ${filtered.length}   |   Grand Total: ₹${Math.round(total).toLocaleString('en-IN')}`, 14, 36)

    // Table
    autoTable(doc, {
      startY: 50,
      head: [['#', 'Description', 'Category', 'Date', 'Amount', 'Added by']],
      body: filtered.map((e, i) => [
        i + 1,
        e.desc,
        CAT_LABELS[e.category],
        fmtDate(e.date),
        '₹' + Math.round(e.amount).toLocaleString('en-IN'),
        e.addedBy || '-'
      ]),
      foot: [['', '', '', 'Grand Total', '₹' + Math.round(total).toLocaleString('en-IN'), '']],
      headStyles: { fillColor: [45, 80, 22], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 4 },
      footStyles: { fillColor: [238, 245, 232], textColor: [45, 80, 22], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30], cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 246, 242] },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 4: { halign: 'right', cellWidth: 32 } },
      margin: { left: 14, right: 14 },
      didDrawPage: data => {
        doc.setFontSize(8)
        doc.setTextColor(160, 160, 160)
        doc.text('Sri Ramalayam Temple Construction Budget Tracker', 14, 290)
        doc.text(`Page ${data.pageNumber}`, 196, 290, { align: 'right' })
      }
    })

    doc.save(`Ramalayam_${fl.replace(/ /g, '_')}_${ds.replace(///g, '-')}.pdf`)
  }

  // ── Excel ──
  const downloadExcel = () => {
    setShowMenu(false)
    if (!filtered.length) { alert('No expenses for this period.'); return }

    const fl = flLabel(filter)
    const ds = todayDMY()
    const total = filtered.reduce((s, e) => s + e.amount, 0)

    const ws = XLSX.utils.aoa_to_sheet([
      ['Sri Ramalayam Temple — Construction Budget Tracker'],
      [`Period: ${fl} | Generated: ${ds} | By: ${currentUser}`],
      [],
      ['#', 'Description', 'Category', 'Date', 'Amount (Rs.)', 'Added By'],
      ...filtered.map((e, i) => [i + 1, e.desc, CAT_LABELS[e.category], fmtDate(e.date), Math.round(e.amount), e.addedBy || '-']),
      [],
      ['', '', '', 'Grand Total', Math.round(total), '']
    ])

    ws['!cols'] = [{ wch: 4 }, { wch: 36 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 28 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
    XLSX.writeFile(wb, `Ramalayam_${fl.replace(/ /g, '_')}_${ds.replace(///g, '-')}.xlsx`)
  }

  // ── CSV ──
  const downloadCSV = () => {
    setShowMenu(false)
    if (!filtered.length) { alert('No expenses for this period.'); return }

    const fl = flLabel(filter)
    const ds = todayDMY()
    const total = filtered.reduce((s, e) => s + e.amount, 0)

    const csv = [
      [`"Sri Ramalayam Temple — Construction Budget Tracker"`],
      [`"Period: ${fl} | Generated: ${ds} | By: ${currentUser}"`],
      [],
      ['#', 'Description', 'Category', 'Date', 'Amount (Rs.)', 'Added By'],
      ...filtered.map((e, i) => [
        i + 1,
        `"${e.desc}"`,
        `"${CAT_LABELS[e.category]}"`,
        fmtDate(e.date),
        Math.round(e.amount),
        `"${e.addedBy || '-'}"`
      ]),
      [],
      ['', '', '', 'Grand Total', Math.round(total), '']
    ].map(r => r.join(',')).join('\n')

    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `Ramalayam_${fl.replace(/ /g, '_')}_${ds.replace(///g, '-')}.csv`
    a.click()
  }

  const DOWNLOADS = [
    { icon: '📄', label: 'PDF Report', sub: 'Best for sharing', fn: downloadPDF },
    { icon: '📊', label: 'Excel (.xlsx)', sub: 'Open in Excel / Sheets', fn: downloadExcel },
    { icon: '📋', label: 'CSV File', sub: 'Open in any app', fn: downloadCSV },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg }} onClick={() => showMenu && setShowMenu(false)}>
      {/* ── Header ── */}
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
              Doddavaram Construction Budget Tracker
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {currentUser}
            </div>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase', letterSpacing: 0.5
            }}>
              {isEditor ? 'Editor' : 'Viewer'}
            </div>
          </div>

          <button onClick={onExit} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: C.white, padding: '8px 18px',
            borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600
          }}>
            Exit
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* ── Total Spent Card ── */}
        <div style={{
          background: C.green, borderRadius: 20,
          padding: '22px 28px', display: 'inline-flex',
          alignItems: 'center', gap: 20, marginBottom: 24,
          boxShadow: '0 10px 30px rgba(45, 80, 22, 0.25)'
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: 0.5 }}>
              TOTAL SPENT
            </div>
            <div style={{ fontSize: 42, color: C.white, fontWeight: 800, lineHeight: 1, marginTop: 4 }}>
              {fmt(totalSpent)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
              {flLabel(filter)} • {filtered.length} entries
            </div>
          </div>
          <div style={{ fontSize: 48, opacity: 0.2 }}>₹</div>
        </div>

        {/* ── Editors Info ── */}
        <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginRight: 6, alignSelf: 'center' }}>
            Editors:
          </span>
          {MEMBERS.map((m, i) => (
            <span key={i} style={{
              background: C.white, border: `1px solid ${C.border}`,
              padding: '3px 10px', borderRadius: 20, fontSize: 11,
              color: C.text2, display: 'flex', alignItems: 'center', gap: 5
            }}>
              <span style={{ color: C.green, fontWeight: 700 }}>{m.initials}</span> {m.name.split(' ')[0]}
            </span>
          ))}
        </div>

        {/* ── Add Expense Form ── */}
        {isEditor && (
          <div style={{
            background: C.white, borderRadius: 18,
            padding: '24px 26px', marginBottom: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 14, letterSpacing: 0.3 }}>
              ADD EXPENSE
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 5, letterSpacing: 0.3 }}>DESCRIPTION</div>
                <input
                  value={form.desc}
                  onChange={e => setForm({ ...form, desc: e.target.value })}
                  placeholder="e.g. Cement bags, Labor charges..."
                  style={{ width: '100%', height: 44, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '0 14px', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 5, letterSpacing: 0.3 }}>CATEGORY</div>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', height: 44, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '0 12px', fontSize: 14, outline: 'none', background: C.white }}
                >
                  {Object.entries(CAT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 5, letterSpacing: 0.3 }}>DATE</div>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  style={{ width: '100%', height: 44, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '0 12px', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 5, letterSpacing: 0.3 }}>AMOUNT (₹)</div>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', height: 44, border: `1px solid ${C.border2}`, borderRadius: 10, padding: '0 14px', fontSize: 14, outline: 'none' }}
                />
              </div>

              <button onClick={addExpense} style={{
                height: 44, background: C.green, color: C.white,
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                padding: '0 28px', cursor: 'pointer', whiteSpace: 'nowrap'
              }}>
                + Add Expense
              </button>
            </div>

            {formErr && (
              <div style={{ color: C.danger, fontSize: 12, marginTop: 10, fontWeight: 500 }}>
                {formErr}
              </div>
            )}
          </div>
        )}

        {/* ── Filters & Download ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', '1m', '3m', '6m'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: filter === f ? C.green : C.white,
                  color: filter === f ? C.white : C.text,
                  boxShadow: filter === f ? '0 2px 8px rgba(45, 80, 22, 0.25)' : '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                {flLabel(f)}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                background: C.white, border: `1px solid ${C.border2}`,
                padding: '9px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              ⬇ Download
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', background: C.white,
                border: `1px solid ${C.border}`, borderRadius: 14, padding: '8px 0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)', minWidth: 220, zIndex: 50
              }}>
                {DOWNLOADS.map((d, i) => (
                  <div
                    key={i}
                    onClick={d.fn}
                    style={{
                      padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer', fontSize: 13
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: C.text }}>{d.label}</div>
                      <div style={{ fontSize: 11, color: C.text2 }}>{d.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Expenses Table ── */}
        <div style={{
          background: C.white, borderRadius: 18,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
              ALL EXPENSES
            </div>
            <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>
              Showing {filtered.length} expense{filtered.length !== 1 ? 's' : ''} for {flLabel(filter)} — Total: {fmt(totalSpent)}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: C.text2 }}>
              <div style={{ fontSize: 42, marginBottom: 12, opacity: 0.3 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No expenses found</div>
              <div style={{ fontSize: 13 }}>Add your first expense above to get started.</div>
            </div>
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
                  {filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map((e, idx) => (
                    <tr key={e.id} style={{ borderTop: idx > 0 ? `1px solid ${C.border}` : 'none' }}>
                      <td style={{ padding: '13px 18px', fontWeight: 500, color: C.text }}>
                        {editId === e.id ? (
                          <input value={editForm.desc} onChange={ev => setEditForm({ ...editForm, desc: ev.target.value })} style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: `1px solid ${C.green2}`, borderRadius: 6 }} />
                        ) : e.desc}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        {editId === e.id ? (
                          <select value={editForm.category} onChange={ev => setEditForm({ ...editForm, category: ev.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: `1px solid ${C.green2}`, borderRadius: 6 }}>
                            {Object.entries(CAT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                          </select>
                        ) : (
                          <span style={{
                            background: CAT_COLORS[e.category]?.bg,
                            color: CAT_COLORS[e.category]?.color,
                            padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600
                          }}>
                            {CAT_LABELS[e.category]}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '13px 18px', color: C.text2, fontSize: 12 }}>
                        {editId === e.id ? (
                          <input type="date" value={editForm.date} onChange={ev => setEditForm({ ...editForm, date: ev.target.value })} style={{ padding: '4px 8px', fontSize: 12, border: `1px solid ${C.green2}`, borderRadius: 6 }} />
                        ) : fmtDate(e.date)}
                      </td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 700, color: C.text, fontSize: 14 }}>
                        {editId === e.id ? (
                          <input type="number" value={editForm.amount} onChange={ev => setEditForm({ ...editForm, amount: ev.target.value })} style={{ width: 90, padding: '4px 8px', fontSize: 13, border: `1px solid ${C.green2}`, borderRadius: 6, textAlign: 'right' }} />
                        ) : fmt(e.amount)}
                      </td>
                      <td style={{ padding: '13px 18px', color: C.text2, fontSize: 12 }}>
                        {e.addedBy || '-'}
                      </td>
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

        {/* ── Category Breakdown ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 12, paddingLeft: 6 }}>
            SPENDING BY CATEGORY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {Object.keys(catTotals).length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: C.text2, background: C.white, borderRadius: 14, border: `1px solid ${C.border}` }}>
                No data for this period
              </div>
            ) : (
              Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                <div key={cat} style={{
                  background: C.white, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: '14px 16px'
                }}>
                  <div style={{ fontSize: 11, color: C.text2, marginBottom: 4, fontWeight: 600 }}>
                    {CAT_LABELS[cat]}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{fmt(total)}</div>
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
                    {Math.round((total / totalSpent) * 100)}% of total
                  </div>
                  <div style={{
                    height: 4, background: C.successBg, borderRadius: 999, marginTop: 8,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%', width: `${Math.round((total / totalSpent) * 100)}%`,
                      background: C.green2, borderRadius: 999
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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