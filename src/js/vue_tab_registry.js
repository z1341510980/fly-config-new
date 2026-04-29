import { defineAsyncComponent } from "vue";

function lazyTab(loader) {
    return defineAsyncComponent({
        loader,
        suspensible: false,
    });
}

export const VueTabComponents = {
    help: lazyTab(() => import("../components/tabs/HelpTab.vue")),
    landing: lazyTab(() => import("../components/tabs/LandingTab.vue")),
    options: lazyTab(() => import("../components/tabs/OptionsTab.vue")),
    ports: lazyTab(() => import("../components/tabs/PortsTab.vue")),
    servos: lazyTab(() => import("../components/tabs/ServosTab.vue")),
    configuration: lazyTab(() => import("../components/tabs/ConfigurationTab.vue")),
    user_profile: lazyTab(() => import("../components/tabs/UserProfileTab.vue")),
    backups: lazyTab(() => import("../components/tabs/BackupsTab.vue")),
    logging: lazyTab(() => import("../components/tabs/LoggingTab.vue")),
    gps: lazyTab(() => import("../components/tabs/GpsTab.vue")),
    auxiliary: lazyTab(() => import("../components/tabs/AuxiliaryTab.vue")),
    onboard_logging: lazyTab(() => import("../components/tabs/OnboardLoggingTab.vue")),
    firmware_flasher: lazyTab(() => import("../components/tabs/FirmwareFlasherTab.vue")),
    adjustments: lazyTab(() => import("../components/tabs/AdjustmentsTab.vue")),
    cli: lazyTab(() => import("../components/tabs/CliTab.vue")),
    power: lazyTab(() => import("../components/tabs/PowerTab.vue")),
    sensors: lazyTab(() => import("../components/tabs/SensorsTab.vue")),
    flight_plan: lazyTab(() => import("../components/tabs/FlightPlanTab.vue")),
    led_strip: lazyTab(() => import("../components/tabs/LedStripTab.vue")),
    failsafe: lazyTab(() => import("../components/tabs/FailsafeTab.vue")),
    motors: lazyTab(() => import("../components/tabs/MotorsTab.vue")),
    receiver: lazyTab(() => import("../components/tabs/ReceiverTab.vue")),
    osd: lazyTab(() => import("../components/tabs/OsdTab.vue")),
    setup: lazyTab(() => import("../components/tabs/SetupTab.vue")),
    pid_tuning: lazyTab(() => import("../components/tabs/PidTuningTab.vue")),
    preflight: lazyTab(() => import("../components/tabs/PreflightTab.vue")),
    vtx: lazyTab(() => import("../components/tabs/VtxTab.vue")),
    presets: lazyTab(() => import("../components/tabs/PresetsTab.vue")),
    log: lazyTab(() => import("../components/tabs/LogTab.vue")),
};
