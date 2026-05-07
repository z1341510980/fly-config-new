import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import FileSystem from "../../src/js/FileSystem.js";
import { serialDevices, usbDevices, vendorIdNames, webSerialDevices } from "../../src/js/protocols/devices.js";

const readSource = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("browser device adapters", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("includes MICU serial and DFU filters in browser device defaults", () => {
        expect(serialDevices).toContainEqual({ vendorId: 0x396a, productId: 0x1000 });
        expect(webSerialDevices).toContainEqual({ usbVendorId: 0x396a, usbProductId: 0x1000 });
        expect(usbDevices.filters).toContainEqual({ vendorId: 0x396a, productId: 0xdf00 });
        expect(vendorIdNames[0x396a]).toBe("MICU");
    });

    it("merges remote device filters with browser defaults instead of dropping known DFU IDs", async () => {
        vi.resetModules();
        localStorage.clear();

        const { loadDeviceFilters, usbDevices: dynamicUsbDevices, serialDevices: dynamicSerialDevices } = await import(
            "../../src/js/protocols/devices.js"
        );

        await loadDeviceFilters({
            loadDeviceFilters: vi.fn().mockResolvedValue({
                serialDevices: [{ vendorId: 1155, productId: 22336 }],
                usbDevices: {
                    filters: [{ vendorId: 1155, productId: 57105 }],
                },
            }),
        });

        expect(dynamicUsbDevices.filters).toContainEqual({ vendorId: 1155, productId: 57105 });
        expect(dynamicUsbDevices.filters).toContainEqual({ vendorId: 0x396a, productId: 0xdf00 });
        expect(dynamicSerialDevices).toContainEqual({ vendorId: 1155, productId: 22336 });
        expect(dynamicSerialDevices).toContainEqual({ vendorId: 0x396a, productId: 0x1000 });
    });

    it("opens the selected browser file handle", async () => {
        const fileHandle = {
            name: "backup.json",
            queryPermission: vi.fn().mockResolvedValue("granted"),
        };
        window.showOpenFilePicker = vi.fn().mockResolvedValue([fileHandle]);

        const file = await FileSystem.pickOpenFile("JSON files", [".json"]);

        expect(file).toMatchObject({
            name: "backup.json",
            _fileHandle: fileHandle,
        });
    });

    it("builds stable unique Web Serial port paths", () => {
        const source = readSource("src/js/protocols/WebSerial.js");

        expect(source).not.toContain('path: "serial"');
        expect(source).toContain("createPortPath");
    });
});
