/** Stable for the lifetime of a canvas, with no UA or model-name guesses. */
export function finishTier({ width, coarse, memory }) {
  return width <= 768 || coarse || (typeof memory === 'number' && memory <= 4)
    ? 'compact'
    : 'enhanced';
}

export const finishStudio = {
  exposure: 1.05,
  environmentIntensity: 0.32,
  key: 3.5,
  fill: 0.9,
  rim: 1.1,
};
