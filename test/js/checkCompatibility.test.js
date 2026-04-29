import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    checkCompatibility,
    checkBluetoothSupport,
    checkSerialSupport,
    checkUsbSupport,
    isEmbeddedDeployment,
} from "../../src/js/utils/checkCompatibility.js";

function setNavigatorState(overrides = {}) {
    Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: {
            userAgent: "Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36",
            userAgentData: {
                brands: [{ brand: "Chromium", version: "124" }],
                platform: "Windows",
            },
            serial: {},
            bluetooth: {},
            usb: {},
            ...overrides,
        },
    });
}

describe("checkCompatibility", () => {
    beforeEach(() => {
        document.head.innerHTML = "";
        document.body.innerHTML = "<main>app</main>";
        vi.restoreAllMocks();
        setNavigatorState();
    });

    it("detects embedded websocket deployments via meta tag", () => {
        const meta = document.createElement("meta");
        meta.name = "bf-transport";
        meta.content = "websocket";
        document.head.appendChild(meta);

        expect(isEmbeddedDeployment()).toBe(true);
    });

    it("accepts Chromium browsers when at least one required device API exists", () => {
        expect(checkSerialSupport()).toBe(true);
        expect(checkBluetoothSupport()).toBe(true);
        expect(checkUsbSupport()).toBe(true);
        expect(checkCompatibility()).toBe(true);
    });

    it("throws and renders an error state for unsupported browsers", () => {
        const originalNodeEnv = process.env.NODE_ENV;
        const originalJestWorkerId = process.env.JEST_WORKER_ID;

        process.env.NODE_ENV = "development";
        delete process.env.JEST_WORKER_ID;

        setNavigatorState({
            userAgent: "Mozilla/5.0 Firefox/125.0",
            userAgentData: undefined,
            serial: undefined,
            bluetooth: undefined,
            usb: undefined,
        });

        try {
            expect(() => checkCompatibility()).toThrow("No compatible browser found.");
            expect(document.body.textContent).toContain("Chromium");
        } finally {
            process.env.NODE_ENV = originalNodeEnv;
            if (originalJestWorkerId === undefined) {
                delete process.env.JEST_WORKER_ID;
            } else {
                process.env.JEST_WORKER_ID = originalJestWorkerId;
            }
        }
    });
});
