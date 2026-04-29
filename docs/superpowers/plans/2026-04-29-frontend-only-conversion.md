# Frontend-Only Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the repository into a web-only Vue/Vite/PWA project while preserving browser-native hardware support and removing all Tauri, Capacitor, and Android packaging code.

**Architecture:** Keep the existing browser application structure intact, but collapse runtime branching onto a single web-only execution model. Preserve Web Serial, Web Bluetooth, WebUSB DFU, WebSocket, and virtual transport support, then remove native host files, native dependencies, and native CI/release paths once the frontend no longer references them.

**Tech Stack:** Vue 3, Vite, Vitest, Yarn, browser File System Access API, Web Serial, Web Bluetooth, WebUSB, GitHub Actions

**Repo State Note:** `git log` is currently empty in this workspace, so do not make intermediate commits here unless the user first establishes a baseline initial commit. Use verification checkpoints instead of commit checkpoints during execution.

---

### Task 1: Add failing web-only regression tests

**Files:**
- Create: `test/js/frontend_only_entrypoints.test.js`
- Create: `test/js/checkCompatibility.test.js`
- Create: `test/js/frontend_only_transports.test.js`
- Create: `test/js/frontend_only_tooling.test.js`

- [ ] **Step 1: Add a failing source-guard test for entrypoint files**

```js
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
```

- [ ] **Step 2: Add browser-compatibility behavior tests**

```js
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    checkCompatibility,
    checkBluetoothSupport,
    checkSerialSupport,
    checkUsbSupport,
    isEmbeddedDeployment,
} from "../../src/js/utils/checkCompatibility.js";

const setNavigatorState = (overrides = {}) => {
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
};

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
        setNavigatorState({
            userAgent: "Mozilla/5.0 Firefox/125.0",
            userAgentData: undefined,
            serial: undefined,
            bluetooth: undefined,
            usb: undefined,
        });

        expect(() => checkCompatibility()).toThrow("No compatible browser found.");
        expect(document.body.textContent).toContain("Chromium");
    });
});
```

- [ ] **Step 3: Add a failing source-guard test for transport and file modules**

```js
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
```

- [ ] **Step 4: Add a failing tooling/docs/workflow guard test**

```js
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
```

- [ ] **Step 5: Run the new tests and confirm they fail**

Run:

```bash
yarn vitest run test/js/frontend_only_entrypoints.test.js test/js/checkCompatibility.test.js test/js/frontend_only_transports.test.js test/js/frontend_only_tooling.test.js
```

Expected: FAIL with assertions about native tokens still present and native paths still existing.

### Task 2: Convert entrypoints and compatibility checks to web-only behavior

**Files:**
- Modify: `src/js/main.js`
- Modify: `src/js/browserMain.js`
- Modify: `src/js/utils/checkCompatibility.js`
- Test: `test/js/frontend_only_entrypoints.test.js`
- Test: `test/js/checkCompatibility.test.js`

- [ ] **Step 1: Remove Capacitor startup handling from the main browser entrypoint**

```js
import "../components/init.js";
import { gui_log } from "./gui_log.js";
import { i18n } from "./localization.js";
import GUI from "./gui.js";
import { get as getConfig, set as setConfig } from "./ConfigStorage.js";
import { checkSetupAnalytics } from "./Analytics.js";
import { initializeSerialBackend } from "./serial_backend.js";
import CONFIGURATOR from "./data_storage.js";
import CliAutoComplete from "./CliAutoComplete.js";
import DarkTheme, { setDarkTheme } from "./DarkTheme.js";
import { applyExpertMode } from "./utils/applyExpertMode.js";
import { mountVueTab } from "./vue_tab_mounter.js";
import { switchTab } from "./tab_switch.js";
import * as THREE from "three";
import NotificationManager from "./utils/notifications.js";
import loginManager from "./LoginManager.js";
import { enableDevelopmentOptions } from "./utils/developmentOptions.js";
import { loadDeviceFilters } from "./protocols/devices.js";
```

