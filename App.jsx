import { useState, useRef } from 'react'
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

const inp = {
  width: '100%', height: 42,
  border: `1px solid ${C.border2}`, borderRadius: 8,
  padding: '0 12px', fontSize: 14,
  background: C.white, color: C.text,
  boxSizing: 'border-box', outline: 'none',
}
const lbl = {
  fontSize: 11, fontWeight: 600, color: C.text2,
  textTransform: 'uppercase', letterSpacing: 0.5,
  marginBottom: 5, display: 'block',
}
const cardSt = {
  background: C.white, borderRadius: 12,
  border: `1px solid ${C.border}`,
  padding: '20px 24px', marginBottom: 20,
}
const ctitleSt = {
  fontSize: 12, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: 0.6,
  color: C.text3, marginBottom: 14,
}

// ─── LANDING SCREEN ──────────────────────────────────────────────────────────
function Landing({ onEditor, onViewer }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, padding: '2rem', gap: '1.5rem'
    }}>
      <div style={{
        width: 80, height: 80, background: C.green,
        borderRadius: 22, display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, color: C.text, fontWeight: 700, lineHeight: 1.2 }}>
          Sri Ramalayam Temple
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: C.green, marginTop: 6 }}>
          Construction Budget Tracker
        </div>
        <div style={{ fontSize: 13, color: C.text3, marginTop: 6 }}>
          Expense management for temple construction
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
        <button onClick={onEditor} style={{
          height: 52, background: C.green, color: C.white,
          border: 'none', borderRadius: 12, fontSize: 15,
          fontWeight: 600, cursor: 'pointer'
        }}>
          🔐 &nbsp; Enter as Editor (PIN required)
        </button>
        <button onClick={onViewer} style={{
          height: 52, background: C.white, color: C.text,
          border: `1px solid ${C.border2}`, borderRadius: 12,
          fontSize: 15, fontWeight: 500, cursor: 'pointer'
        }}>
          👁 &nbsp; View Only (No PIN needed)
        </button>
      </div>

      <div style={{ fontSize: 12, color: C.text3, textAlign: 'center', lineHeight: 1.9 }}>
        Editors can add, edit &amp; delete expenses.<br />
        Viewers can see all expenses &amp; download reports.
      </div>
    </div>
  )
}

