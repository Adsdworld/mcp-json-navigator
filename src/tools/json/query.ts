import { fuzzy } from "fast-fuzzy";

/**
 * Summary
 *  → Tokenize keys and values
 *  → generate shorter tokens using grams
 *  → store tokens in an inverted index with their JSON paths  Map<string, []<path, weight>>
 *  → fuzzy-match query tokens
 *  → score by similarity + weight + frequency
 *  → group results by JSON branch
 *  → return highest-scoring paths.
 *
 * 1) Tokenization
 * convert text to lowercase
 * split into alphanumeric words
 * also generate short overlapping substrings (“grams”) to allow partial / fuzzy matches
 * (e.g., "mcdonalds" → "mcdonalds", "mc", "mcd", "cdon", ...)
 * Each produced token is stored in an inverted index:
 * token → list of { path, weight }
 * path = the full JSON access path (brands.fast_food.items[2].name)
 * weight = importance (keys get higher weight than values)
 *
 * 2) Query Phase
 * The query text is tokenized the same way.
 * For each query token, the index returns all candidate (path, weight) entries.
 * A fuzzy similarity score is computed between the query token and the indexed token using fast-fuzzy.
 * Scores are accumulated per path, increasing when:
 * the same region matches multiple tokens
 * the token was originally in a key (higher weight)
 * the similarity is high
 * Return a fixed number of results
 *
 * 3) Result Grouping
 * Paths that belong to the same structural branch of the JSON (e.g., x.y.z[3].name, x.y.z[3].address) are grouped together.
 * Groups with more hits and deeper (more specific) paths get higher final scores.
 * The search finally returns the top scoring representative paths.
 * Final One-Line Summary (Precise)
 */

export interface SearchResult {
    path: string;
    score: number;
}

export type Posting = { path: string; weight: number };
export type InvertedIndex = Map<string, Posting[]>;

function normalize(text: string): string {
    return text
        // Split lower→Upper: fooBar → foo Bar
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        // Split acronym→word: HTMLFile → HTML File
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        // Replace snake_case, kebab-case, dotted.name
        .replace(/[_\-.]+/g, " ")
        .toLowerCase();
}


function tokenize(text: string): string[] {
    if (!text) return [];

    text = normalize(text);

    // Extract tokens
    const baseTokens = text.match(/[a-z0-9]+/g) ?? [];

    const out = new Set<string>();

    for (const token of baseTokens) {
        out.add(token); // always keep base word

        // Generate 3–5 char n-grams for fuzzy matching
        for (let size = 3; size <= 5; size++) {
            if (token.length <= size) continue;
            for (let i = 0; i <= token.length - size; i++) {
                out.add(token.slice(i, i + size));
            }
        }
    }

    return [...out];
}

export function buildInvertedIndex(data: any): InvertedIndex {
    const index: InvertedIndex = new Map();

    function add(token: string, path: string, weight = 1) {
        token = token.toLowerCase();
        if (!index.has(token)) index.set(token, []);
        index.get(token)!.push({ path, weight });
    }

    function walk(node: any, prefix: string) {
        if (typeof node === "string") {
            for (const t of tokenize(node)) add(t, prefix, 1);
            return;
        }

        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                const next = prefix ? `${prefix}[${i}]` : `[${i}]`;
                walk(node[i], next);
            }
            return;
        }

        if (node && typeof node === "object") {
            for (const key in node) {
                const next = prefix ? `${prefix}.${key}` : key;
                for (const t of tokenize(key)) add(t, next, 2);
                walk(node[key], next);
            }
        }
    }

    walk(data, "");
    return index;
}

export function queryIndex(index: InvertedIndex, query: string, limit: number) {
    const tokens = tokenize(query);
    const qLower = query.toLowerCase();
    const scores = new Map<string, number>();

    for (const token of tokens) {
        const postings = index.get(token);
        if (!postings) continue;
        const sim = fuzzy(token, qLower);
        for (const { path, weight } of postings) {
            scores.set(path, (scores.get(path) || 0) + weight * sim);
        }
    }

    return [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([path, score]) => ({ path, score }));
}

function groupKey(path: string): string {
    const parts = path.split(".");
    const res: string[] = [];
    for (const p of parts) {
        res.push(p);
        if (/\[\d+\]$/.test(p)) break;
    }
    return res.join(".");
}

function finalizeGrouping(
    results: { path: string; score: number }[],
    limit: number
): SearchResult[] {

    const groups = new Map<
        string,
        { representative: string; freq: number; depth: number; }
    >();

    for (const r of results) {
        const key = groupKey(r.path);
        const depth = key.split(".").length;

        if (!groups.has(key)) {
            groups.set(key, {
                representative: r.path,
                freq: 0,
                depth,
            });
        }

        const g = groups.get(key)!;
        g.freq++;
    }

    return [...groups.entries()]
        .map(([gKey, g]) => {
            const groupScore = g.freq * g.depth;
            const isSingle = g.freq === 1;

            return {
                path: isSingle ? g.representative : gKey,
                score: groupScore,
            } as SearchResult;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

export function query(data: any, text: string, limit: number): SearchResult[] {
    const index = buildInvertedIndex(data);
    const raw = queryIndex(index, text, limit * 5);
    return finalizeGrouping(raw, limit);
}
