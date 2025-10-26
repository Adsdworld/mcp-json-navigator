import fs from "fs";
import path from "path";
import { explore } from "./explore.js";
import { simplify } from "./simplify.js";
import { query } from "./query.js";
import { contains } from "./contains.js";

export function loadJson(filepath: string) {
    const abs = path.resolve(filepath);
    return JSON.parse(fs.readFileSync(abs, "utf8"));
}

/**
 * Explore tool implementation
 */
export function exploreJson(
    filepath: string,
    jsonpath: string | undefined,
    verbosity: number,
    listDisplayLimit?: number,
    objectDisplayLimit?: number,
    charDisplayLimit?: number
) {
    const data = loadJson(filepath);
    const value = explore(data, jsonpath ?? "");
    return simplify(value, verbosity, listDisplayLimit, objectDisplayLimit, charDisplayLimit);
}

/**
 * Query tool implementation
 */
export function queryJson(filepath: string, q: string, limit: number, caseSensitive: boolean) {
    const data = loadJson(filepath);
    const results = query(data, q, limit);
    if (caseSensitive) {
        const exactMatches = results.filter(r => contains(data, r.path, q));
        if (exactMatches.length > 0) {
            return {
                results,
                exactMatch: exactMatches,
            };
        }
    }

    return { results };
}
