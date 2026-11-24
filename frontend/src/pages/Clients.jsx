import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  function loadClients(q = '') {
    setLoading(true);
    client
      .get('/clients', { params: q ? { search: q } : {} })
      .then((res) => setClients(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadClients();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadClients(search);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await client.post('/clients', form);
      setForm({ name: '', phone: '', email: '', location: '' });
      setShowForm(false);
      loadClients(search);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save client.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl">Clients</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New client'}
        </button>
      </div>
      <div className="dim-line" />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 space-y-4 max-w-md">
          <div>
            <label className="block font-mono text-xs text-slate mb-1">NAME</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Client name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-slate mb-1">PHONE</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="07XX XXX XXX"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-slate mb-1">EMAIL</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="optional"
              />
            </div>
          </div>
          <div>
            <label className="block font-mono text-xs text-slate mb-1">LOCATION</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Kilimani, Nairobi"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save client'}
          </button>
        </form>
      )}

      <form onSubmit={handleSearch} className="mb-4 max-w-sm">
        <input
          className="input"
          placeholder="Search by name, phone, or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {loading ? (
        <p className="text-slate text-sm">Loading…</p>
      ) : clients.length === 0 ? (
        <div className="card p-6 text-center text-slate text-sm">
          No clients yet. Add your first one above.
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {clients.map((c) => (
            <div key={c.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-body">{c.name}</div>
                <div className="text-xs text-slate">
                  {[c.phone, c.location].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <Link to="/jobs" className="font-mono text-xs text-accent hover:underline">
                view jobs →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
