import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readSource = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("frontend-only entrypoints", () => {
    it.each([
        ["src/js/main.js", ["@capacitor/core", "Capacitor"]],
        ["src/js/browserMain.js", ["isAndroid"]],
        ["src/js/utils/checkCompatibility.js", ["Capacitor", "isAndroid", "isIOS", "isTauri"]],
    ])("removes native host references from %s", (file, bannedTokens) => {
        const source = readSource(file);

        for (const token of bannedTokens) {
            expect(source).not.toContain(token);
        }
    });
});
