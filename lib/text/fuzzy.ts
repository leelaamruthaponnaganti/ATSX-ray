export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

export function stem(token: string): string {
  return token
    .replace(/(ing|edly|ed|ies|es|s)$/g, "")
    .replace(/(tion|ations)$/g, "")
    .trim();
}

export function stemsMatch(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4) return false;
  const sa = stem(a);
  const sb = stem(b);
  return sa.length >= 3 && sb.length >= 3 && (sa === sb || similarity(sa, sb) >= 0.88);
}
