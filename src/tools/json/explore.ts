/**
 * Navigate inside a JSON object using dot-paths.
 * Examples:
 *   data.items.3.name
 *   data.items[2].value
 *   data.items.[0].options[4]
 *
 * Return either an object or a value.
 */

export function explore(data: any, jsonpath: string = ""): any {
    if (!jsonpath || jsonpath.trim() === "") return data;

    const parts = jsonpath.split(".");
    let current = data;

    for (const segment of parts) {
        // Case: "[3]"
        const bracketIndex = segment.match(/^\[(\d+)\]$/);
        if (bracketIndex) {
            const idx = Number(bracketIndex[1]);
            if (!Array.isArray(current)) throw new Error(`Expected list before index ${idx}`);
            if (idx >= current.length) throw new Error(`Index ${idx} out of range`);
            current = current[idx];
            continue;
        }

        // Case: "3"
        if (Array.isArray(current) && /^\d+$/.test(segment)) {
            const idx = Number(segment);
            if (idx >= current.length) throw new Error(`Index ${idx} out of range`);
            current = current[idx];
            continue;
        }

        // Case: key[index]
        const match = segment.match(/^([^\[]+)(?:\[(\d+)\])?$/);
        if (match) {
            const key = match[1];
            const idx = match[2] !== undefined ? Number(match[2]) : null;

            if (typeof current !== "object" || current === null) {
                throw new Error(`Expected object before key "${key}"`);
            }
            if (!(key in current)) throw new Error(`Key not found: ${key}`);

            current = current[key];

            if (idx !== null) {
                if (!Array.isArray(current)) throw new Error(`Key "${key}" is not a list`);
                if (idx >= current.length) throw new Error(`Index ${idx} out of range in list "${key}"`);
                current = current[idx];
            }
            continue;
        }

        throw new Error(`Invalid path segment: ${segment}`);
    }

    return current;
}
