import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

const STATUSES = ['draft', 'available', 'reserved', 'sold', 'let', 'off_market'];
const PHOTO_KINDS = ['before', 'after', 'listing', 'plan'];

export default function UnitTypeDetail() {
  const { unitTypeId } = useParams();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', width_cm: '', length_cm: '' });
  const [roomError, setRoomError] = useState('');
  const [savingRoom, setSavingRoom] = useState(false);

  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoForm, setPhotoForm] = useState({ url: '', kind: 'plan', caption: '' });
  const [photoError, setPhotoError] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPack, setCopiedPack] = useState(false);

  function loadUnit() {
    setLoading(true);
    client
      .get(`/unit-types/${unitTypeId}`)
      .then((res) => setUnit(res.data))
      .catch(() => setLoadError('Could not load this unit type.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUnit();
  }, [unitTypeId]);

  async function updateStatus(status) {
    await client.put(`/unit-types/${unitTypeId}`, { status });
    loadUnit();
  }

  async function handleAddRoom(e) {
    e.preventDefault();
    setRoomError('');
    setSavingRoom(true);
    try {
      await client.post(`/unit-types/${unitTypeId}/rooms`, {
        name: roomForm.name || null,
        width_cm: Number(roomForm.width_cm),
        length_cm: Number(roomForm.length_cm),
      });
      setRoomForm({ name: '', width_cm: '', length_cm: '' });
      setShowRoomForm(false);
      loadUnit();
    } catch (err) {
      setRoomError(err.response?.data?.error || 'Could not add room.');
    } finally {
      setSavingRoom(false);
    }
  }

  async function handleAddPhoto(e) {
    e.preventDefault();
    setPhotoError('');
    setSavingPhoto(true);
    try {
      await client.post(`/unit-types/${unitTypeId}/photos`, photoForm);
      setPhotoForm({ url: '', kind: 'plan', caption: '' });
      setShowPhotoForm(false);
      loadUnit();
    } catch (err) {
      setPhotoError(err.response?.data?.error || 'Could not add photo.');
    } finally {
      setSavingPhoto(false);
    }
  }

  async function handleDeletePhoto(photoId) {
    await client.delete(`/photos/${photoId}`);
    loadUnit();
  }

  function publicLink() {
    return `${window.location.origin}/s/${unit.public_slug}`;
  }

  async function copyPublicLink() {
    await navigator.clipboard.writeText(publicLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function buildListingPack() {
    const lines = [];
    const header = [unit.name, unit.project_name].filter(Boolean).join(' — ');
    lines.push(header);
    if (unit.project_location) lines.push(unit.project_location);

    const specs = [
      unit.category,
      unit.bedrooms ? `${unit.bedrooms} bed` : null,
      unit.size_sqm ? `${unit.size_sqm} sqm` : null,
      unit.size_sqft ? `${unit.size_sqft} sqft` : null,
    ].filter(Boolean).join(' · ');
    if (specs) lines.push(specs);
    if (unit.price_kes) lines.push(`KES ${Number(unit.price_kes).toLocaleString()}`);
    lines.push(`Status: ${unit.status.replace('_', ' ')}`);
    lines.push('');

    if (unit.rooms.length > 0) {
      lines.push('Rooms:');
      unit.rooms.forEach((r) => {
        lines.push(`- ${r.name || 'Room'}: ${(r.width_cm / 100).toFixed(1)}m x ${(r.length_cm / 100).toFixed(1)}m`);
      });
      lines.push('');
    }

    if (unit.photos.length > 0) {
      lines.push('Photos:');
      unit.photos.forEach((p) => lines.push(p.url));
      lines.push('');
    }

    lines.push(`View full show suite: ${publicLink()}`);
    return lines.join('\n');
  }

  async function copyListingPack() {
    await navigator.clipboard.writeText(buildListingPack());
    setCopiedPack(true);
    setTimeout(() => setCopiedPack(false), 2000);
  }

  if (loading) return <p className="text-slate text-sm">Loading…</p>;
  if (loadError || !unit) return <p className="text-sm text-danger">{loadError || 'Unit type not found.'}</p>;

  return (
    <div>
      <Link to={`/projects/${unit.project_id}`} className="font-mono text-xs text-accent hover:underline">
        ← back to project
      </Link>
      <div className="dim-line" />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl">{unit.name}</h1>
          <p className="text-sm text-slate mt-1">
            {unit.category}
            {unit.bedrooms ? ` · ${unit.bedrooms} bed` : ''}
            {unit.size_sqm ? ` · ${unit.size_sqm} sqm` : ''}
            {unit.size_sqft ? ` · ${unit.size_sqft} sqft` : ''}
          </p>
        </div>
        <select
          className="font-mono text-xs px-2 py-1 rounded-sm border border-line bg-white h-fit"
          value={unit.status}
          onChange={(e) => updateStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {unit.price_kes && (
        <p className="font-mono text-lg mt-3">KES {Number(unit.price_kes).toLocaleString()}</p>
      )}
      {unit.notes && <p className="text-sm text-slate mt-3">{unit.notes}</p>}

      <div className="card p-4 mt-6">
        <p className="font-mono text-xs text-slate">PUBLIC SHOW-SUITE LINK</p>
        <p className="text-sm mt-1 break-all">/s/{unit.public_slug}</p>
        <div className="flex gap-2 mt-3">
          <button className="btn-secondary" onClick={copyPublicLink}>
            {copiedLink ? 'Copied!' : 'Copy public link'}
          </button>
          <button className="btn-secondary" onClick={copyListingPack}>
            {copiedPack ? 'Copied!' : 'Copy listing pack'}
          </button>
        </div>
      </div>

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
                placeholder="520"
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
                placeholder="420"
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

      {unit.rooms.length === 0 ? (
        <div className="card p-6 text-center text-slate text-sm mb-2">
          No rooms yet. Add one above to start the floor plan.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 mb-2">
          {unit.rooms.map((room) => (
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

      <h2 className="font-display font-semibold text-lg mt-8 mb-3">Photos</h2>

      {showPhotoForm && (
        <form onSubmit={handleAddPhoto} className="card p-5 mb-4 space-y-4 max-w-md">
          <div>
            <label className="block font-mono text-xs text-slate mb-1">IMAGE URL</label>
            <input
              className="input"
              type="url"
              required
              value={photoForm.url}
              onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-slate mb-1">KIND</label>
              <select
                className="input"
                value={photoForm.kind}
                onChange={(e) => setPhotoForm({ ...photoForm, kind: e.target.value })}
              >
                {PHOTO_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs text-slate mb-1">CAPTION (OPTIONAL)</label>
              <input
                className="input"
                value={photoForm.caption}
                onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
              />
            </div>
          </div>
          {photoError && <p className="text-sm text-danger">{photoError}</p>}
          <button type="submit" disabled={savingPhoto} className="btn-primary">
            {savingPhoto ? 'Saving…' : 'Add photo'}
          </button>
        </form>
      )}

      {!showPhotoForm && (
        <button className="btn-primary mb-4" onClick={() => setShowPhotoForm(true)}>
          + Add photo
        </button>
      )}

      {unit.photos.length === 0 ? (
        <div className="card p-6 text-center text-slate text-sm">No photos yet.</div>
      ) : (
        <div className="card divide-y divide-line">
          {unit.photos.map((photo) => (
            <div key={photo.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent hover:underline truncate block"
                >
                  {photo.url}
                </a>
                <div className="text-xs text-slate mt-0.5">
                  {photo.kind}
                  {photo.caption ? ` · ${photo.caption}` : ''}
                </div>
              </div>
              <button
                className="font-mono text-xs text-danger hover:underline shrink-0"
                onClick={() => handleDeletePhoto(photo.id)}
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
