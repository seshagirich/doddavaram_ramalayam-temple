import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MEMBERS = ['Seshagiri', 'Ramesh', 'Prasad', 'Venkatesh', 'Krishna'];

const CAT_LABELS = {
  foundation: 'Foundation', structure: 'Structure', roofing: 'Roofing',
  electrical: 'Electrical', plumbing: 'Plumbing', flooring: 'Flooring',
  interior: 'Interior', exterior: 'Exterior', labor: 'Labor', other: 'Other'
};

const DEFAULT_BUDGETS = {
  foundation: 500000, structure: 1200000, roofing: 800000,
  electrical: 300000, plumbing: 250000, flooring: 400000,
  interior: 350000, exterior: 450000, labor: 600000, other: 200000
};

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [isEditor, setIsEditor] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ date: '', category: 'foundation', amount: '', description: '', member: '', receipt: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('templeExpenses');
    if (saved) setExpenses(JSON.parse(saved));
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) setDarkMode(JSON.parse(savedMode));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('templeExpenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const addExpense = () => {
    if (!newExpense.date || !newExpense.amount || !newExpense.description) return alert('Fill required fields');
    const expense = {
      id: Date.now(),
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      receipt: newExpense.receipt
    };
    setExpenses([expense, ...expenses]);
    setNewExpense({ date: '', category: 'foundation', amount: '', description: '', member: '', receipt: null });
  };

  const deleteExpense = (id) => {
    if (confirm('Delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory === 'all' || exp.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Doddavaram Ramalayam Temple - Expense Report', 14, 20);
    // Add table logic with autoTable
    autoTable(doc, {
      head: [['Date', 'Category', 'Description', 'Amount', 'Member']],
      body: filteredExpenses.map(e => [e.date, CAT_LABELS[e.category], e.description, e.amount, e.member]),
      startY: 30
    });
    doc.save('temple_expenses.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredExpenses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'temple_expenses.xlsx');
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewExpense({...newExpense, receipt: ev.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const backupData = () => {
    const dataStr = JSON.stringify(expenses);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'temple_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const restoreData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          setExpenses(data);
          alert('Data restored successfully!');
        } catch (err) {
          alert('Invalid backup file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950 text-white' : 'bg-orange-50'} font-serif`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-700 to-amber-800 text-white py-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🛕</div>
            <div>
              <h1 className="text-2xl font-bold">Doddavaram Ramalayam</h1>
              <p className="text-sm opacity-90">Construction Budget Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/20">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setIsEditor(!isEditor)} className="px-4 py-2 bg-white text-orange-800 rounded-full font-medium">
              {isEditor ? 'View Mode' : 'Editor Mode'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Budget Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
            <p className="text-4xl font-bold text-orange-600">₹{totalSpent.toLocaleString('en-IN')}</p>
          </div>
          {/* More cards */}
        </div>

        {/* Filters & Form */}
        {isEditor && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow mb-8">
            {/* New Expense Form with receipt upload */}
            {/* ... */}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Responsive table */}
          </table>
        </div>
      </div>
    </div>
  );
}
