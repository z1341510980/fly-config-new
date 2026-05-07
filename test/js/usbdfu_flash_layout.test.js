import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/js/gui_log.js", () => ({
    gui_log: vi.fn(),
}));

vi.mock("../../src/js/localization.js", () => ({
    i18n: {
        getMessage: (key) => key,
    },
}));

import { UsbDfuProtocol } from "../../src/js/protocols/usbdfu.js";

function createTransport() {
    return {
        addEventListener: vi.fn(),
        getConnectedPort: vi.fn(() => null),
    };
}

describe("UsbDfuProtocol flash layout selection", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("accepts external flash addresses when a single descriptor string contains multiple memory regions", () => {
        const protocol = new UsbDfuProtocol(createTransport());

        protocol.hex = {
            bytes_total: 1024,
            data: [
                {
                    address: 0x90000000,
                    bytes: 1024,
                },
            ],
        };

        protocol.options = {
            flashMessageTypes: {
                INVALID: "invalid",
            },
        };

        protocol.getInterfaceDescriptors = vi.fn((_, callback) =>
            callback(
                [
                    "@Internal Flash /0x08000000/128*002Kg @External Flash /0x90000000/128*002Kg @Option bytes /0x1FFFC000/01*512 g",
                ],
                0,
            ),
        );

        protocol.getFunctionalDescriptor = vi.fn((_, callback) =>
            callback(
                {
                    wTransferSize: 2048,
                },
                0,
            ),
        );

        protocol.clearStatus = vi.fn((callback) => callback());
        protocol.cleanup = vi.fn();
        protocol.leave = vi.fn();
        protocol.flashingMessage = vi.fn();

        const continueUpload = vi.fn();
        const runStepZero = protocol.upload_procedure.bind(protocol);
        protocol.upload_procedure = continueUpload;

        runStepZero(0);

        expect(protocol.leave).not.toHaveBeenCalled();
        expect(protocol.flash_layout.sectors).toHaveLength(2);
        expect(protocol.flash_layout.total_size).toBe(0x80000);
        expect(continueUpload).toHaveBeenCalledWith(1);
    });

    it("treats external flash blocks as writable when internal and external layouts are both present", () => {
        const protocol = new UsbDfuProtocol(createTransport());

        protocol.hex = {
            bytes_total: 1024,
            data: [
                {
                    address: 0x90000000,
                    bytes: 1024,
                },
            ],
        };

        protocol.options = {
            flashMessageTypes: {
                INVALID: "invalid",
            },
        };

        protocol.getChipInfo = vi.fn((_, callback) =>
            callback(
                {
                    internal_flash: {
                        start_address: 0x08000000,
                        total_size: 0x80000,
                        sectors: [
                            {
                                num_pages: 128,
                                start_address: 0x08000000,
                                page_size: 4096,
                                total_size: 0x80000,
                            },
                        ],
                    },
                    external_flash: {
                        start_address: 0x90000000,
                        total_size: 0x80000,
                        sectors: [
                            {
                                num_pages: 128,
                                start_address: 0x90000000,
                                page_size: 4096,
                                total_size: 0x80000,
                            },
                        ],
                    },
                    option_bytes: {
                        total_size: 16,
                    },
                },
                0,
            ),
        );

        protocol.getFunctionalDescriptor = vi.fn((_, callback) =>
            callback(
                {
                    wTransferSize: 2048,
                },
                0,
            ),
        );

        protocol.clearStatus = vi.fn((callback) => callback());
        protocol.cleanup = vi.fn();
        protocol.leave = vi.fn();
        protocol.flashingMessage = vi.fn();

        const continueUpload = vi.fn();
        const runStepZero = protocol.upload_procedure.bind(protocol);
        protocol.upload_procedure = continueUpload;

        runStepZero(0);

        expect(protocol.leave).not.toHaveBeenCalled();
        expect(protocol.flash_layout.sectors).toHaveLength(2);
        expect(protocol.flash_layout.total_size).toBe(0x100000);
        expect(continueUpload).toHaveBeenCalledWith(1);
    });
});