Delete the native-only block:

```js
// Silence Capacitor bridge debug spam on native platforms
if (Capacitor?.isNativePlatform?.() && typeof Capacitor.isLoggingEnabled === "boolean") {
    Capacitor.isLoggingEnabled = false;
}
```

- [ ] **Step 2: Make service-worker registration depend only on embedded deployment rules**

```js
import { isEmbeddedDeployment } from "./utils/checkCompatibility.js";

if (!isEmbeddedDeployment()) {
    const dialogStore = useDialogStore(pinia);
    const updateSW = registerSW({
        onNeedRefresh() {
            console.log("Detected onNeedRefresh");
            dialogStore.open(
                "YesNoDialog",
                {
                    title: i18n.getMessage("pwaOnNeedRefreshTitle"),
                    text: i18n.getMessage("pwaOnNeedRefreshText"),
                    yesText: i18n.getMessage("yes"),
                    noText: i18n.getMessage("no"),
                },
                {
                    yes: () => {
                        dialogStore.close();
                        updateSW();
                    },
                    no: () => dialogStore.close(),
                },
            );
        },
        onOfflineReady() {
            console.log("Detected onOfflineReady");
            dialogStore.open(
                "InformationDialog",
                {
                    title: i18n.getMessage("pwaOnOffilenReadyTitle"),
                    text: i18n.getMessage("pwaOnOffilenReadyText"),
                    confirmText: i18n.getMessage("OK"),
                },
                { confirm: () => dialogStore.close() },
            );
        },
    });
}
```

- [ ] **Step 3: Rewrite compatibility helpers to remove native shell exceptions**

```js
// Detects OS using modern userAgentData API with fallback to legacy platform
export function getOS() {
    const userAgent = globalThis.navigator?.userAgent ?? "";
    const platform = globalThis.navigator?.userAgentData?.platform ?? globalThis.navigator?.platform ?? "";
    const macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K", "macOS"];
    const windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"];
    const iosPlatforms = ["iPhone", "iPad", "iPod"];

    if (macosPlatforms.includes(platform)) {
        return "MacOS";
    }
    if (iosPlatforms.includes(platform)) {
        return "iOS";
    }
    if (windowsPlatforms.includes(platform)) {
        return "Windows";
    }
    if (/Android/.test(userAgent)) {
        return "Android";
    }
    if (/Linux/.test(platform)) {
        return "Linux";
    }
    if (/CrOS/.test(platform)) {
        return "ChromeOS";
    }

    return "unknown";
}

export function isChromiumBrowser() {
    if (navigator.userAgentData?.brands) {
        return navigator.userAgentData.brands.some((brand) => brand.brand === "Chromium");
    }

    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("chrom") || ua.includes("edg");
}

export function isEmbeddedDeployment() {
    return document.querySelector('meta[name="bf-transport"]')?.content === "websocket";
}

export function checkSerialSupport() {
    return !!navigator.serial;
}

export function checkBluetoothSupport() {
    return !!navigator.bluetooth;
}

export function checkUsbSupport() {
    return !!navigator.usb;
}

export function checkCompatibility() {
    if (isEmbeddedDeployment()) {
        return true;
    }

    const hasSerialSupport = checkSerialSupport();
    const hasBluetoothSupport = checkBluetoothSupport();
    const hasUsbSupport = checkUsbSupport();
    const isChromium = isChromiumBrowser();
    const isTestEnvironment =
        typeof process !== "undefined" && (process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined);

    const compatible = isTestEnvironment || (isChromium && (hasSerialSupport || hasBluetoothSupport || hasUsbSupport));

    if (compatible) {
        return true;
    }

    let errorMessage = "";
    if (!isChromium) {
        errorMessage = "Betaflight app requires a Chromium based browser (Chrome, Chromium, Edge).<br/>";
    }
    if (!hasBluetoothSupport) {
        errorMessage += "<br/>- Bluetooth API support is disabled.";
    }
    if (!hasSerialSupport) {
        errorMessage += "<br/>- Serial API support is disabled.";
    }
    if (!hasUsbSupport) {
        errorMessage += "<br/>- USB API support is disabled.";
    }

    const body = document.body;
    body.innerHTML = "";
    Object.assign(body.style, {
        height: "100%",
        display: "grid",
        backgroundImage: "url(/images/pattern_dark.png)",
        backgroundSize: "300px",
        backgroundRepeat: "repeat",
        backgroundColor: "var(--surface-500)",
    });

    const newDiv = document.createElement("div");
    newDiv.innerHTML = errorMessage;
    Object.assign(newDiv.style, {
        fontSize: "16px",
        backgroundColor: "var(--surface-200)",
        color: "var(--text)",
        padding: "1rem",
        margin: "auto",
        borderRadius: "0.75rem",
        border: "2px solid var(--surface-500)",
    });
    body.appendChild(newDiv);

    throw new Error("No compatible browser found.");
}
```

