# Betaflight Frontend-Only Conversion Design

## Context

This repository already contains a browser-first Progressive Web App built with Vue and Vite, but it still carries native host layers for Tauri desktop packaging and Capacitor Android packaging. Those native layers add their own dependencies, scripts, runtime branches, and documentation, which makes the project look and behave like a cross-platform host app rather than a pure frontend codebase.

The requested outcome is to keep the web application and browser-native hardware capabilities, while removing all native host layers from the repository.

## Goal

Convert the repository into a pure frontend project that:

- builds and runs only as a web app / PWA
- keeps browser-native device communication flows intact
- removes all Tauri, Capacitor, and Android packaging code from source, tooling, and docs

## Non-Goals

- Renaming the product across the codebase
- Reworking UI architecture beyond the changes required for web-only behavior
- Removing browser hardware features such as Web Serial, Web Bluetooth, WebUSB DFU, WebSocket, or virtual device support
- Redesigning firmware flashing, backup, or configurator workflows

## Target State

After the conversion, the repository should represent a single deployment model:

- frontend stack: Vue + Vite + PWA
- supported runtime: Chromium-class browser with required web device APIs
- supported device transport implementations:
  - Web Serial
  - Web Bluetooth
  - WebSocket
  - WebUSB DFU
  - Virtual serial transport for testing

Everything related to Tauri desktop hosting, Capacitor native hosting, and Android project packaging should be removed.

## Scope

### 1. Repository and Tooling Cleanup

Remove native-host assets and native-only tooling:

- delete `src-tauri/`
- delete `android/`
- delete `capacitor.config.base.json`
- delete `capacitor.config.generator.mjs`
- delete native-only helper scripts such as `scripts/check-tauri-prereqs.mjs`
- remove `android:*` and `tauri:*` scripts from `package.json`
- remove Tauri and Capacitor dependencies from `package.json`

The remaining package scripts should describe a frontend-only lifecycle: local dev, web build, preview, lint, test, and storybook if still used.

### 2. Web-Only Runtime Consolidation

Refactor runtime selection so the app no longer branches into native platform implementations.

Expected code changes:

- `src/js/serial.js`
  - remove imports and registration for `CapacitorSerial`, `CapacitorBle`, `CapacitorTcp`, and `TauriSerial`
  - keep only web transports plus virtual transport
- `src/js/port_handler.js`
  - remove Android-specific DFU transport selection
  - always use the WebUSB DFU path
- `src/js/FileSystem.js`
  - remove Android file picker and file I/O branches
  - keep only browser `showOpenFilePicker`, `showSaveFilePicker`, and file handle logic
- `src/js/utils/checkCompatibility.js`
  - remove `isAndroid`, `isIOS`, and `isTauri` compatibility exceptions
  - compatibility should be based on browser support for the required web APIs and embedded deployment exceptions already used by the app
- remove obsolete native protocol files once nothing imports them

The design intent is to preserve existing business behavior while simplifying the runtime platform model to web only.

### 3. Behavior Adjustments

User-visible behavior should become explicit and consistent:

- the app is used as a web app / PWA, not a desktop or Android shell
- serial, bluetooth, and DFU flows rely only on browser APIs
- file import/export relies only on browser file system access support
- compatibility messaging no longer treats native shells as a supported exception path

Where current UI or logic checks for native-specific device identifiers or platform branches, those branches should be removed or reduced to web-only logic.

### 4. Documentation Cleanup

Update documentation to match the new repository scope.

At minimum:

- rewrite `README.md` to describe the project as a frontend/PWA-only application
- remove installation and build instructions for standalone desktop and Android packaging
- remove or archive native-specific implementation notes that are no longer relevant to the repository
- keep guidance for browser-based development, preview, tests, and any web API caveats that still matter

## Implementation Strategy

Use a two-stage execution order within the same change set:

1. First, make the runtime web-only while preserving current web functionality.
2. Then remove native directories, dependencies, scripts, and documentation.

This order reduces the chance of accidentally deleting code paths that are still being referenced by the frontend.

## Verification Strategy

The change should be considered successful only if all of the following are true:

- `npm run build` succeeds without Tauri or Capacitor installed
- relevant automated tests pass
- lint passes for touched code, or any existing unrelated lint failures are clearly separated from this work
- the app boots in local web development mode
- serial/backend initialization still resolves cleanly in the browser-only build
- no imports remain for Tauri or Capacitor packages
- no runtime references remain to deleted native protocol implementations

Recommended targeted checks during implementation:

- search for `@tauri-apps/`
- search for `@capacitor/`
- search for `Capacitor`
- search for `Tauri`
- search for native protocol class names and deleted script names

## Risks and Mitigations

### Risk: Native-only branches are still referenced indirectly

Mitigation:

- remove imports only after the web-only replacements are wired
- run codebase-wide searches after each cleanup pass

### Risk: File operations or DFU flows were relying on Android-specific fallbacks

Mitigation:

- preserve the browser file handling and WebUSB implementations unchanged where possible
- keep the scope focused on platform removal, not functional rewrites

### Risk: Documentation and package metadata drift from actual supported behavior

Mitigation:

- update `README.md` and scripts in the same change set as code cleanup
- make web-only support explicit in the project description and usage instructions

## Success Criteria

The work is complete when:

- the repository contains no Tauri desktop project
- the repository contains no Android/Capacitor project
- the frontend builds and runs using only web tooling
- browser-native transport and file workflows still exist
- repository documentation accurately describes a frontend-only PWA project

## Out of Scope Follow-Up

If desired later, a separate cleanup pass can further simplify naming, compatibility copy, and any residual product language that still reflects historical native packaging support. That follow-up is intentionally excluded from this change to keep the conversion focused and low risk.
