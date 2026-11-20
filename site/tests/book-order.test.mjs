import test from 'node:test';
import assert from 'node:assert/strict';
import { chapterOrder, nextChapter } from '../src/lib/book-order.mjs';
test('all 36 chapter pairs traverse exactly the intervening leaves in order', () => {
  for (let a = 0; a < 6; a++)
    for (let b = 0; b < 6; b++) {
      let current = chapterOrder[a];
      const visited = [];
      while (current !== chapterOrder[b]) {
        current = nextChapter(current, chapterOrder[b]);
        visited.push(current);
        assert.ok(visited.length <= 5);
      }
      assert.equal(visited.length, Math.abs(b - a));
      assert.deepEqual(
        visited,
        Array.from(
          { length: Math.abs(b - a) },
          (_, i) => chapterOrder[a + (i + 1) * Math.sign(b - a)],
        ),
      );
    }
  assert.equal(nextChapter('writing', 'start'), 'work');
  assert.throws(() => nextChapter('invalid', 'start'));
});
