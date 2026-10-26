export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function eligible(data, now = new Date()) {
  if (!validDate(data.publishedAt))
    throw new Error(`Invalid publication date: ${data.publishedAt}`);
  return !data.draft && data.publishedAt <= now.toISOString().slice(0, 10);
}

/**
 * @template {{ id: string, data: { publishedAt: string, draft?: boolean } }} T
 * @param {T[]} entries
 * @param {Date} [now]
 * @returns {T[]}
 */
export function latestFirst(entries, now = new Date()) {
  return entries
    .filter((entry) => eligible(entry.data, now))
    .sort(
      (a, b) =>
        b.data.publishedAt.localeCompare(a.data.publishedAt) ||
        a.id.localeCompare(b.id),
    );
}
