import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const readSource = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), "utf8");
const exists = (relativePath) => existsSync(resolve(process.cwd(), relativePath));

describe("frontend-only transports", () => {
    it.each([
        ["src/js/serial.js", ["CapacitorSerial", "CapacitorBle", "CapacitorTcp", "TauriSerial", "isAndroid", "isTauri"]],
        ["src/js/port_handler.js", ["CapacitorDfuTransport", "isAndroid"]],
        ["src/js/FileSystem.js", ["CapacitorFile", "isAndroid"]],
        ["src/composables/useFirmwareFlashing.js", ["capacitor-"]],
        ["src/js/utils/AutoBackup.js", ["capacitor-"]],
        ["src/js/protocols/usbdfu.js", ["CapacitorDfuTransport", "Android via native USB APIs"]],
        ["src/js/protocols/webstm32.js", ["Android", "Capacitor"]],
    ])("removes native references from %s", (file, bannedTokens) => {
        const source = readSource(file);

        for (const token of bannedTokens) {
            expect(source).not.toContain(token);
        }
    });

    it.each([
        "src/js/protocols/CapacitorBle.js",
        "src/js/protocols/CapacitorDfu.js",
        "src/js/protocols/CapacitorDfuTransport.js",
        "src/js/protocols/CapacitorFile.js",
        "src/js/protocols/CapacitorSerial.js",
        "src/js/protocols/CapacitorTcp.js",
        "src/js/protocols/TauriSerial.js",
    ])("deletes native transport implementation %s", (file) => {
        expect(exists(file)).toBe(false);
    });
});