- [ ] **Step 4: Run the entrypoint tests until they pass**

Run:

```bash
yarn vitest run test/js/frontend_only_entrypoints.test.js test/js/checkCompatibility.test.js
```

Expected: PASS.

### Task 3: Convert transport, DFU, flashing, and file handling to web-only runtime paths

**Files:**
- Modify: `src/js/serial.js`
- Modify: `src/js/port_handler.js`
- Modify: `src/js/FileSystem.js`
- Modify: `src/composables/useFirmwareFlashing.js`
- Modify: `src/js/utils/AutoBackup.js`
- Modify: `src/js/protocols/usbdfu.js`
- Modify: `src/js/protocols/webstm32.js`
- Delete: `src/js/protocols/CapacitorBle.js`
- Delete: `src/js/protocols/CapacitorDfu.js`
- Delete: `src/js/protocols/CapacitorDfuTransport.js`
- Delete: `src/js/protocols/CapacitorFile.js`
- Delete: `src/js/protocols/CapacitorSerial.js`
- Delete: `src/js/protocols/CapacitorTcp.js`
- Delete: `src/js/protocols/TauriSerial.js`
- Test: `test/js/frontend_only_transports.test.js`

- [ ] **Step 1: Replace transport registration with a fixed web-only protocol list**

```js
import WebSerial from "./protocols/WebSerial.js";
import WebBluetooth from "./protocols/WebBluetooth.js";
import Websocket from "./protocols/WebSocket.js";
import VirtualSerial from "./protocols/VirtualSerial.js";

class Serial extends EventTarget {
    constructor() {
        super();
        this._protocol = null;
        this._eventHandlers = {};
        this.logHead = "[SERIAL]";

        this._protocols = [
            { name: "serial", instance: new WebSerial() },
            { name: "bluetooth", instance: new WebBluetooth() },
            { name: "tcp", instance: new Websocket() },
            { name: "virtual", instance: new VirtualSerial() },
        ];

        this._setupEventForwarding();
    }
}
```

- [ ] **Step 2: Collapse DFU transport selection and browser file handling to web-only implementations**

```js
// src/js/port_handler.js
import defaultDfu from "./protocols/usbdfu";

const dfuProtocol = defaultDfu;
```

```js
// src/js/FileSystem.js
class FileSystem {
    _createFile(fileHandle) {
        return {
            name: fileHandle.name,
            _fileHandle: fileHandle,
        };
    }

    async pickSaveFile(suggestedName, description, extension) {
        const fileHandle = await window.showSaveFilePicker({
            suggestedName,
            types: [
                {
                    description,
                    accept: {
                        "application/unknown": extension,
                    },
                },
            ],
        });

        if (!fileHandle) {
            return null;
        }

        const file = this._createFile(fileHandle);
        if (await this.verifyPermission(file, true)) {
            return file;
        }
    }

    async pickOpenFile(description, extension) {
        const [fileHandle] = await window.showOpenFilePicker({
            multiple: false,
            types: [
                {
                    description,
                    accept: {
                        "application/unknown": extension,
                    },
                },
            ],
        });

        const file = this._createFile(fileHandle);
        if (await this.verifyPermission(file, false)) {
            return file;
        }
    }

    async writeFile(file, contents) {
        const writable = await file._fileHandle.createWritable();
        await writable.write(contents);
        await writable.close();
    }
}
```

