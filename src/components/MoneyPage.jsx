import { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, Bus, Coffee, CreditCard, FileText, Gift, Heart, Home, Laptop, Pencil, PiggyBank, Plus, Receipt, ShoppingBag, Trash2, Utensils, WalletCards, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './MoneyPage.css'

const categories = {
  income: [
    { value: 'Freelance', icon: Laptop, color: '#63d9ff' },
    { value: 'Salary', icon: BriefcaseBusiness, color: '#62e6bd' },
    { value: 'Business', icon: WalletCards, color: '#9dbbff' },
    { value: 'Gift', icon: Gift, color: '#d8a4ff' },
    { value: 'Other income', icon: ArrowDownLeft, color: '#62e6bd' },
  ],
  expense: [
    { value: 'Food', icon: Utensils, color: '#ffb86b' },
    { value: 'Transport', icon: Bus, color: '#78b7ff' },
    { value: 'Shopping', icon: ShoppingBag, color: '#d8a4ff' },
    { value: 'Bills', icon: Receipt, color: '#ff8f87' },
    { value: 'Home', icon: Home, color: '#f1cc75' },
    { value: 'Health', icon: Heart, color: '#ff8f9d' },
    { value: 'Subscriptions', icon: CreditCard, color: '#9dbbff' },
    { value: 'Other expense', icon: WalletCards, color: '#a9a9b2' },
  ],
  savings: [{ value: 'Savings', icon: PiggyBank, color: '#62e6bd' }],
  bill: [{ value: 'Bills', icon: Receipt, color: '#ff8f87' }],
}

function dateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localDate(value) {
  const date = value ? new Date(value) : new Date()
  return dateKey(date)
}

function currency(value) {
  return '₦' + Math.abs(Number(value) || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })
}

function transactionType(entry, definition) {
  const metadata = entry?.metadata || {}
  if (metadata.transaction_type === 'income' || definition?.slug === 'income') return 'income'
  if (metadata.transaction_type === 'savings' || definition?.slug === 'savings') return 'savings'
  if (metadata.transaction_type === 'bill' || definition?.slug === 'bills') return 'bill'
  return 'expense'
}

function categoryInfo(entry, definition) {
  const metadata = entry?.metadata || {}
  const type = transactionType(entry, definition)
  const label = metadata.category || (type === 'income' ? 'Other income' : type === 'savings' ? 'Savings' : type === 'bill' ? 'Bills' : 'Other expense')
  const item = (categories[type] || categories.expense).find(option => option.value.toLowerCase() === String(label).toLowerCase())
    || Object.values(categories).flat().find(option => option.value.toLowerCase() === String(label).toLowerCase())
  return { label, icon: item?.icon || (type === 'income' ? ArrowDownLeft : type === 'savings' ? PiggyBank : type === 'bill' ? Receipt : WalletCards), color: item?.color || '#9dbbff', type }
}

