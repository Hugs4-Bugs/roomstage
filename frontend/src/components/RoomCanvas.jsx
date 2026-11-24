import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';

const GRID_CM = 10;
const MAX_CANVAS_WIDTH = 560;
const MAX_CANVAS_HEIGHT = 420;

const COLORS = {
  ink: '#1B2A4A',
  accent: '#E8871E',
  slate: '#6B7A8F',
  line: '#D8D4C8',
  pieceFill: 'rgba(63, 83, 68, 0.18)',
  pieceStroke: '#3F5344',
  selectedFill: 'rgba(232, 135, 30, 0.22)',
};

function computeScale(widthCm, lengthCm) {
  const scale = Math.min(MAX_CANVAS_WIDTH / widthCm, MAX_CANVAS_HEIGHT / lengthCm, 3);
  return Math.max(scale, 0.3);
}

export default function RoomCanvas({ room, furniture, selectedId, onSelect = () => {}, onMove, readOnly = false }) {
  const scale = computeScale(room.width_cm, room.length_cm);
  const canvasWidth = room.width_cm * scale;
  const canvasHeight = room.length_cm * scale;

  function handleDragEnd(piece, e) {
    const node = e.target;
    const rawXCm = node.x() / scale;
    const rawYCm = node.y() / scale;
    const snappedX = Math.round(rawXCm / GRID_CM) * GRID_CM;
    const snappedY = Math.round(rawYCm / GRID_CM) * GRID_CM;
    node.position({ x: snappedX * scale, y: snappedY * scale });
    onMove(piece.id, snappedX, snappedY);
  }

  const gridLines = [];
  for (let x = 0; x <= room.width_cm; x += GRID_CM * 2) {
    gridLines.push(
      <Line key={`v${x}`} points={[x * scale, 0, x * scale, canvasHeight]} stroke={COLORS.line} strokeWidth={1} />
    );
  }
  for (let y = 0; y <= room.length_cm; y += GRID_CM * 2) {
    gridLines.push(
      <Line key={`h${y}`} points={[0, y * scale, canvasWidth, y * scale]} stroke={COLORS.line} strokeWidth={1} />
    );
  }

  return (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      <Layer>
        <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#FFFFFF" stroke={COLORS.ink} strokeWidth={2} />
        {gridLines}
        {furniture.map((piece) => {
          const w = piece.width_cm * scale;
          const h = piece.depth_cm * scale;
          const isSelected = piece.id === selectedId;
          return (
            <Group
              key={piece.id}
              x={piece.x_position * scale}
              y={piece.y_position * scale}
              rotation={piece.rotation}
              draggable={!readOnly}
              onClick={() => onSelect(piece.id)}
              onTap={() => onSelect(piece.id)}
              onDragEnd={readOnly ? undefined : (e) => handleDragEnd(piece, e)}
            >
              <Rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                fill={isSelected ? COLORS.selectedFill : COLORS.pieceFill}
                stroke={isSelected ? COLORS.accent : COLORS.pieceStroke}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={3}
              />
              <Text
                x={-w / 2}
                y={-5}
                width={w}
                align="center"
                text={piece.name}
                fontSize={11}
                fontFamily="IBM Plex Mono"
                fill={COLORS.ink}
                listening={false}
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
