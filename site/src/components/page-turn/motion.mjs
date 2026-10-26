export const duration = 1600;
export function clamp(value) {
  return Math.min(1, Math.max(0, value));
}
// The project's strong ease-in-out: cubic-bezier(.77, 0, .175, 1).
export function ease(value) {
  const x = clamp(value);
  let low = 0,
    high = 1,
    t = x;
  for (let i = 0; i < 12; i++) {
    const p =
      3 * (1 - t) ** 2 * t * 0.77 + 3 * (1 - t) * t * t * 0.175 + t ** 3;
    if (p < x) low = t;
    else high = t;
    t = (low + high) / 2;
  }
  return 3 * (1 - t) * t * t + t ** 3;
}
export function pose(time, lane = 0) {
  const delay = (lane % 4) * 60;
  return {
    outgoing: ease((time - delay) / (450 - delay)),
    leaf: ease((time - 350) / 800),
    incoming: ease((time - 1000 - delay) / (600 - delay)),
  };
}

// A bookmarked jump folds once, rifles the leaves, then opens the destination.
export function turnDuration(count = 1) {
  return count <= 1 ? duration : 350 + count * 220 + 450;
}
export function skipPose(time, count) {
  const end = 350 + count * 220;
  const leaves = clamp((time - 350) / (count * 220)) * count;
  const index = Math.min(count - 1, Math.floor(leaves));
  return {
    index,
    leaf: ease(leaves - index),
    outgoing: ease(time / 350),
    incoming: ease((time - end) / 450),
    turning: time >= 350 && time < end,
    cameraTime: time < 350 ? time : time < end ? 700 : 1150 + time - end,
  };
}