export default function MoneyPage({ defs = [], logs = [] }) {
  const [filter, setFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [kind, setKind] = useState('expense')
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Food')
  const [merchant, setMerchant] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Card')
  const [date, setDate] = useState(dateKey())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [localEntries, setLocalEntries] = useState(logs)

  useEffect(() => setLocalEntries(logs), [logs])

  const financeDefs = useMemo(() => defs.filter(def => ['income', 'spending', 'savings', 'bills'].includes(def.slug)), [defs])
  const financeIds = useMemo(() => new Set(financeDefs.map(def => String(def.id))), [financeDefs])
  const metricById = useMemo(() => Object.fromEntries(defs.map(def => [String(def.id), def])), [defs])
  const entries = useMemo(() => localEntries
    .filter(entry => financeIds.has(String(entry.metric_id)))
    .map(entry => ({ ...entry, definition: metricById[String(entry.metric_id)] }))
    .sort((a, b) => new Date(b.logged_at || b.created_at) - new Date(a.logged_at || a.created_at)), [localEntries, financeIds, metricById])

  const visibleEntries = entries.filter(entry => {
    const type = transactionType(entry, entry.definition)
    if (filter === 'income') return type === 'income'
    if (filter === 'expenses') return type === 'expense' || type === 'bill'
    return true
  })

  const totals = entries.reduce((result, entry) => {
    const type = transactionType(entry, entry.definition)
    const value = Math.abs(Number(entry.value ?? entry.value_numeric) || 0)
    if (type === 'income') result.income += value
    if (type === 'expense' || type === 'bill') result.expenses += value
    if (type === 'savings') result.savings += value
    return result
  }, { income: 0, expenses: 0, savings: 0 })

  function resetForm() {
    setEditing(null)
    setKind('expense')
    setAmount('')
    setTitle('')
    setCategory('Food')
    setMerchant('')
    setPaymentMethod('Card')
    setDate(dateKey())
    setNote('')
    setError('')
    setFormOpen(false)
  }

  function openNew() {
    resetForm()
    setFormOpen(true)
  }

  function openEdit(entry) {
    const type = transactionType(entry, entry.definition)
    const metadata = entry.metadata || {}
    setEditing(entry)
    setKind(type)
    setAmount(String(Math.abs(Number(entry.value ?? entry.value_numeric) || 0)))
    setTitle(metadata.description || entry.note || metadata.merchant || metadata.category || entry.definition?.name || '')
    setCategory(metadata.category || (type === 'income' ? 'Other income' : type === 'savings' ? 'Savings' : type === 'bill' ? 'Bills' : 'Other expense'))
    setMerchant(metadata.merchant || '')
    setPaymentMethod(metadata.payment_method || 'Card')
    setDate(localDate(entry.logged_at || entry.created_at))
    setNote(metadata.note || '')
    setError('')
    setFormOpen(true)
  }

  function changeKind(value) {
    setKind(value)
    setCategory((categories[value] || categories.expense)[0]?.value || '')
  }

  async function saveTransaction(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (!title.trim()) {
      setError('Give this transaction a name.')
      return
    }
    const slug = kind === 'income' ? 'income' : kind === 'savings' ? 'savings' : kind === 'bill' ? 'bills' : 'spending'
    const definition = financeDefs.find(item => item.slug === slug)
    if (!definition) {
      setError('This finance tracker is not available yet. Refresh Evolv and try again.')
      return
    }

    setBusy(true)
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData?.user
    if (authError || !user) {
      setError('Please sign in again to save this transaction.')
      setBusy(false)
      return
    }

    const loggedAt = new Date(`${date}T12:00:00`)
    const metadata = {
      ...(editing?.metadata || {}),
      transaction_type: kind,
      category,
      merchant: merchant.trim() || null,
      payment_method: paymentMethod,
      description: title.trim(),
      note: note.trim() || null,
    }
    const payload = {
      user_id: user.id,
      metric_id: definition.id,
      value: numericAmount,
      value_numeric: numericAmount,
      unit: 'NGN',
      note: note.trim() || title.trim(),
      metadata,
      logged_at: loggedAt.toISOString(),
      logged_for: date,
    }
    const query = editing
      ? supabase.from('metric_logs').update(payload).eq('id', editing.id).eq('user_id', user.id)
      : supabase.from('metric_logs').insert(payload)
    const { data: saved, error: saveError } = await query.select('id,metric_id,value,value_numeric,unit,note,metadata,logged_at,created_at').single()
    setBusy(false)
    if (saveError) {
      setError(saveError.message || 'Could not save this transaction.')
      return
    }
    setLocalEntries(current => editing ? current.map(item => item.id === saved.id ? saved : item) : [saved, ...current])
    window.dispatchEvent(new Event('evolv-tracking-updated'))
    setNotice(editing ? 'Transaction updated.' : 'Transaction added.')
    resetForm()
  }

  async function deleteTransaction(entry) {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return
    const { error: deleteError } = await supabase.from('metric_logs').delete().eq('id', entry.id).eq('user_id', authData.user.id)
    if (deleteError) {
      setError(deleteError.message || 'Could not delete this transaction.')
      return
    }
    setLocalEntries(current => current.filter(item => item.id !== entry.id))
    window.dispatchEvent(new Event('evolv-tracking-updated'))
  }

  return (
    <section className="money-page">
      <header className="money-heading">
        <div><span className="money-eyebrow">YOUR FINANCES</span><h1>Money</h1></div>
        <button type="button" className="money-top-add" onClick={openNew} aria-label="Add transaction"><Plus size={19}/></button>
      </header>

      <section className="money-summary" aria-label="Money overview">
        <span className="money-summary-label">Income · Expenses</span>
        <div className="money-summary-values"><strong className="money-income-total">{currency(totals.income)}</strong><span>{currency(totals.expenses)}</span></div>
        <div className="money-summary-footer"><span><i className="money-dot income-dot"/>Income</span><span><i className="money-dot expense-dot"/>Expenses</span>{totals.savings > 0 && <span><i className="money-dot savings-dot"/>Saved {currency(totals.savings)}</span>}</div>
      </section>

      <div className="money-filter-tabs" role="tablist" aria-label="Filter transactions">
        {[['all', 'All'], ['income', 'Income'], ['expenses', 'Expenses']].map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={filter === value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}</button>)}
      </div>

      <section className="money-transactions" aria-label="Transactions">
        <div className="money-list-heading"><h2>Transactions</h2><span>{visibleEntries.length}</span></div>
        {visibleEntries.length ? <div className="money-transaction-list">
          {visibleEntries.map(entry => {
            const info = categoryInfo(entry, entry.definition)
            const Icon = info.icon
            const value = Math.abs(Number(entry.value ?? entry.value_numeric) || 0)
            const isIncome = info.type === 'income'
            const label = entry.metadata?.description || entry.note || info.label
            const subline = [info.label, entry.metadata?.merchant, new Date(entry.logged_at || entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })].filter(Boolean).join(' · ')
            return <article className="money-transaction-row" key={entry.id}>
              <span className="money-transaction-icon" style={{ '--transaction-color': info.color, '--transaction-tint': info.color + '20' }}><Icon size={19} strokeWidth={1.8}/></span>
              <button type="button" className="money-transaction-copy" onClick={() => openEdit(entry)} aria-label={`Edit ${label}`}>
                <strong>{label}</strong><small>{subline}</small>
              </button>
              <div className={'money-transaction-amount ' + (isIncome ? 'is-income' : 'is-outflow')}>{isIncome ? '+' : '−'}{currency(value)}</div>
              <button type="button" className="money-row-more" onClick={() => openEdit(entry)} aria-label={`Edit ${label}`}><Pencil size={14}/></button>
            </article>
          })}
        </div> : <div className="money-empty"><span className="money-empty-icon"><WalletCards size={23}/></span><strong>No transactions yet</strong><p>Your income and expenses will show up here.</p><button type="button" onClick={openNew}><Plus size={16}/> Add transaction</button></div>}
      </section>

      <button type="button" className="money-add-transaction" onClick={openNew}><Plus size={18}/> Add transaction</button>

      {notice && <p className="money-notice" role="status">{notice}</p>}

      {formOpen && <div className="money-form-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) resetForm() }}>
        <section className="money-form-sheet" role="dialog" aria-modal="true" aria-labelledby="money-form-title">
          <header className="money-form-heading"><div><span className="money-eyebrow">{editing ? 'UPDATE ENTRY' : 'NEW ENTRY'}</span><h2 id="money-form-title">{editing ? 'Edit transaction' : 'Add transaction'}</h2></div><button type="button" onClick={resetForm} aria-label="Close form"><X size={20}/></button></header>
          <form onSubmit={saveTransaction} className="money-form">
            <div className="money-kind-tabs" aria-label="Transaction type">
              {[['expense', 'Expense'], ['income', 'Income'], ['savings', 'Savings'], ['bill', 'Bill']].map(([value, label]) => <button key={value} type="button" className={kind === value ? 'is-active' : ''} onClick={() => changeKind(value)}>{label}</button>)}
            </div>
            <label className="money-amount-field"><span>Amount</span><div><span>₦</span><input type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" required /></div></label>
            <label className="money-form-field"><span>Name</span><input value={title} onChange={event => setTitle(event.target.value)} placeholder={kind === 'income' ? 'e.g. Website project' : 'e.g. Lunch'} maxLength={120} required /></label>
            <label className="money-form-field"><span>Category</span><select value={category} onChange={event => setCategory(event.target.value)}>{(categories[kind] || categories.expense).map(item => <option value={item.value} key={item.value}>{item.value}</option>)}</select></label>
            <label className="money-form-field"><span>{kind === 'income' ? 'Source' : 'Merchant / provider'} <small>Optional</small></span><input value={merchant} onChange={event => setMerchant(event.target.value)} placeholder={kind === 'income' ? 'e.g. Client name' : 'e.g. Shop or service'} maxLength={120}/></label>
            <div className="money-form-pair">
              <label className="money-form-field"><span>Payment method</span><select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}><option>Card</option><option>Cash</option><option>Bank transfer</option><option>USSD</option><option>Other</option></select></label>
              <label className="money-form-field"><span>Date</span><input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label>
            </div>
            <label className="money-form-field"><span>Note <small>Optional</small></span><textarea rows="2" value={note} onChange={event => setNote(event.target.value)} placeholder="Add a detail if useful" maxLength={500}/></label>
            {error && <p className="money-form-error" role="alert">{error}</p>}
            <button type="submit" className="money-save-button" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save transaction'}</button>
            {editing && <button type="button" className="money-delete-button" onClick={() => deleteTransaction(editing)}><Trash2 size={15}/> Delete transaction</button>}
          </form>
        </section>
      </div>}
    </section>
  )
}
