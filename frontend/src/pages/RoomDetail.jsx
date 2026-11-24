import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import RoomCanvas from '../components/RoomCanvas';

export default function RoomDetail() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [furniture, setFurniture] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [addingId, setAddingId] = useState(null);

  function loadAll() {
    setLoading(true);
    Promise.all([
      client.get(`/rooms/${roomId}`),
      client.get(`/rooms/${roomId}/furniture`),
      client.get('/furniture-items'),
    ])
      .then(([roomRes, furnitureRes, catalogRes]) => {
        setRoom(roomRes.data);
        setFurniture(furnitureRes.data);
        setCatalog(catalogRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
    setSelectedId(null);
  }, [roomId]);

  async function handleAddPiece(item) {
    if (!room) return;
    setAddingId(item.id);
    try {
      const res = await client.post(`/rooms/${roomId}/furniture`, {
        furniture_item_id: item.id,
        x_position: Math.round(room.width_cm / 2),
        y_position: Math.round(room.length_cm / 2),
        rotation: 0,
      });
      setFurniture((prev) => [
        ...prev,
        { ...res.data, name: item.name, width_cm: item.width_cm, depth_cm: item.depth_cm, category: item.category },
      ]);
      setSelectedId(res.data.id);
    } finally {
      setAddingId(null);
    }
  }

  async function handleMove(pieceId, x, y) {
    setFurniture((prev) => prev.map((p) => (p.id === pieceId ? { ...p, x_position: x, y_position: y } : p)));
    await client.put(`/room-furniture/${pieceId}`, { x_position: x, y_position: y });
  }

  async function handleRotate(pieceId) {
    const piece = furniture.find((p) => p.id === pieceId);
    if (!piece) return;
    const nextRotation = (piece.rotation + 90) % 360;
    setFurniture((prev) => prev.map((p) => (p.id === pieceId ? { ...p, rotation: nextRotation } : p)));
    await client.put(`/room-furniture/${pieceId}`, { rotation: nextRotation });
  }

  async function handleDelete(pieceId) {
    setFurniture((prev) => prev.filter((p) => p.id !== pieceId));
    setSelectedId(null);
    await client.delete(`/room-furniture/${pieceId}`);
  }

  if (loading) return <p className="text-slate text-sm">Loading…</p>;
  if (!room) return <p className="text-sm text-danger">Room not found.</p>;

  const selectedPiece = furniture.find((p) => p.id === selectedId);
  const backTo = room.job_id ? `/jobs/${room.job_id}` : `/unit-types/${room.unit_type_id}`;

  return (
    <div>
      <Link to={backTo} className="font-mono text-xs text-accent hover:underline">
        ← back
      </Link>
      <div className="dim-line" />

      <h1 className="font-display font-semibold text-2xl">{room.name || 'Unnamed room'}</h1>
      <p className="text-sm text-slate mt-1">
        {(room.width_cm / 100).toFixed(1)} × {(room.length_cm / 100).toFixed(1)} m
        <span className="text-line mx-2">·</span>
        drag to move, click to select, then rotate or remove
      </p>

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="card p-3 inline-block max-w-full overflow-auto">
            <RoomCanvas
              room={room}
              furniture={furniture}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={handleMove}
            />
          </div>

          <div className="h-10 mt-3 flex items-center gap-2">
            {selectedPiece ? (
              <>
                <span className="text-sm font-body">{selectedPiece.name} selected</span>
                <button className="btn-secondary py-1" onClick={() => handleRotate(selectedPiece.id)}>
                  Rotate 90°
                </button>
                <button
                  className="btn-secondary py-1 border-danger text-danger"
                  onClick={() => handleDelete(selectedPiece.id)}
                >
                  Remove
                </button>
              </>
            ) : (
              <span className="text-xs text-slate">Nothing selected</span>
            )}
          </div>
        </div>

        <div className="lg:w-60 shrink-0">
          <h2 className="font-display font-semibold text-sm mb-3">Catalog — tap to add</h2>
          {catalog.length === 0 ? (
            <p className="text-sm text-slate">No catalog items yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddPiece(item)}
                  disabled={addingId === item.id}
                  className="text-left text-xs font-mono px-2 py-2 border border-line rounded-sm
                             hover:border-ink transition-colors bg-white disabled:opacity-50"
                >
                  {addingId === item.id ? 'Adding…' : item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
