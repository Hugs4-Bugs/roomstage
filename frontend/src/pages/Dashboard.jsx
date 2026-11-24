import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');

  function load() {
    setLoading(true);
    client
      .get('/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSeed() {
    setSeedError('');
    setSeeding(true);
    try {
      await client.post('/sample-data/seed');
      load();
    } catch (err) {
      setSeedError(err.response?.data?.error || 'Could not load sample data.');
    } finally {
      setSeeding(false);
    }
  }

  if (loading || !data) return <p className="text-slate text-sm">Loading…</p>;

  const { stats, recentJobs, recentLeads } = data;
  const isEmpty = recentJobs.length === 0 && recentLeads.length === 0;

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Hi, {user?.name?.split(' ')[0]}</h1>
      <div className="dim-line" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <div className="card p-4">
          <div className="font-mono text-xs text-slate">ACTIVE JOBS</div>
          <div className="font-display text-2xl mt-1">{stats.activeJobs}</div>
        </div>
        <div className="card p-4">
          <div className="font-mono text-xs text-slate">OPEN LEADS</div>
          <div className="font-display text-2xl mt-1">{stats.openLeads}</div>
        </div>
        <div className="card p-4">
          <div className="font-mono text-xs text-slate">OWED (KES)</div>
          <div className="font-display text-2xl mt-1">{stats.owedKes.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="font-mono text-xs text-slate">AVAILABLE UNITS</div>
          <div className="font-display text-2xl mt-1">{stats.availableUnitTypes}</div>
        </div>
        <div className="card p-4">
          <div className="font-mono text-xs text-slate">COMPLETED</div>
          <div className="font-display text-2xl mt-1">{stats.completedJobs}</div>
        </div>
      </div>

      {isEmpty ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate mb-4">
            Nothing here yet. Load a sample studio to see how everything fits together, or start from a real client
            or project using the sidebar.
          </p>
          <button className="btn-primary" onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Loading…' : 'Load sample studio'}
          </button>
          {seedError && <p className="text-sm text-danger mt-3">{seedError}</p>}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-display font-semibold text-lg mb-3">Recent jobs</h2>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-slate">No jobs yet.</p>
            ) : (
              <div className="card divide-y divide-line">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="px-4 py-3 flex items-center justify-between block hover:bg-paper transition-colors"
                  >
                    <div>
                      <div className="text-sm font-body">{job.title}</div>
                      <div className="text-xs text-slate">{job.client_name}</div>
                    </div>
                    <span className={`badge badge-${job.status}`}>{job.status.replace('_', ' ')}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg mb-3">Recent leads</h2>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-slate">No leads yet.</p>
            ) : (
              <div className="card divide-y divide-line">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-body">{lead.name}</div>
                      <div className="text-xs text-slate">{lead.project_name}</div>
                    </div>
                    <span className="badge badge-inquiry">{lead.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
