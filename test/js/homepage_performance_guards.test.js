import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readSource = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("homepage performance guards", () => {
    it("keeps main startup free of eager heavy dependencies", () => {
        const source = readSource("src/js/main.js");

        expect(source).not.toContain('import * as THREE from "three"');
        expect(source).not.toContain('import { initializeSerialBackend } from "./serial_backend.js"');
    });

    it("shows the landing tab before awaiting login initialization", () => {
        const source = readSource("src/js/main.js");
        const landingIndex = source.indexOf('switchTab("landing", { mode: "disconnected" });');
        const loginIndex = source.indexOf("await loginManager.initialize();");

        expect(landingIndex).toBeGreaterThan(-1);
        expect(loginIndex).toBeGreaterThan(-1);
        expect(landingIndex).toBeLessThan(loginIndex);
    });

    it("keeps connect button free of a direct serial backend import", () => {
        const source = readSource("src/components/port-picker/ConnectButton.vue");

        expect(source).not.toContain('from "../../js/serial_backend"');
    });

    it("registers tabs as async components instead of eager imports", () => {
        const registry = readSource("src/js/vue_tab_registry.js");
        const plugin = readSource("src/js/vue_components.js");

        expect(registry).toContain("defineAsyncComponent");
        expect(registry).not.toContain('import HelpTab from "../components/tabs/HelpTab.vue"');
        expect(plugin).not.toContain('app.component("HelpTab"');
        expect(plugin).not.toContain('app.component("LandingTab"');
    });

    it("loads development debug tools through an optional module registry", () => {
        const source = readSource("src/js/main.js");

        expect(source).toContain('import.meta.glob("./msp/debug/msp_debug_tools.js")');
        expect(source).not.toContain('import("./msp/debug/msp_debug_tools.js")');
    });
});