- [ ] **Step 3: Remove native-path conditionals from flashing and backup flows**

```js
// src/composables/useFirmwareFlashing.js
const port = PortHandler.portPicker.selectedPort;
const isSerial = port.startsWith("serial");
const isDFU = port.startsWith("usb");
```

```js
// src/js/utils/AutoBackup.js
if (port.startsWith("serial")) {
    this.boundHandleConnect = this.handleConnect.bind(this);
    serial.addEventListener("connect", this.boundHandleConnect, { once: true });
    serial.connect(port, { baudRate: baud });
} else {
    gui_log(i18n.getMessage("firmwareFlasherNoPortSelected"));
}
```

```js
// src/js/protocols/usbdfu.js
/*
    This module now uses a single pluggable transport layer:
    - WebUsbDfuTransport (desktop browsers with WebUSB)
*/
```

```js
// src/js/protocols/webstm32.js
const device = await PortHandler.dfuProtocol.requestPermission();
if (device) {
    PortHandler.dfuProtocol.dispatchEvent(new CustomEvent("addedDevice", { detail: device }));
    return;
}
```

- [ ] **Step 4: Delete the native transport implementation files**

Run:

```powershell
Remove-Item -LiteralPath `
  'src\js\protocols\CapacitorBle.js', `
  'src\js\protocols\CapacitorDfu.js', `
  'src\js\protocols\CapacitorDfuTransport.js', `
  'src\js\protocols\CapacitorFile.js', `
  'src\js\protocols\CapacitorSerial.js', `
  'src\js\protocols\CapacitorTcp.js', `
  'src\js\protocols\TauriSerial.js'