// ─── PIN SCREEN ───────────────────────────────────────────────────────────────
function PinScreen({ onSuccess, onCancel }) {
  const [selected, setSelected] = useState(null)
  const [digits,   setDigits]   = useState([])
  const [error,    setError]    = useState('')
  const [shake,    setShake]    = useState(false)

  // useRef fixes stale closure bug — always reads latest value
  const selRef    = useRef(null)
  const digitsRef = useRef([])

  const pickMember = i => {
    selRef.current    = i
    digitsRef.current = []
    setSelected(i)
    setDigits([])
    setError('')
  }

  const verify = digs => {
    const idx = selRef.current
    if (idx === null) {
      setError('Please select your name first.')
      digitsRef.current = []
      setDigits([])
      return
    }
    if (digs.join('') === MEMBERS[idx].pin) {
      onSuccess(MEMBERS[idx].name)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setError('Incorrect PIN. Please try again.')
      digitsRef.current = []
      setDigits([])
    }
  }

  const pressKey = k => {
    if (digitsRef.current.length >= 4) return
    const next = [...digitsRef.current, k]
    digitsRef.current = next
    setDigits([...next])
    if (next.length === 4) setTimeout(() => verify(next), 200)
  }

  const pressBack = () => {
    const next = digitsRef.current.slice(0, -1)
    digitsRef.current = next
    setDigits([...next])
    setError('')
  }

  const pinLen = digits.length
  const statusMsg = () => {
    if (error) return null
    if (selected === null) return 'Select your name above to begin'
    if (pinLen === 0)      return 'Now enter your 4-digit PIN below'
    if (pinLen < 4)        return `${4 - pinLen} more digit${4 - pinLen > 1 ? 's' : ''} needed`
    return 'Verifying…'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, padding: '1rem'
    }}>
      <div style={{
        background: C.white, borderRadius: 24, padding: '2rem',
        width: '100%', maxWidth: 480,
        boxShadow: '0 12px 48px rgba(0,0,0,0.10)'
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          Editor Access
        </div>
        <div style={{ fontSize: 13, color: C.text2, marginBottom: 24 }}>
          Select your name, then enter your secret PIN
        </div>

        {/* Step 1 */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.green,
          textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10
        }}>
          Step 1 — Select your name
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {MEMBERS.map((m, i) => (
            <div key={i} onClick={() => pickMember(i)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 13px', borderRadius: 12, cursor: 'pointer',
              transition: 'all 0.15s',
              border: `2px solid ${selected === i ? C.green : C.border2}`,
              background: selected === i ? C.successBg : C.bg,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: C.white,
                background: selected === i ? C.green : C.text3,
                transition: 'all 0.15s',
              }}>
                {m.initials}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 11, marginTop: 1, color: selected === i ? C.green : C.text3 }}>
                  {selected === i ? '✓ Selected' : 'Editor'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Step 2 */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.green,
          textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14
        }}>
          Step 2 — Enter your 4-digit PIN
        </div>

        {/* PIN dots */}
        <div style={{
          display: 'flex', gap: 18, justifyContent: 'center', marginBottom: 20,
          animation: shake ? 'shake 0.4s ease' : 'none'
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: '50%', transition: 'all 0.15s',
              border: `2.5px solid ${i < pinLen ? C.green : 'rgba(0,0,0,0.18)'}`,
              background: i < pinLen ? C.green : C.white,
            }} />
          ))}
        </div>

        {/* Keypad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 10, maxWidth: 260, margin: '0 auto 16px'
        }}>
          {['1','2','3','4','5','6','7','8','9'].map(k => (
            <button key={k} onClick={() => pressKey(k)} style={{
              height: 58, background: C.bg,
              border: `1.5px solid ${C.border}`, borderRadius: 12,
              fontSize: 22, fontWeight: 500, cursor: 'pointer', color: C.text,
            }}>
              {k}
            </button>
          ))}
          <div />
          <button onClick={() => pressKey('0')} style={{
            height: 58, background: C.bg,
            border: `1.5px solid ${C.border}`, borderRadius: 12,
            fontSize: 22, fontWeight: 500, cursor: 'pointer', color: C.text,
          }}>
            0
          </button>
          <button onClick={pressBack} style={{
            height: 58, background: C.dangerBg,
            border: '1.5px solid #e8aea9', borderRadius: 12,
            fontSize: 20, cursor: 'pointer', color: C.danger,
          }}>
            ⌫
          </button>
        </div>

        {/* Status message */}
        <div style={{ minHeight: 28, textAlign: 'center', marginBottom: 16 }}>
          {error
            ? <span style={{ color: C.danger, fontSize: 13, fontWeight: 600 }}>{error}</span>
            : <span style={{ color: C.text3, fontSize: 12 }}>{statusMsg()}</span>
          }
        </div>

        <button onClick={onCancel} style={{
          width: '100%', height: 44, background: 'transparent',
          border: `1px solid ${C.border2}`, borderRadius: 10,
          color: C.text2, fontSize: 14, cursor: 'pointer', fontWeight: 500,
        }}>
          ← Back to home
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          20%      { transform: translateX(-8px) }
          40%      { transform: translateX(8px) }
          60%      { transform: translateX(-6px) }
          80%      { transform: translateX(6px) }
        }
      `}</style>
    </div>
  )
}

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

  // ── filtered data ──
  const getFiltered = () => {
    if (filter === 'all') return expenses
    const now    = new Date()
    const months = filter === '1m' ? 1 : filter === '3m' ? 3 : 6
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
    return expenses.filter(e => new Date(e.date) >= cutoff)
  }
  const filtered   = getFiltered()
  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0)
  const catTotals  = {}
  filtered.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })

  // ── CRUD ──
  const addExpense = () => {
    if (!form.desc.trim())                        { setFormErr('Please enter a description.'); return }
    if (!form.date)                               { setFormErr('Please select a date.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setFormErr('Please enter a valid amount.'); return }
    const id = idCtr + 1
    setIdCtr(id)
    setExpenses(p => [...p, {
      id,
      desc:     form.desc.trim(),
      category: form.category,
      date:     form.date,
      amount:   Number(form.amount),
      addedBy:  currentUser,
    }])
    setForm(f => ({ ...f, desc: '', amount: '' }))
    setFormErr('')
  }

  const startEdit  = e => { setEditId(e.id); setEditForm({ desc: e.desc, category: e.category, date: e.date, amount: e.amount }) }
  const cancelEdit = () => { setEditId(null); setEditForm({}) }
  const saveEdit   = id => {
    if (!editForm.desc.trim())                          { alert('Description cannot be empty'); return }
    if (!editForm.date)                                 { alert('Please select a date'); return }
    if (!editForm.amount || Number(editForm.amount) <= 0){ alert('Please enter a valid amount'); return }
    setExpenses(p => p.map(e => e.id === id ? { ...e, ...editForm, amount: Number(editForm.amount) } : e))
    setEditId(null)
  }
  const deleteExp = id => {
    if (window.confirm('Delete this expense?'))
      setExpenses(p => p.filter(e => e.id !== id))
  }

  // ── PDF ──
  const downloadPDF = () => {
    setShowMenu(false)
    if (!filtered.length) { alert('No expenses for this period.'); return }
    const fl    = flLabel(filter)
    const ds    = todayDMY()
    const total = filtered.reduce((s, e) => s + e.amount, 0)
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    doc.setFillColor(45, 80, 22); doc.rect(0, 0, 210, 46, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('Sri Ramalayam Temple', 14, 15)
    doc.setFontSize(12); doc.setFont('helvetica', 'normal')
    doc.text('Construction Budget Tracker — Expense Report', 14, 24)
    doc.setFontSize(9)
    doc.text(`Period: ${fl}   |   Generated: ${ds}   |   By: ${currentUser}`, 14, 31)
    doc.text(`Total Entries: ${filtered.length}   |   Grand Total: Rs.${Math.round(total).toLocaleString('en-IN')}`, 14, 38)
    doc.setFillColor(238, 245, 232); doc.roundedRect(14, 52, 182, 14, 3, 3, 'F')
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(45, 80, 22)
    doc.text(`Grand Total (${fl}):   Rs.${Math.round(total).toLocaleString('en-IN')}`, 20, 61)

    autoTable(doc, {
      startY: 72,
      head:   [['#', 'Description', 'Category', 'Date', 'Amount', 'Added by']],
      body:   filtered.map((e, i) => [
        i + 1, e.desc, CAT_LABELS[e.category],
        fmtDate(e.date),
        'Rs.' + Math.round(e.amount).toLocaleString('en-IN'),
        e.addedBy || '-',
      ]),
      foot: [['', '', '', 'Grand Total', 'Rs.' + Math.round(total).toLocaleString('en-IN'), '']],
      headStyles:       { fillColor: [45,80,22], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 4 },
      footStyles:       { fillColor: [238,245,232], textColor: [45,80,22], fontStyle: 'bold', fontSize: 9 },
      bodyStyles:       { fontSize: 9, textColor: [30,30,30], cellPadding: 3 },
      alternateRowStyles: { fillColor: [248,246,242] },
      columnStyles:     { 0: { cellWidth: 10, halign: 'center' }, 4: { halign: 'right', cellWidth: 36 } },
      margin:           { left: 14, right: 14 },
      didDrawPage: data => {
        doc.setFontSize(8); doc.setTextColor(160, 160, 160)
        doc.text('Sri Ramalayam Temple Construction Budget Tracker', 14, 290)
        doc.text(`Page ${data.pageNumber}`, 196, 290, { align: 'right' })
      },
    })
    doc.save(`Ramalayam_${fl.replace(/ /g, '_')}_${ds.replace(/\//g, '-')}.pdf`)
  }

  // ── Excel ──
  const downloadExcel = () => {
    setShowMenu(false)
    if (!filtered.length) { alert('No expenses for this period.'); return }
    const fl    = flLabel(filter)
    const ds    = todayDMY()
    const total = filtered.reduce((s, e) => s + e.amount, 0)

    const ws = XLSX.utils.aoa_to_sheet([
      ['Sri Ramalayam Temple — Construction Budget Tracker'],
      [`Period: ${fl} | Generated: ${ds} | By: ${currentUser}`],
      [],
      ['#', 'Description', 'Category', 'Date', 'Amount (Rs.)', 'Added By'],
      ...filtered.map((e, i) => [i + 1, e.desc, CAT_LABELS[e.category], fmtDate(e.date), Math.round(e.amount), e.addedBy || '-']),
      [],
      ['', '', '', 'Grand Total', Math.round(total), ''],
    ])
    ws['!cols']   = [{ wch: 4 }, { wch: 32 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 30 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses')

    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Category Summary'],
      [`Period: ${fl}`],
      [],
      ['Category', 'Total (Rs.)'],
      ...Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, v]) => [CAT_LABELS[cat], Math.round(v)]),
      [],
      ['Grand Total', Math.round(total)],
    ])
    ws2['!cols'] = [{ wch: 28 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Category Summary')
    XLSX.writeFile(wb, `Ramalayam_${fl.replace(/ /g, '_')}_${ds.replace(/\//g, '-')}.xlsx`)
  }

  // ── CSV ──
  const downloadCSV = () => {
    setShowMenu(false)
    if (!filtered.length) { alert('No expenses for this period.'); return }
    const fl    = flLabel(filter)
    const ds    = todayDMY()
    const total = filtered.reduce((s, e) => s + e.amount, 0)
    const csv   = [
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
        `"${e.addedBy || '-'}"`,
      ]),
      [],
      ['', '', '', 'Grand Total', Math.round(total), ''],
    ].map(r => r.join(',')).join('\n')

    const a   = document.createElement('a')
    a.href    = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `Ramalayam_${fl.replace(/ /g, '_')}_${ds.replace(/\//g, '-')}.csv`
    a.click()
  }

  // ── Print ──
  const printReport = () => {
    setShowMenu(false)
    if (!filtered.length) { alert('No expenses for this period.'); return }
    const fl    = flLabel(filter)
    const ds    = todayDMY()
    const total = filtered.reduce((s, e) => s + e.amount, 0)
    const rows  = filtered.map((e, i) =>
      `<tr>
        <td>${i + 1}</td>
        <td>${e.desc}</td>
        <td>${CAT_LABELS[e.category]}</td>
        <td>${fmtDate(e.date)}</td>
        <td style="text-align:right">Rs.${Math.round(e.amount).toLocaleString('en-IN')}</td>
        <td>${e.addedBy || '-'}</td>
      </tr>`
    ).join('')

    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <title>Ramalayam Expenses</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}
        .h{background:#2D5016;color:#fff;padding:14px 18px;border-radius:6px;margin-bottom:12px;}
        .h h1{margin:0 0 4px;font-size:17px;}.h p{margin:2px 0;font-size:10px;opacity:.85;}
        .tot{background:#EEF5E8;border:1px solid #5A8A2C;padding:8px 14px;border-radius:5px;
             margin-bottom:12px;font-size:13px;color:#2D5016;font-weight:bold;}
        table{width:100%;border-collapse:collapse;}
        th{background:#2D5016;color:#fff;padding:7px 8px;text-align:left;font-size:10px;}
        td{padding:6px 8px;border-bottom:1px solid #eee;}
        tr:nth-child(even){background:#f8f6f2;}
        tfoot td{background:#EEF5E8;color:#2D5016;font-weight:bold;}
        @media print{button{display:none!important;}}
      </style></head>
      <body>
        <div class="h">
          <h1>Sri Ramalayam Temple</h1>
          <p>Construction Budget Tracker — Expense Report</p>
          <p>Period: ${fl} | Generated: ${ds} | By: ${currentUser} | Entries: ${filtered.length}</p>
        </div>
        <div class="tot">Grand Total (${fl}): Rs.${Math.round(total).toLocaleString('en-IN')}</div>
        <table>
          <thead><tr><th>#</th><th>Description</th><th>Category</th><th>Date</th><th>Amount</th><th>Added By</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="4"></td>
            <td style="text-align:right">Rs.${Math.round(total).toLocaleString('en-IN')}</td>
            <td>Grand Total</td></tr></tfoot>
        </table>
        <br/>
        <button onclick="window.print()"
          style="background:#2D5016;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-size:13px;cursor:pointer;">
          🖨 Print
        </button>
      </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const DOWNLOADS = [
    { icon: '📄', label: 'PDF Report',    sub: 'Best for sharing',       fn: downloadPDF   },
    { icon: '📊', label: 'Excel (.xlsx)', sub: 'Open in Excel / Sheets', fn: downloadExcel },
    { icon: '📋', label: 'CSV File',      sub: 'Open in any app',        fn: downloadCSV   },
    { icon: '🖨',  label: 'Print',        sub: 'Print or save as PDF',   fn: printReport   },
  ]

  const editInpSt = {
    width: '100%', height: 30,
    border: `1px solid ${C.green2}`,
    borderRadius: 6, padding: '0 8px', fontSize: 12, outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}
      onClick={() => showMenu && setShowMenu(false)}>

      {/* ── Header ── */}
      <div style={{
        background: C.green, padding: '13px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}>
        <div>
          <div style={{ fontSize: 20, color: C.white, fontWeight: 600 }}>
            Ramalayam Temple Budget Tracker
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Sri Ramalayam Temple — Construction Expense Manager
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 13, color: 'rgba(255,255,255,0.85)',
            maxWidth: 200, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {currentUser}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99,
            background: isEditor ? C.gold : 'rgba(255,255,255,0.18)',
            color: isEditor ? '#3a2800' : C.white,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {isEditor ? 'Editor' : 'Viewer'}
          </span>
          <button onClick={onExit} style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: C.white, padding: '6px 16px',
            borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
          }}>
            Exit
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Total spent ── */}
        <div style={{
          background: C.green, borderRadius: 14,
          padding: '18px 26px', display: 'inline-flex',
          flexDirection: 'column', marginBottom: 20, minWidth: 220,
          boxShadow: '0 4px 20px rgba(45,80,22,0.25)',
        }}>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.65)',
            textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5,
          }}>
            Total Spent
          </div>
          <div style={{ fontSize: 34, color: C.white, fontWeight: 700, letterSpacing: -0.5 }}>
            {fmt(totalSpent)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {flLabel(filter)} • {filtered.length} entries
          </div>
        </div>

        {/* ── Member chips ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>Editors:</span>
          {MEMBERS.map(m => (
            <div key={m.name} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 99, padding: '4px 12px 4px 5px',
              fontSize: 12, color: C.text2,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: C.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: C.white,
              }}>
                {m.initials}
              </div>
              {m.name}
            </div>
          ))}
        </div>

        {/* ── Add Expense (editor only) ── */}
        {isEditor && (
          <div style={cardSt}>
            <div style={ctitleSt}>Add Expense</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.4fr 1.4fr', gap: 12, marginBottom: 10 }}>
              <div>
                <label style={lbl}>Description</label>
                <input style={inp} type="text" value={form.desc} placeholder="e.g. Cement bags"
                  onChange={e => { setForm(f => ({ ...f, desc: e.target.value })); setFormErr('') }} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select style={inp} value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.entries(CAT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Date</label>
                <input style={inp} type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Amount (₹)</label>
                <input style={inp} type="number" value={form.amount} placeholder="0" min="0"
                  onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setFormErr('') }} />
              </div>
            </div>
            {formErr && (
              <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{formErr}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={addExpense} style={{
                height: 42, background: C.green, color: C.white,
                border: 'none', borderRadius: 8, padding: '0 24px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                + Add Expense
              </button>
            </div>
          </div>
        )}

        {/* ── Viewer notice ── */}
        {!isEditor && (
          <div style={{
            background: '#EAF3DE', border: '1px solid #C0DD97',
            borderRadius: 10, padding: '10px 16px', fontSize: 13,
            color: '#27500A', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>👁</span>
            You are in view-only mode. Contact an editor member to make changes.
          </div>
        )}

        {/* ── Expenses Table ── */}
        <div style={cardSt}>
          <div style={ctitleSt}>All Expenses</div>

          {/* Filter + Download */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 14,
            flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['all','All time'], ['1m','Last 1 month'], ['3m','Last 3 months'], ['6m','Last 6 months']].map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)} style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 12,
                  fontWeight: 500, cursor: 'pointer', border: '1px solid',
                  transition: 'all 0.15s',
                  borderColor: filter === val ? C.green : C.border2,
                  background:  filter === val ? C.green : C.white,
                  color:       filter === val ? C.white  : C.text2,
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Download dropdown */}
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowMenu(m => !m)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 8,
                border: `1px solid ${C.green2}`, background: C.successBg,
                color: C.green, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                ⬇ Download ▾
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: C.white, border: `1px solid ${C.border}`,
                  borderRadius: 12, boxShadow: '0 10px 32px rgba(0,0,0,0.14)',
                  zIndex: 50, minWidth: 200, overflow: 'hidden',
                }}>
                  {DOWNLOADS.map((item, i) => (
                    <button key={i} onClick={item.fn} style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 12, padding: '11px 16px', border: 'none',
                      background: 'transparent', cursor: 'pointer', textAlign: 'left',
                      borderBottom: i < 3 ? `1px solid ${C.border}` : 'none',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: 22, width: 24, textAlign: 'center' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{item.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info bar */}
          <div style={{
            fontSize: 12, color: C.text2, marginBottom: 12,
            padding: '8px 12px', background: C.bg, borderRadius: 8,
          }}>
            Showing <strong>{filtered.length}</strong> expense(s) for{' '}
            <strong>{flLabel(filter)}</strong> — Total:{' '}
            <strong style={{ color: C.green }}>{fmt(totalSpent)}</strong>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {['Description', 'Category', 'Date', 'Amount', 'Added by', ...(isEditor ? ['Actions'] : [])].map((h, i) => (
                    <th key={i} style={{
                      textAlign: h === 'Amount' ? 'right' : 'left',
                      fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      color: C.text3, padding: '10px',
                      width:
                        h === 'Actions'  ? '160px' :
                        h === 'Amount'   ? '110px' :
                        h === 'Date'     ? '105px' :
                        h === 'Added by' ? '145px' : undefined,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isEditor ? 6 : 5} style={{
                      textAlign: 'center', padding: '3rem', color: C.text3, fontSize: 13,
                    }}>
                      No expenses found for this period.
                      {isEditor && ' Add your first expense above!'}
                    </td>
                  </tr>
                ) : filtered.map(e => editId === e.id ? (
                  <tr key={e.id} style={{ background: '#f0f8e8', borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '7px 8px' }}>
                      <input value={editForm.desc} style={editInpSt}
                        onChange={ev => setEditForm(f => ({ ...f, desc: ev.target.value }))} />
                    </td>
                    <td style={{ padding: '7px 8px' }}>
                      <select value={editForm.category} style={editInpSt}
                        onChange={ev => setEditForm(f => ({ ...f, category: ev.target.value }))}>
                        {Object.entries(CAT_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '7px 8px' }}>
                      <input type="date" value={editForm.date} style={editInpSt}
                        onChange={ev => setEditForm(f => ({ ...f, date: ev.target.value }))} />
                    </td>
                    <td style={{ padding: '7px 8px' }}>
                      <input type="number" value={editForm.amount} style={editInpSt}
                        onChange={ev => setEditForm(f => ({ ...f, amount: ev.target.value }))} />
                    </td>
                    <td style={{ padding: '7px 8px', fontSize: 11, color: C.text2 }}>{e.addedBy}</td>
                    <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => saveEdit(e.id)} style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 6,
                        border: `1px solid ${C.green2}`, background: C.successBg,
                        color: C.green, cursor: 'pointer', marginRight: 5, fontWeight: 600,
                      }}>Save</button>
                      <button onClick={cancelEdit} style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 6,
                        border: `1px solid ${C.border2}`, background: C.white,
                        color: C.text2, cursor: 'pointer',
                      }}>Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={e.id}
                    style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = C.bg}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                    <td style={{
                      padding: '11px 10px', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500,
                    }} title={e.desc}>{e.desc}</td>
                    <td style={{ padding: '11px 10px' }}>
                      <span style={{
                        display: 'inline-block', fontSize: 11, padding: '3px 10px',
                        borderRadius: 99, fontWeight: 600,
                        background: CAT_COLORS[e.category]?.bg,
                        color:      CAT_COLORS[e.category]?.color,
                      }}>
                        {CAT_LABELS[e.category]}
                      </span>
                    </td>
                    <td style={{ padding: '11px 10px', color: C.text2, fontSize: 12 }}>{fmtDate(e.date)}</td>
                    <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                      {fmt(e.amount)}
                    </td>
                    <td style={{
                      padding: '11px 10px', fontSize: 11, color: C.text2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {e.addedBy}
                    </td>
                    {isEditor && (
                      <td style={{ padding: '11px 10px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => startEdit(e)} style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 6,
                          border: `1px solid ${C.green2}`, background: C.white,
                          color: C.green, cursor: 'pointer', marginRight: 5, fontWeight: 500,
                        }}>Edit</button>
                        <button onClick={() => deleteExp(e.id)} style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 6,
                          border: '1px solid #e8aea9', background: C.white,
                          color: C.danger, cursor: 'pointer', fontWeight: 500,
                        }}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Category breakdown ── */}
        <div style={cardSt}>
          <div style={ctitleSt}>Spending by Category</div>
          {Object.keys(catTotals).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: C.text3, fontSize: 13 }}>
              No data for this period
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
              {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
                <div key={cat} style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{
                    fontSize: 11, color: C.text2, marginBottom: 5,
                    textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600,
                  }}>
                    {CAT_LABELS[cat]}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{fmt(total)}</div>
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>
                    {Math.round((total / totalSpent) * 100)}% of total
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
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
