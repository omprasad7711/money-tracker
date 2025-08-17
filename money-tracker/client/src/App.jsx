
import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function App() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', date: '' });

  const load = async () => {
    const [a, b] = await Promise.all([ api.get('/transactions'), api.get('/summary') ]);
    setItems(a.data);
    setSummary(b.data);
  };

  useEffect(() => { load(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const add = async e => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    const payload = { ...form, amount: Number(form.amount), date: form.date || undefined };
    await api.post('/transactions', payload);
    setForm({ title: '', amount: '', type: 'expense', date: '' });
    load();
  };

  const remove = async id => {
    await api.delete(`/transactions/${id}`);
    load();
  };

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 16 }}>
      <h1>Money Tracker</h1>

      <section style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div><strong>Income:</strong> ₹{summary.income}</div>
        <div><strong>Expense:</strong> ₹{summary.expense}</div>
        <div><strong>Balance:</strong> ₹{summary.balance}</div>
      </section>

      <form onSubmit={add} style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
        <input name="amount" type="number" placeholder="Amount" value={form.amount} onChange={handleChange} />
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input name="date" type="date" value={form.date} onChange={handleChange} />
        <button>Add</button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(t => (
          <li key={t._id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #ddd', padding: 8, borderRadius: 6 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{t.title}</div>
              <div style={{ fontSize: 12, opacity: .7 }}>
                {t.type} • ₹{t.amount} • {new Date(t.date).toLocaleDateString()}
              </div>
            </div>
            <button onClick={() => remove(t._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}