```

Expected: the files are removed and no import statements reference them.

- [ ] **Step 5: Run the transport regression test until it passes**

Run:

```bash
yarn vitest run test/js/frontend_only_transports.test.js
```

Expected: PASS.

### Task 4: Remove native packaging/tooling and rewrite CI and docs for a frontend-only repo

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `.github/workflows/build.yml`
- Modify: `.github/workflows/build-release.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/manual-build.yml`
- Modify: `yarn.lock`
- Delete: `android/`
- Delete: `src-tauri/`
- Delete: `capacitor.config.base.json`
- Delete: `capacitor.config.generator.mjs`
- Delete: `scripts/check-tauri-prereqs.mjs`
- Delete: `scripts/sync-tauri-version.mjs`
- Delete: `CAPACITOR_SERIAL_IMPLEMENTATION.md`
- Delete: `DFU_ANDROID_IMPLEMENTATION.md`
- Delete: `.github/workflows/tauri-release.yml`
- Test: `test/js/frontend_only_tooling.test.js`

- [ ] **Step 1: Remove native package scripts, dependencies, and window metadata**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "review": "vite build && vite preview",
    "pretest": "npm run lint",
    "test": "vitest",
    "lint": "eslint --ext .js,.vue src",
    "lint:fix": "eslint --ext .js,.vue src --fix",
    "format": "prettier --write {src,test}/**/*.{js,vue,css,less}",
    "storybook": "storybook dev -p 6006",
    "prepare": "husky"
  },
  "dependencies": {
    "@fortawesome/fontawesome-free": "^6.5.2",
    "@iconify-json/lucide": "^1.2.101",
    "@nuxt/ui": "^4.4.0",
    "@simplewebauthn/browser": "^13.2.2",
    "@vitejs/plugin-vue": "^6.0.1",
    "@vueuse/core": "^14.2.1",
    "crypto-es": "^2.1.0",
    "d3": "^7.9.0",
    "djv": "^2.1.4",
    "dompurify": "^3.4.0",
    "geomagnetism": "^0.2.0",
    "i18next": "^24.2.2",
    "i18next-http-backend": "^3.0.5",
    "i18next-vue": "^5.2.0",
    "inflection": "^1.13.4",
    "jsdom": "^26.0.0",
    "lodash.debounce": "^4.0.8",
    "marked": "^15.0.7",
    "multicast-dns": "^7.2.5",
    "ol": "^10.4.0",
    "pinia": "^3.0.4",
    "semver": "^7.7.4",
    "short-unique-id": "^5.2.0",
    "suncalc": "^1.9.0",
    "tailwindcss": "^4.1.18",
    "three": "^0.176.0",
    "tiny-emitter": "^2.1.0",
    "vite-plugin-pwa": "^1.0.3",
    "vue": "^3.5.13",
    "vue-multiselect": "^3.0.0",
    "vue-router": "^4"
  },
  "devDependencies": {
    "@babel/core": "^7.26.9",
    "@rollup/plugin-alias": "^5.1.1",
    "@rollup/plugin-commonjs": "^28.0.2",
    "@rollup/plugin-node-resolve": "^16.0.0",
    "@rollup/plugin-replace": "^6.0.2",
    "@storybook/addon-actions": "^8.6.3",
    "@storybook/addon-essentials": "^8.6.3",
    "@storybook/addon-links": "^8.6.3",
    "@storybook/vue3": "^8.6.3",
    "babel-loader": "^10.0.0",
    "cross-env": "^7.0.3",
    "eslint": "^9.21.0",
    "eslint-config-prettier": "^10.0.2",
    "eslint-define-config": "^2.1.0",
    "eslint-plugin-prettier": "^5.2.3",
    "eslint-plugin-unused-imports": "^4.1.4",
    "eslint-plugin-vue": "^9.32.0",
    "follow-redirects": "^1.16.0",
    "glob": "^11.0.1",
    "husky": "^9.1.7",
    "inquirer": "^12.4.2",
    "less": "^4.2.2",
    "lint-staged": "^15.4.3",
    "os": "^0.1.2",
    "postcss": "^8.5.12",
    "prettier": "^3.5.2",
    "rollup": "^4.59.0",
    "rollup-plugin-copy": "^3.5.0",
    "run-script-os": "^1.1.6",
    "vite": "^7.3.2",
    "vite-plugin-mkcert": "^1.17.9",
    "vitest": "^3.2.4",
    "yarn": "^1.22.22"
  }
}
```

- [ ] **Step 2: Delete native packaging directories and native-only scripts/docs**

Run:

```powershell
Remove-Item -Recurse -Force 'android', 'src-tauri'
Remove-Item -LiteralPath `
  'capacitor.config.base.json', `
  'capacitor.config.generator.mjs', `
  'scripts/check-tauri-prereqs.mjs', `
  'scripts/sync-tauri-version.mjs', `
  'CAPACITOR_SERIAL_IMPLEMENTATION.md', `
  'DFU_ANDROID_IMPLEMENTATION.md', `
  '.github/workflows/tauri-release.yml'
```

Expected: the native directories, helper scripts, and native-only documents no longer exist.

- [ ] **Step 3: Simplify GitHub Actions to web-only build and deploy behavior**

```yaml
# .github/workflows/build.yml
name: Build

on:
  workflow_call:
    inputs:
      commit_ref:
        description: The git SHA to checkout
        required: true
        type: string

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        with:
          ref: ${{ inputs.commit_ref }}
          persist-credentials: false

      - name: Cache node_modules
        uses: actions/cache@v4
        with:
          path: node_modules/
          key: node_modules-${{ runner.os }}-${{ hashFiles('yarn.lock') }}

      - name: Install node.js
        uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc

      - run: npm install yarn -g
      - run: yarn install --frozen-lockfile
      - run: yarn build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist-files
          path: src/dist
