![Betaflight](https://raw.githubusercontent.com/betaflight/.github/main/profile/images/bf_logo.svg#gh-light-mode-only)
![Betaflight](https://raw.githubusercontent.com/betaflight/.github/main/profile/images/bf_logo_dark.svg#gh-dark-mode-only)

# Betaflight App

[![Latest version](https://img.shields.io/github/v/release/betaflight/betaflight-configurator)](https://github.com/betaflight/betaflight-configurator/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/betaflight/betaflight-configurator/deploy.yml?branch=master)](https://github.com/betaflight/betaflight-configurator/actions/workflows/deploy.yml)
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/betaflight-configurator/localized.svg)](https://crowdin.com/project/betaflight-configurator)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=betaflight_betaflight-configurator&metric=alert_status)](https://sonarcloud.io/dashboard?id=betaflight_betaflight-configurator)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Join us on Discord!](https://img.shields.io/discord/868013470023548938)](https://discord.gg/n4E6ak4u3c)

Betaflight App is a Progressive Web Application for configuring and managing the Betaflight flight control system.

The current hosted release is available at [app.betaflight.com](https://app.betaflight.com). If you want to test the latest unstable snapshot, use [master.app.betaflight.com](https://master.app.betaflight.com).

Various types of aircraft are supported by the tool and by Betaflight, including quadcopters, hexacopters, octocopters, and fixed-wing aircraft.

## Runtime Model

This repository now targets a browser-first frontend deployment only.

- App runtime: PWA in a Chromium-class browser
- Device transports: Web Serial, Web Bluetooth, WebUSB DFU, WebSocket, and virtual devices for testing
- Local file access: browser File System Access APIs

There are no native desktop or Android packaging flows in this repository.

## Browser Requirements

For full device support, use a Chromium-based browser such as Chrome, Chromium, or Microsoft Edge with the required web hardware APIs available.

Some features require browser capabilities that are not universally available:

- Web Serial for serial connection workflows
- Web Bluetooth for Bluetooth connection workflows
- WebUSB for DFU flashing workflows
- HTTPS for WebAuthn features in local development

## Development

### Prepare your environment

1. Install [Node.js](https://nodejs.org/) and match the version in [.nvmrc](./.nvmrc)
2. Install Yarn globally: `npm install yarn -g`
3. Install project dependencies: `yarn install`

### Run the local development server

1. Run `yarn dev`
2. Open the local URL shown by Vite

If local certificates are present, the app runs over HTTPS at `https://local.betaflight.com:8443`. Otherwise it runs over HTTP at `http://localhost:8088`.

### Production build

Run `yarn build`.

To preview the production output locally, run `yarn preview` after the build completes.

### Tests

Run:

```bash
yarn test
```

### Linting

Run:

```bash
yarn lint
```

## Languages

**Please do not submit pull requests for translation changes directly.**

Betaflight App is translated into several languages. The application attempts to use your system language when a translation is available. If you want to help improve translations, use [Crowdin](https://crowdin.com/project/betaflight-configurator).

If you prefer a different language inside the app, select it on the first screen or in the available settings.

## Support and Community

Discord:

<https://discord.gg/n4E6ak4u3c>

Facebook Group:

<https://www.facebook.com/groups/betaflightgroup/>

Etiquette: don't ask to ask, and please wait around long enough for a reply. Sometimes people are flying, asleep, or at work and cannot answer immediately.

## Issue Trackers

Betaflight App issues:

<https://github.com/betaflight/betaflight-configurator/issues>

Betaflight Firmware issues:

<https://github.com/betaflight/betaflight/issues>

## Developers

We accept clean and reasonable patches, submit them.

## Credits

For the full contribution history, see the [GitHub contributors page](https://github.com/betaflight/betaflight-configurator/graphs/contributors).
