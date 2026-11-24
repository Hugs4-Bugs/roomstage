import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const TYPES = ['residential', 'commercial', 'mixed'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: '',
    project_type: 'residential',
    contact_phone: '',
    contact_email: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function loadProjects() {
    setLoading(true);
    client
      .get('/projects')
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await client.post('/projects', form);
      setForm({ name: '', location: '', project_type: 'residential', contact_phone: '', contact_email: '' });
      setShowForm(false);
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl">Projects</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New project'}
        </button>
      </div>
      <div className="dim-line" />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 space-y-4 max-w-md">
          <div>
            <label className="block font-mono text-xs text-slate mb-1">PROJECT NAME</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Taraji Heights Phase 2"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-slate mb-1">LOCATION</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Ngong Road, Nairobi"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-slate mb-1">TYPE</label>
            <select
              className="input"
              value={form.project_type}
              onChange={(e) => setForm({ ...form, project_type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-slate mb-1">CONTACT PHONE</label>
              <input
                className="input"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="07XX XXX XXX"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-slate mb-1">CONTACT EMAIL</label>
              <input
                className="input"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="optional"
              />
            </div>
          </div>
          <p className="text-xs text-slate -mt-2">Shown as the contact CTA on public show-suite pages.</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save project'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate text-sm">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="card p-6 text-center text-slate text-sm">
          No projects yet. Add your first one above.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card p-4 block hover:border-ink transition-colors">
              <div className="text-sm font-body font-medium">{p.name}</div>
              <div className="text-xs text-slate mt-1">
                {[p.location, p.project_type].filter(Boolean).join(' · ')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