```

```yaml
# .github/workflows/deploy.yml PR comment body
message: |
  🎉 Do you want to test this code? 🎉

  - 🌐 **[Progressive Web Application (PWA)](${{ needs.deploy.outputs.deployment_alias_url }})**

  ⚠️ **CAUTION**: The build may be unstable and result in corrupted configurations or data loss. Use only for testing! ⚠️
```

```yaml
# .github/workflows/build-release.yml
jobs:
  modern_build:
    name: Build
    needs: check_tag
    if: needs.check_tag.outputs.should_run == 'true'
    uses: ./.github/workflows/build.yml
    with:
      commit_ref: ${{ github.event.release.target_commitish }}

  # delete the old modern_release job that downloaded and attached APK artifacts
```

```yaml
# .github/workflows/manual-build.yml
name: Manual Build
run-name: Manual Build ${{ github.ref_name }}

on:
  workflow_dispatch:

jobs:
  build:
    name: Build
    uses: ./.github/workflows/build.yml
    with:
      commit_ref: ${{ github.sha }}
```

```yaml
# .github/workflows/deploy.yml build job
  build:
    name: Build
    needs: commit_reference
    uses: ./.github/workflows/build.yml
    with:
      commit_ref: ${{ needs.commit_reference.outputs.COMMIT_REF }}
```

- [ ] **Step 4: Rewrite README for a web-only project and refresh the Yarn lockfile**

```markdown
## Installation

Betaflight App is maintained here as a Progressive Web Application (PWA).
Use the hosted app at [app.betaflight.com](https://app.betaflight.com) or run the project locally with Vite.

## Build and Development

1. Install [node.js](https://nodejs.org/) (refer to `.nvmrc`)
2. Install Yarn: `npm install yarn -g`
3. Run `yarn install`
4. Run `yarn dev`

The web app will be available at the Vite URL shown in the terminal.
```

Run:

```bash
yarn install
```

Expected: `yarn.lock` updates to match the removed native dependencies and no install step tries to resolve Capacitor or Tauri packages.

- [ ] **Step 5: Run the tooling/docs regression test until it passes**

Run:

```bash
yarn vitest run test/js/frontend_only_tooling.test.js
```

Expected: PASS.

### Task 5: Run full verification and capture the final migration checklist

**Files:**
- Modify: `docs/superpowers/plans/2026-04-29-frontend-only-conversion.md` (checkboxes only, if tracking inline)

- [ ] **Step 1: Run lint**

Run:

```bash
yarn lint
```

Expected: PASS. If unrelated pre-existing lint failures remain, record the exact files and stop before claiming success.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
yarn vitest run
```

Expected: PASS.

- [ ] **Step 3: Run a production build**

Run:

```bash
yarn build
```

Expected: PASS and emit build output into `src/dist`.

- [ ] **Step 4: Run search-based verification for native references**

Run:

```powershell
$files = Get-ChildItem -Path 'src','.github\\workflows','scripts','README.md','package.json' -Recurse -File -ErrorAction SilentlyContinue
$files | Select-String -Pattern '@tauri-apps/|@capacitor/|Capacitor|Tauri|android:|tauri:' | Select-Object Path,LineNumber,Line
```

Expected: no output.

- [ ] **Step 5: Smoke-check the local dev server startup**

Run:

```bash
yarn dev
```

Expected: the Vite banner starts successfully and reports either the normal HTTP local URL or the HTTPS local hostname if local certificates are present. Stop the server after confirming startup.

- [ ] **Step 6: Report completion status instead of committing in this workspace**

Run:

```bash
git status --short
```

Expected: only the intended frontend-only conversion files appear changed or deleted. Do not create a commit in this workspace unless the user explicitly asks for one after reviewing the diff.
