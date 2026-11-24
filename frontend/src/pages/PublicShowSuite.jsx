import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RoomCanvas from '../components/RoomCanvas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function waLinkFor(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '').replace(/^0/, '254');
  return `https://wa.me/${digits}`;
}

export default function PublicShowSuite() {
  const { slug } = useParams();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`${API_URL}/api/public/unit-types/${slug}`)
      .then((res) => setUnit(res.data))
      .catch(() => setError('This show suite could not be found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-slate text-sm">Loading…</p>
      </div>
    );
  }
  if (error || !unit) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  const waLink = waLinkFor(unit.project?.contact_phone);
  const statusBadgeClass =
    unit.status === 'available'
      ? 'badge-completed'
      : unit.status === 'sold' || unit.status === 'let'
        ? 'badge-paid'
        : 'badge-inquiry';

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-paper px-6 py-8 grid-texture">
        <p className="font-mono text-xs text-paper/60 uppercase tracking-wide">
          {unit.project?.name}
          {unit.project?.location ? ` · ${unit.project.location}` : ''}
        </p>
        <h1 className="font-display font-semibold text-3xl mt-2">{unit.name}</h1>
        <p className="text-sm text-paper/80 mt-2">
          {unit.category}
          {unit.bedrooms ? ` · ${unit.bedrooms} bed` : ''}
          {unit.size_sqm ? ` · ${unit.size_sqm} sqm` : ''}
          {unit.size_sqft ? ` · ${unit.size_sqft} sqft` : ''}
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            {unit.price_kes && <p className="font-mono text-2xl">KES {Number(unit.price_kes).toLocaleString()}</p>}
            <span className={`badge ${statusBadgeClass} mt-1`}>{unit.status.replace('_', ' ')}</span>
          </div>
          <div className="flex gap-2">
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-primary">
                WhatsApp
              </a>
            )}
            {unit.project?.contact_email && (
              <a href={`mailto:${unit.project.contact_email}`} className="btn-secondary">
                Email
              </a>
            )}
          </div>
        </div>

        {unit.photos.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-semibold text-lg mb-3">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {unit.photos.map((photo, i) => (
                <a
                  key={i}
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="card overflow-hidden block"
                >
                  <img src={photo.url} alt={photo.caption || photo.kind} className="w-full h-32 object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {unit.rooms.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-lg mb-3">Floor plan</h2>
            {unit.rooms.map((room) => (
              <div key={room.id} className="mb-6">
                <p className="text-sm font-body mb-2">
                  {room.name || 'Room'} — {(room.width_cm / 100).toFixed(1)} × {(room.length_cm / 100).toFixed(1)} m
                </p>
                <div className="card p-3 inline-block max-w-full overflow-auto">
                  <RoomCanvas room={room} furniture={room.furniture} readOnly />
                </div>
              </div>
            ))}
          </div>
        )}

        {unit.rooms.length === 0 && unit.photos.length === 0 && (
          <p className="text-sm text-slate">No photos or floor plan added yet.</p>
        )}
      </main>
    </div>
  );
}
