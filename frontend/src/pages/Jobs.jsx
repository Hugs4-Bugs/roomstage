import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const STATUSES = ['inquiry', 'in_progress', 'completed'];
const PAYMENT_STATUSES = ['unpaid', 'deposit_paid', 'paid'];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: '', title: '', price: '', notes: '', project_id: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  function loadJobs(status = '') {
    setLoading(true);
    client
      .get('/jobs', { params: status ? { status } : {} })
      .then((res) => setJobs(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadJobs();
    client.get('/clients').then((res) => setClients(res.data));
    client.get('/projects').then((res) => setProjects(res.data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await client.post('/jobs', {
        ...form,
        price: form.price ? Number(form.price) : null,
        project_id: form.project_id || null,
      });
      setForm({ client_id: '', title: '', price: '', notes: '', project_id: '' });
      setShowForm(false);
      loadJobs(statusFilter);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save job.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(job, field, value) {
    await client.put(`/jobs/${job.id}`, { [field]: value });
    loadJobs(statusFilter);
  }

  function handleFilter(status) {
    setStatusFilter(status);
    loadJobs(status);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold text-2xl">Jobs</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
          disabled={clients.length === 0}
        >
          {showForm ? 'Cancel' : '+ New job'}
        </button>
      </div>
      <div className="dim-line" />

      {clients.length === 0 && !loading && (
        <p className="text-sm text-slate mb-4">Add a client first before creating a job.</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 space-y-4 max-w-md">
          <div>
            <label className="block font-mono text-xs text-slate mb-1">CLIENT</label>
            <select
              className="input"
              required
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {projects.length > 0 && (
            <div>
              <label className="block font-mono text-xs text-slate mb-1">PROJECT (OPTIONAL)</label>
              <select
                className="input"
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              >
                <option value="">Not tied to a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block font-mono text-xs text-slate mb-1">JOB TITLE</label>
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Bedsitter room reset"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-slate mb-1">PRICE (KES)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="2000"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-slate mb-1">NOTES</label>
            <textarea
              className="input"
              rows="2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save job'}
          </button>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        {['', ...STATUSES].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => handleFilter(s)}
            className={`font-mono text-xs px-3 py-1.5 rounded-sm border transition-colors ${
              statusFilter === s
                ? 'bg-ink text-paper border-ink'
                : 'border-line text-slate hover:border-ink'
            }`}
          >
            {s ? s.replace('_', ' ') : 'all'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate text-sm">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="card p-6 text-center text-slate text-sm">No jobs match this filter.</div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-body font-medium">
                    <Link to={`/jobs/${job.id}`} className="hover:text-accent transition-colors">
                      {job.title}
                    </Link>
                  </div>
                  <div className="text-xs text-slate">{job.client_name}</div>
                </div>
                <div className="font-mono text-sm">
                  {job.price ? `KES ${Number(job.price).toLocaleString()}` : '—'}
                </div>
              </div>
              {job.notes && <p className="text-xs text-slate mt-2">{job.notes}</p>}
              <div className="flex items-center gap-2 mt-3">
                <select
                  className="font-mono text-xs px-2 py-1 rounded-sm border border-line bg-white"
                  value={job.status}
                  onChange={(e) => updateStatus(job, 'status', e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <select
                  className="font-mono text-xs px-2 py-1 rounded-sm border border-line bg-white"
                  value={job.payment_status}
                  onChange={(e) => updateStatus(job, 'payment_status', e.target.value)}
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <span className={`badge badge-${job.status} ml-auto`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
