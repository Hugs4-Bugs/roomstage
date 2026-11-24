import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', width_cm: '', length_cm: '' });
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');

  function loadJob() {
    setLoading(true);
    client
      .get(`/jobs/${jobId}`)
      .then((res) => setJob(res.data))
      .catch(() => setLoadError('Could not load this job.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadJob();
  }, [jobId]);

  async function handleAddRoom(e) {
    e.preventDefault();
    setRoomError('');
    setSavingRoom(true);
    try {
      await client.post(`/jobs/${jobId}/rooms`, {
        name: roomForm.name || null,
        width_cm: Number(roomForm.width_cm),
        length_cm: Number(roomForm.length_cm),
      });
      setRoomForm({ name: '', width_cm: '', length_cm: '' });
      setShowRoomForm(false);
      loadJob();
    } catch (err) {
      setRoomError(err.response?.data?.error || 'Could not add room.');
    } finally {
      setSavingRoom(false);
    }
  }

  if (loading) return <p className="text-slate text-sm">Loading…</p>;
  if (loadError || !job) return <p className="text-sm text-danger">{loadError || 'Job not found.'}</p>;

  return (
    <div>
      <Link to="/jobs" className="font-mono text-xs text-accent hover:underline">
        ← back to jobs
      </Link>
      <div className="dim-line" />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl">{job.title}</h1>
          <p className="text-sm text-slate">
            {job.client_name}
            {job.client_phone ? ` · ${job.client_phone}` : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm">
            {job.price ? `KES ${Number(job.price).toLocaleString()}` : '—'}
          </div>
          <span className={`badge badge-${job.status}`}>{job.status.replace('_', ' ')}</span>
        </div>
      </div>
      {job.notes && <p className="text-sm text-slate mt-3">{job.notes}</p>}

      <h2 className="font-display font-semibold text-lg mt-8 mb-3">Rooms</h2>

      {showRoomForm && (
        <form onSubmit={handleAddRoom} className="card p-5 mb-4 space-y-4 max-w-sm">
          <div>
            <label className="block font-mono text-xs text-slate mb-1">ROOM NAME</label>
            <input
              className="input"
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              placeholder="e.g. Living room"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-slate mb-1">WIDTH (CM)</label>
              <input
                className="input"
                type="number"
                min="1"
                required
                value={roomForm.width_cm}
                onChange={(e) => setRoomForm({ ...roomForm, width_cm: e.target.value })}
                placeholder="320"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-slate mb-1">LENGTH (CM)</label>
              <input
                className="input"
                type="number"
                min="1"
                required
                value={roomForm.length_cm}
                onChange={(e) => setRoomForm({ ...roomForm, length_cm: e.target.value })}
                placeholder="410"
              />
            </div>
          </div>
          {roomError && <p className="text-sm text-danger">{roomError}</p>}
          <button type="submit" disabled={savingRoom} className="btn-primary">
            {savingRoom ? 'Saving…' : 'Add room'}
          </button>
        </form>
      )}

      {!showRoomForm && (
        <button className="btn-primary mb-4" onClick={() => setShowRoomForm(true)}>
          + Add room
        </button>
      )}

      {job.rooms.length === 0 ? (
        <div className="card p-6 text-center text-slate text-sm">
          No rooms yet. Add one above to start the floor plan.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {job.rooms.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="card p-4 block hover:border-ink transition-colors"
            >
              <div className="text-sm font-body font-medium">{room.name || 'Unnamed room'}</div>
              <div className="text-xs text-slate mt-1">
                {(room.width_cm / 100).toFixed(1)} × {(room.length_cm / 100).toFixed(1)} m
              </div>
              <div className="font-mono text-xs text-accent mt-2">
                {room.furniture.length} piece{room.furniture.length === 1 ? '' : 's'} placed →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
