import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readSource = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("firmware flasher DFU access", () => {
    it("exposes a direct DFU permission request action in the firmware flasher menu", () => {
        const source = readSource("src/components/tabs/FirmwareFlasherTab.vue");

        expect(source).toContain('label: $t("portsSelectPermissionDFU")');
        expect(source).toContain('onSelect: () => PortHandler.requestDevicePermission("usb")');
    });
});
