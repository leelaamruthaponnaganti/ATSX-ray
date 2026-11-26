import { canonicalFor } from "../text/synonyms";
import { tokenize } from "../text/tokenize";

function fold(tokens: string[]): string[] {
  return tokens.map((token) => canonicalFor(token) ?? token).filter(Boolean);
}

/** Cosine similarity of two TF-IDF vectors (the JD and the resume). */
export function cosineSimilarity(documentA: string, documentB: string): number {
  const docs = [fold(tokenize(documentA)), fold(tokenize(documentB))];
  // Project onto the JD vocabulary: ATS alignment is about how much of the
  // job's language the resume covers, not how many unrelated words it contains.
  const vocabulary = new Set(docs[0]);
  if (vocabulary.size === 0) return 0;

  const documentFrequency = new Map<string, number>();
  for (const doc of docs) {
    for (const term of new Set(doc)) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  const vectors = docs.map((doc) => {
    const termFrequency = new Map<string, number>();
    for (const term of doc) termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);
    const vector = new Map<string, number>();
    for (const [term, frequency] of termFrequency) {
      const idf = Math.log((1 + docs.length) / (1 + (documentFrequency.get(term) ?? 0))) + 1;
      vector.set(term, (1 + Math.log(frequency)) * idf);
    }
    return vector;
  });

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const term of vocabulary) {
    const a = vectors[0].get(term) ?? 0;
    const b = vectors[1].get(term) ?? 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB)));
}
