import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

const LEAD_STATUSES = ['new', 'contacted', 'viewing', 'won', 'lost'];
const UNIT_CATEGORIES = ['residential', 'office'];
const UNIT_STATUSES = ['draft', 'available', 'reserved', 'sold', 'let', 'off_market'];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState({
    name: '',
    category: 'residential',
    bedrooms: '',
    size_sqm: '',
    price_kes: '',
    status: 'draft',
  });
  const [unitError, setUnitError] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', source: '' });
  const [leadError, setLeadError] = useState('');
  const [savingLead, setSavingLead] = useState(false);

  const [convertingId, setConvertingId] = useState(null);
  const [convertForm, setConvertForm] = useState({ client_id: '', title: '', price: '' });
  const [convertError, setConvertError] = useState('');

  function loadProject() {
    setLoading(true);
    client
      .get(`/projects/${projectId}`)
      .then((res) => setProject(res.data))
      .catch(() => setLoadError('Could not load this project.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProject();
    client.get('/clients').then((res) => setClients(res.data));
  }, [projectId]);

  async function handleAddUnit(e) {
    e.preventDefault();
    setUnitError('');
    setSavingUnit(true);
    try {
      await client.post(`/projects/${projectId}/unit-types`, {
        ...unitForm,
        bedrooms: unitForm.bedrooms ? Number(unitForm.bedrooms) : null,
        size_sqm: unitForm.size_sqm ? Number(unitForm.size_sqm) : null,
        price_kes: unitForm.price_kes ? Number(unitForm.price_kes) : null,
      });
      setUnitForm({ name: '', category: 'residential', bedrooms: '', size_sqm: '', price_kes: '', status: 'draft' });
      setShowUnitForm(false);
      loadProject();
    } catch (err) {
      setUnitError(err.response?.data?.error || 'Could not save unit type.');
    } finally {
      setSavingUnit(false);
    }
  }

  async function handleAddLead(e) {
    e.preventDefault();
    setLeadError('');
    setSavingLead(true);
    try {
      await client.post(`/projects/${projectId}/leads`, leadForm);
      setLeadForm({ name: '', phone: '', email: '', source: '' });
      setShowLeadForm(false);
      loadProject();
    } catch (err) {
      setLeadError(err.response?.data?.error || 'Could not save lead.');
    } finally {
      setSavingLead(false);
    }
  }

  async function updateLeadStatus(leadId, status) {
    await client.put(`/leads/${leadId}`, { status });
    loadProject();
  }

  function startConvert(lead) {
    setConvertingId(lead.id);
    setConvertForm({ client_id: '', title: `${lead.name} — staging`, price: '' });
    setConvertError('');
  }

  async function handleConvert(e, leadId) {
    e.preventDefault();
    setConvertError('');
    try {
      await client.post(`/leads/${leadId}/convert`, {
        ...convertForm,
        price: convertForm.price ? Number(convertForm.price) : null,
      });
      setConvertingId(null);
      loadProject();
    } catch (err) {
      setConvertError(err.response?.data?.error || 'Could not convert this lead.');
    }
  }

  if (loading) return <p className="text-slate text-sm">Loading…</p>;
  if (loadError || !project) return <p className="text-sm text-danger">{loadError || 'Project not found.'}</p>;

  return (
    <div>
      <Link to="/projects" className="font-mono text-xs text-accent hover:underline">
        ← back to projects
      </Link>
      <div className="dim-line" />

      <h1 className="font-display font-semibold text-2xl">{project.name}</h1>
      <p className="text-sm text-slate mt-1">
        {[project.location, project.project_type].filter(Boolean).join(' · ')}
      </p>

      <h2 className="font-display font-semibold text-lg mt-8 mb-3">Unit types</h2>

      {showUnitForm && (
        <form onSubmit={handleAddUnit} className="card p-5 mb-4 space-y-4 max-w-sm">
          <div>
            <label className="block font-mono text-xs text-slate mb-1">NAME</label>
            <input
              className="input"
              required
              value={unitForm.name}
              onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
              placeholder="e.g. 2-bed Type B, Office 1260 sq ft"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-slate mb-1">CATEGORY</label>
              <select
                className="input"
                value={unitForm.category}
                onChange={(e) => setUnitForm({ ...unitForm, category: e.target.value })}
              >
                {UNIT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs text-slate mb-1">STATUS</label>
              <select
                className="input"
                value={unitForm.status}
                onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
              >
                {UNIT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          {unitForm.category === 'residential' && (
            <div>
              <label className="block font-mono text-xs text-slate mb-1">BEDROOMS</label>
              <input
                className="input"
                type="number"
                min="0"
                value={unitForm.bedrooms}
                onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-slate mb-1">SIZE (SQM)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={unitForm.size_sqm}
                onChange={(e) => setUnitForm({ ...unitForm, size_sqm: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-slate mb-1">PRICE (KES)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={unitForm.price_kes}
                onChange={(e) => setUnitForm({ ...unitForm, price_kes: e.target.value })}
              />
            </div>
          </div>
          {unitError && <p className="text-sm text-danger">{unitError}</p>}
          <button type="submit" disabled={savingUnit} className="btn-primary">
            {savingUnit ? 'Saving…' : 'Save unit type'}
          </button>
        </form>
      )}

      {!showUnitForm && (
        <button className="btn-primary mb-4" onClick={() => setShowUnitForm(true)}>
          + Add unit type
        </button>
      )}

      {project.unitTypes.length === 0 ? (
        <div className="card p-6 text-center text-slate text-sm mb-2">No unit types yet. Add one above.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 mb-2">
          {project.unitTypes.map((u) => (
            <Link
              key={u.id}
              to={`/unit-types/${u.id}`}
              className="card p-4 block hover:border-ink transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="text-sm font-body font-medium">{u.name}</div>
                <span className={`badge badge-${u.status === 'available' ? 'completed' : u.status === 'sold' || u.status === 'let' ? 'paid' : 'inquiry'}`}>
                  {u.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-slate mt-1">
                {u.category}
                {u.price_kes ? ` · KES ${Number(u.price_kes).toLocaleString()}` : ''}
              </div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="font-display font-semibold text-lg mt-8 mb-3">Leads</h2>

      {showLeadForm && (
        <form onSubmit={handleAddLead} className="card p-5 mb-4 space-y-4 max-w-sm">
          <div>
            <label className="block font-mono text-xs text-slate mb-1">NAME</label>
            <input
              className="input"
              required
              value={leadForm.name}
              onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              placeholder="Buyer or tenant name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-slate mb-1">PHONE</label>
              <input
                className="input"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                placeholder="07XX XXX XXX"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-slate mb-1">SOURCE</label>
              <input
                className="input"
                value={leadForm.source}
                onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                placeholder="e.g. Property24"
              />
            </div>
          </div>
          {leadError && <p className="text-sm text-danger">{leadError}</p>}
          <button type="submit" disabled={savingLead} className="btn-primary">
            {savingLead ? 'Saving…' : 'Save lead'}
          </button>
        </form>
      )}

      {!showLeadForm && (
        <button className="btn-primary mb-4" onClick={() => setShowLeadForm(true)}>
          + Add lead
        </button>
      )}

      {project.leads.length === 0 ? (
        <div className="card p-6 text-center text-slate text-sm">No leads yet.</div>
      ) : (
        <div className="space-y-3">
          {project.leads.map((lead) => (
            <div key={lead.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-body font-medium">{lead.name}</div>
                  <div className="text-xs text-slate">
                    {[lead.phone, lead.source].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <select
                  className="font-mono text-xs px-2 py-1 rounded-sm border border-line bg-white"
                  value={lead.status}
                  onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {convertingId === lead.id ? (
                <form onSubmit={(e) => handleConvert(e, lead.id)} className="mt-3 space-y-2 border-t border-line pt-3">
                  <select
                    className="input"
                    required
                    value={convertForm.client_id}
                    onChange={(e) => setConvertForm({ ...convertForm, client_id: e.target.value })}
                  >
                    <option value="">Select a client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    required
                    value={convertForm.title}
                    onChange={(e) => setConvertForm({ ...convertForm, title: e.target.value })}
                    placeholder="Job title"
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={convertForm.price}
                    onChange={(e) => setConvertForm({ ...convertForm, price: e.target.value })}
                    placeholder="Price (KES)"
                  />
                  {convertError && <p className="text-sm text-danger">{convertError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">
                      Convert to job
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setConvertingId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="font-mono text-xs text-accent hover:underline mt-2"
                  onClick={() => startConvert(lead)}
                >
                  convert to job →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display font-semibold text-lg mt-8 mb-3">Jobs on this project</h2>
      {project.jobs.length === 0 ? (
        <p className="text-sm text-slate">No jobs linked to this project yet.</p>
      ) : (
        <div className="card divide-y divide-line">
          {project.jobs.map((j) => (
            <Link
              key={j.id}
              to={`/jobs/${j.id}`}
              className="px-4 py-3 flex items-center justify-between block hover:bg-paper transition-colors"
            >
              <span className="text-sm">{j.title}</span>
              <span className={`badge badge-${j.status}`}>{j.status.replace('_', ' ')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
