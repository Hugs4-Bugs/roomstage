import assert from 'node:assert/strict';
import { scoreLayout } from './layoutScore.js';

const room = { width_cm: 400, length_cm: 400 };
const bed = (id, x, y, rot = 0) => ({ id, name: 'Bed', width_cm: 160, depth_cm: 200, x_position: x, y_position: y, rotation: rot });
const sofa = (id, x, y) => ({ id, name: 'Sofa', width_cm: 200, depth_cm: 90, x_position: x, y_position: y, rotation: 0 });

let r = scoreLayout(room, []);
assert.equal(r.score, 100);

r = scoreLayout(room, [bed(1, 200, 200)]);
assert.ok(r.score >= 80, 'single centred bed should score well, got ' + r.score);

r = scoreLayout(room, [bed(1, 200, 200), sofa(2, 200, 200)]);
assert.ok(r.flagged.includes(1) && r.flagged.includes(2), 'overlap flagged');
assert.ok(r.score < 85);

r = scoreLayout(room, [bed(1, 50, 200)]);
assert.ok(r.flagged.includes(1), 'out-of-bounds flagged');

// Rotation swaps footprint: a 90° bed at x=100 spans 0..200 wide -> fits; at x=90 it pokes out.
assert.equal(scoreLayout(room, [bed(1, 100, 200, 90)]).flagged.length, 0);
assert.equal(scoreLayout(room, [bed(1, 90, 200, 90)]).flagged.length, 1);

// A wall of furniture across the room cuts it in two -> worse than the same pieces pushed aside.
const wall = [sofa(1, 100, 200), sofa(2, 300, 200)];
const aside = [sofa(1, 100, 50), sofa(2, 300, 50)];
assert.ok(scoreLayout(room, wall).score < scoreLayout(room, aside).score, 'blocking layout scores lower');

r = scoreLayout({ width_cm: 0, length_cm: 0 }, []);
assert.equal(r.score, null);
console.log('layoutScore: all tests passed');
