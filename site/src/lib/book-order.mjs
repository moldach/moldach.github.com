/** Physical leaf order, shared by HTML navigation and the WebGL controller. */
export const chapters = [
  { label: 'Start', href: '/' },
  { label: 'Services', href: '/services/' },
  { label: 'Work', href: '/work/' },
  { label: 'Writing', href: '/writing/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
];
export const chapterOrder = chapters.map((chapter) =>
  chapter.label.toLowerCase(),
);
/** One adjacent step; re-evaluated after each turn to honour the latest request. */
export function nextChapter(from, to) {
  const a = chapterOrder.indexOf(from),
    b = chapterOrder.indexOf(to);
  if (a < 0 || b < 0) throw new Error('Unknown book chapter');
  return chapterOrder[a + Math.sign(b - a)];
}
