import { books, type Book } from "@/data/books";

// Arabic-aware normalization: strip diacritics, unify alif/ya/ta marbuta,
// remove tatweel, lowercase, and collapse whitespace.
const DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;
export function normalize(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // latin diacritics
    .replace(DIACRITICS, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface IndexEntry {
  book: Book;
  title: string;
  author: string;
  description: string;
  category: string;
}

let cachedIndex: IndexEntry[] | null = null;
function getIndex(): IndexEntry[] {
  if (cachedIndex) return cachedIndex;
  cachedIndex = books.map((b) => ({
    book: b,
    title: normalize(b.title),
    author: normalize(b.author),
    description: normalize(b.description),
    category: normalize(b.category),
  }));
  return cachedIndex;
}

/**
 * Smart search:
 *  - Splits query into tokens; every token must match somewhere (AND).
 *  - Scores by where it matches: title > author > description/category.
 *  - Bonus for prefix / whole-word / exact title match.
 *  - Returns books sorted by score (desc), then original order.
 */
export function searchBooks(rawQuery: string): Book[] {
  const q = normalize(rawQuery);
  if (!q) return books;
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length === 0) return books;

  const idx = getIndex();
  const results: { book: Book; score: number; pos: number }[] = [];

  for (let i = 0; i < idx.length; i++) {
    const e = idx[i];
    let total = 0;
    let allMatch = true;

    for (const t of tokens) {
      let s = 0;
      if (e.title === t) s += 200;
      else if (e.title.startsWith(t)) s += 80;
      else if (e.title.includes(` ${t}`)) s += 60;
      else if (e.title.includes(t)) s += 40;

      if (e.author.startsWith(t)) s += 35;
      else if (e.author.includes(t)) s += 20;

      if (e.description.includes(t)) s += 6;
      if (e.category.includes(t)) s += 4;

      if (s === 0) {
        allMatch = false;
        break;
      }
      total += s;
    }

    if (allMatch) results.push({ book: e.book, score: total, pos: i });
  }

  results.sort((a, b) => b.score - a.score || a.pos - b.pos);
  return results.map((r) => r.book);
}
