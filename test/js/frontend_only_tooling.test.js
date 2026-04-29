import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const readText = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const exists = (relativePath) => existsSync(resolve(process.cwd(), relativePath));

describe("frontend-only tooling", () => {
    it("removes native package scripts and dependencies", () => {
        const pkg = readJson("package.json");

        expect(Object.keys(pkg.scripts).some((name) => name.startsWith("android:") || name.startsWith("tauri:"))).toBe(
            false,
        );
        expect(pkg.dependencies?.["@capacitor/android"]).toBeUndefined();
        expect(pkg.dependencies?.["@capacitor/core"]).toBeUndefined();
        expect(pkg.dependencies?.["@tauri-apps/api"]).toBeUndefined();
        expect(pkg.devDependencies?.["@capacitor/cli"]).toBeUndefined();
        expect(pkg.devDependencies?.["@tauri-apps/cli"]).toBeUndefined();
        expect(pkg.window).toBeUndefined();
    });

    it.each([
        "android",
        "src-tauri",
        "capacitor.config.base.json",
        "capacitor.config.generator.mjs",
        "scripts/check-tauri-prereqs.mjs",
        "scripts/sync-tauri-version.mjs",
        "CAPACITOR_SERIAL_IMPLEMENTATION.md",
        "DFU_ANDROID_IMPLEMENTATION.md",
        ".github/workflows/tauri-release.yml",
    ])("removes native-only repository path %s", (target) => {
        expect(exists(target)).toBe(false);
    });

    it("rewrites README and workflows to web-only language", () => {
        const readme = readText("README.md");
        const buildWorkflow = readText(".github/workflows/build.yml");
        const deployWorkflow = readText(".github/workflows/deploy.yml");

        expect(readme).not.toContain("Android Studio");
        expect(readme).not.toContain("Download the installer");
        expect(buildWorkflow).not.toContain("cap sync android");
        expect(buildWorkflow).not.toContain("Build and Sign Android APK");
        expect(deployWorkflow).not.toContain("Android APK");
    });
});
