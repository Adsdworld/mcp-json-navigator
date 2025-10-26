import { explore } from "./explore.js";

/**
 * Strict case-sensitive containment check on a JSON path.
 * Works on values, lists, numbers, booleans, etc.
 */
export function contains(data: any, jsonpath: string, char: string): boolean {
    const value = explore(data, jsonpath); // may throw or return undefined depending on your explorer

    if (value == null) return false;

    // if value is object or list → stringify
    if (typeof value === "object") {
        return JSON.stringify(value).includes(char);
    }

    // handle primitive value
    return String(value).includes(char);
}