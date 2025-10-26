/**
 * Verbosity levels
 * 5               → raw
 * 4 small-expand  → primitives kept; expand small lists/objects; otherwise fallback to level 2
 * 3 size-summary  → primitives kept; lists/objects show size + char count
 * 2 summary-count → primitives kept; lists → N items; objects → N keys
 * 1 type-map      → key → type (string, number, boolean, list, object, null)
 * 0 root-only     → keys
 */
export function simplify(
    value: any,
    verbosity: number,
    listDisplayLimit: number = 5,
    objectDisplayLimit: number = 6,
    charDisplayLimit: number = 200
): any {
    if (verbosity === 5) return value;

    if (verbosity === 0) {
        if (Array.isArray(value)) return `[list: ${value.length} items]`;
        if (value && typeof value === "object") return Object.keys(value);
        return value;
    }

    // Value not an object
    if (value === null || typeof value !== "object") return value;

    // LIST at root (not inside an object key)
    if (Array.isArray(value)) {
        const length = value.length;
        const sizeChars = charSize(value);

        if (verbosity === 4) return "list";
        if (verbosity === 3) return `[list: ${length} items]`;
        if (verbosity === 2) return `[list: ${length} items, ${sizeChars} chars]`;

        if (verbosity === 1) {
            if (length <= listDisplayLimit || sizeChars <= charDisplayLimit) {
                return value.map(v => simplify(v, 1, listDisplayLimit, objectDisplayLimit, charDisplayLimit));
            }
            // fallback to level 2 summary
            return `[list: ${length} items, ${sizeChars} chars]`;
        }

        return value;
    }

    // OBJECT
    const keys = Object.keys(value);

    if (verbosity === 1) {
        // key → type
        return Object.fromEntries(
            keys.map(k => {
                const v = value[k];
                if (v === null) return [k, "null"];
                if (Array.isArray(v)) return [k, "list"];
                return [k, typeof v];
            })
        );
    }

    if (verbosity === 2) {
        return Object.fromEntries(
            keys.map(k => {
                const v = value[k];
                if (v === null || typeof v !== "object") return [k, v];
                if (Array.isArray(v)) return [k, `[list: ${v.length} items]`];
                return [k, `[object: ${Object.keys(v).length} keys]`];
            })
        );
    }

    if (verbosity === 3) {
        return Object.fromEntries(
            keys.map(k => {
                const v = value[k];
                if (v === null || typeof v !== "object") return [k, v];
                if (Array.isArray(v)) {
                    return [k, `[list: ${v.length} items, ${charSize(v)} chars]`];
                }
                return [k, `{object: ${Object.keys(v).length} keys, ${charSize(v)} chars}`];
            })
        );
    }

    if (verbosity === 4) {
        const totalChars = charSize(value);
        if (keys.length <= objectDisplayLimit || totalChars <= charDisplayLimit) {
            // expand: recurse with v=1 for each key
            return Object.fromEntries(
                keys.map(k => [k, simplify(value[k], 1, listDisplayLimit, objectDisplayLimit, charDisplayLimit)])
            );
        }
        // fallback to level 3 per key
        return simplify(value, 3, listDisplayLimit, objectDisplayLimit, charDisplayLimit);
    }

    return value;
}


function charSize(value: any): number {
    try {
        return JSON.stringify(value)?.length ?? Number.MAX_VALUE;
    } catch {
        return Number.MAX_VALUE;
    }
}
