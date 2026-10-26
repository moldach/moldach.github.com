import test from 'node:test';
import assert from 'node:assert/strict';
import { pose, duration } from '../src/components/page-turn/motion.mjs';
test('page-turn stages preserve fold, turn, unfold order across four stagger lanes', () => {
  assert.equal(duration, 1600);
  for (let lane = 0; lane < 4; lane++) {
    assert.ok(pose(0, lane).outgoing < 0.001);
    assert.ok(pose(450, lane).outgoing > 0.999);
    assert.ok(pose(350, lane).leaf < 0.001);
    assert.ok(pose(1150, lane).leaf > 0.999);
    assert.ok(pose(1000, lane).incoming < 0.001);
    assert.ok(pose(1600, lane).incoming > 0.999);
  }
});
test('page-turn progress stays finite, bounded and monotonic', () => {
  for (let lane = 0; lane < 4; lane++) {
    let prev = pose(-100, lane);
    for (let t = 0; t <= 1800; t += 10) {
      let next = pose(t, lane);
      for (const key of ['outgoing', 'leaf', 'incoming']) {
        assert.ok(
          Number.isFinite(next[key]) && next[key] >= 0 && next[key] <= 1,
        );
        assert.ok(next[key] >= prev[key]);
      }
      prev = next;
    }
  }
});

test('bookmark jumps rifle leaves without unfolding intermediate chapters', async () => {
  const { skipPose, turnDuration } =
    await import('../src/components/page-turn/motion.mjs');
  assert.equal(turnDuration(1), 1600);
  assert.equal(turnDuration(5), 1900);
  for (let count = 2; count <= 5; count++) {
    for (let i = 0; i < count; i++) {
      const p = skipPose(350 + i * 220 + 110, count);
      assert.equal(p.index, i);
      assert.equal(p.turning, true);
      assert.ok(p.outgoing > 0.999);
      assert.equal(p.incoming, 0);
    }
    assert.ok(skipPose(turnDuration(count), count).incoming > 0.999);
  }
});
