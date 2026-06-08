export namespace audit {
	
	export class Entry {
	    id: number;
	    // Go type: time
	    timestamp: any;
	    level: string;
	    operation: string;
	    message: string;
	    details?: string;
	    duration?: string;
	    success: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Entry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.level = source["level"];
	        this.operation = source["operation"];
	        this.message = source["message"];
	        this.details = source["details"];
	        this.duration = source["duration"];
	        this.success = source["success"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace binary {
	
	export class BinarySetupResult {
	    adb?: core.BinaryInfo;
	    fastboot?: core.BinaryInfo;
	    scrcpy?: core.BinaryInfo;
	    ready: boolean;
	
	    static createFrom(source: any = {}) {
	        return new BinarySetupResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.adb = this.convertValues(source["adb"], core.BinaryInfo);
	        this.fastboot = this.convertValues(source["fastboot"], core.BinaryInfo);
	        this.scrcpy = this.convertValues(source["scrcpy"], core.BinaryInfo);
	        this.ready = source["ready"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SetupState {
	    status?: BinarySetupResult;
	    setupCompleted: boolean;
	    canFinish: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SetupState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = this.convertValues(source["status"], BinarySetupResult);
	        this.setupCompleted = source["setupCompleted"];
	        this.canFinish = source["canFinish"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace core {
	
	export class ScrcpyOptions {
	    max_size: number;
	    bit_rate: number;
	    max_fps: number;
	    audio_bit_rate: number;
	    audio_codec: string;
	    video_codec: string;
	    show_touches: boolean;
	    no_audio: boolean;
	    no_control: boolean;
	    stay_awake: boolean;
	    turn_screen_off: boolean;
	    power_off_on_close: boolean;
	    fullscreen: boolean;
	    always_on_top: boolean;
	    disable_screensaver: boolean;
	    rotation: number;
	    display_id: number;
	    time_limit: number;
	
	    static createFrom(source: any = {}) {
	        return new ScrcpyOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.max_size = source["max_size"];
	        this.bit_rate = source["bit_rate"];
	        this.max_fps = source["max_fps"];
	        this.audio_bit_rate = source["audio_bit_rate"];
	        this.audio_codec = source["audio_codec"];
	        this.video_codec = source["video_codec"];
	        this.show_touches = source["show_touches"];
	        this.no_audio = source["no_audio"];
	        this.no_control = source["no_control"];
	        this.stay_awake = source["stay_awake"];
	        this.turn_screen_off = source["turn_screen_off"];
	        this.power_off_on_close = source["power_off_on_close"];
	        this.fullscreen = source["fullscreen"];
	        this.always_on_top = source["always_on_top"];
	        this.disable_screensaver = source["disable_screensaver"];
	        this.rotation = source["rotation"];
	        this.display_id = source["display_id"];
	        this.time_limit = source["time_limit"];
	    }
	}
	export class ScrcpyPreset {
	    name: string;
	    options: ScrcpyOptions;
	
	    static createFrom(source: any = {}) {
	        return new ScrcpyPreset(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.options = this.convertValues(source["options"], ScrcpyOptions);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AppConfigSnapshot {
	    adb_path: string;
	    fastboot_path: string;
	    scrcpy_path: string;
	    setup_completed: boolean;
	    theme: string;
	    binary_versions: Record<string, string>;
	    device_nicknames: Record<string, string>;
	    logcat_buffer_limit: number;
	    scrcpy_presets: ScrcpyPreset[];
	
	    static createFrom(source: any = {}) {
	        return new AppConfigSnapshot(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.adb_path = source["adb_path"];
	        this.fastboot_path = source["fastboot_path"];
	        this.scrcpy_path = source["scrcpy_path"];
	        this.setup_completed = source["setup_completed"];
	        this.theme = source["theme"];
	        this.binary_versions = source["binary_versions"];
	        this.device_nicknames = source["device_nicknames"];
	        this.logcat_buffer_limit = source["logcat_buffer_limit"];
	        this.scrcpy_presets = this.convertValues(source["scrcpy_presets"], ScrcpyPreset);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BinaryInfo {
	    name: string;
	    path: string;
	    source: string;
	    status: string;
	    version?: string;
	    reason?: string;
	
	    static createFrom(source: any = {}) {
	        return new BinaryInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.source = source["source"];
	        this.status = source["status"];
	        this.version = source["version"];
	        this.reason = source["reason"];
	    }
	}
	export class PreferencesPayload {
	    theme: string;
	    device_nicknames: Record<string, string>;
	    logcat_buffer_limit: number;
	    scrcpy_presets: ScrcpyPreset[];
	
	    static createFrom(source: any = {}) {
	        return new PreferencesPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.device_nicknames = source["device_nicknames"];
	        this.logcat_buffer_limit = source["logcat_buffer_limit"];
	        this.scrcpy_presets = this.convertValues(source["scrcpy_presets"], ScrcpyPreset);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RuntimeDiagnostics {
	    os: string;
	    arch: string;
	    data_dir: string;
	    config_path: string;
	    managed_binary_dir: string;
	    setup_completed: boolean;
	    theme: string;
	    binary_versions: Record<string, string>;
	    capabilities: Record<string, boolean>;
	
	    static createFrom(source: any = {}) {
	        return new RuntimeDiagnostics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.os = source["os"];
	        this.arch = source["arch"];
	        this.data_dir = source["data_dir"];
	        this.config_path = source["config_path"];
	        this.managed_binary_dir = source["managed_binary_dir"];
	        this.setup_completed = source["setup_completed"];
	        this.theme = source["theme"];
	        this.binary_versions = source["binary_versions"];
	        this.capabilities = source["capabilities"];
	    }
	}
	

}

export namespace device {
	
	export class Info {
	    serial: string;
	    state: string;
	    mode: string;
	    product?: string;
	    model?: string;
	    device?: string;
	    brand?: string;
	    codename?: string;
	    manufacturer?: string;
	    androidVersion?: string;
	    sdkVersion?: string;
	    buildId?: string;
	    securityPatch?: string;
	    abis?: string;
	    transportId?: string;
	    connectionLabel?: string;
	    ipAddress?: string;
	    rootStatus?: string;
	    batteryLevel?: string;
	    storageInfo?: string;
	    ramTotal?: string;
	
	    static createFrom(source: any = {}) {
	        return new Info(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serial = source["serial"];
	        this.state = source["state"];
	        this.mode = source["mode"];
	        this.product = source["product"];
	        this.model = source["model"];
	        this.device = source["device"];
	        this.brand = source["brand"];
	        this.codename = source["codename"];
	        this.manufacturer = source["manufacturer"];
	        this.androidVersion = source["androidVersion"];
	        this.sdkVersion = source["sdkVersion"];
	        this.buildId = source["buildId"];
	        this.securityPatch = source["securityPatch"];
	        this.abis = source["abis"];
	        this.transportId = source["transportId"];
	        this.connectionLabel = source["connectionLabel"];
	        this.ipAddress = source["ipAddress"];
	        this.rootStatus = source["rootStatus"];
	        this.batteryLevel = source["batteryLevel"];
	        this.storageInfo = source["storageInfo"];
	        this.ramTotal = source["ramTotal"];
	    }
	}
	export class PerformanceSnapshot {
	    serial: string;
	    cpuUsage: number;
	    ramUsage: number;
	    ramUsedBytes?: number;
	    ramTotalBytes?: number;
	    networkRxBytes?: number;
	    networkTxBytes?: number;
	    networkRxSec: number;
	    networkTxSec: number;
	    batteryLevel?: number;
	    batteryTemperatureC?: number;
	    storageUsedBytes?: number;
	    storageTotalBytes?: number;
	    uptimeSeconds?: number;
	
	    static createFrom(source: any = {}) {
	        return new PerformanceSnapshot(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serial = source["serial"];
	        this.cpuUsage = source["cpuUsage"];
	        this.ramUsage = source["ramUsage"];
	        this.ramUsedBytes = source["ramUsedBytes"];
	        this.ramTotalBytes = source["ramTotalBytes"];
	        this.networkRxBytes = source["networkRxBytes"];
	        this.networkTxBytes = source["networkTxBytes"];
	        this.networkRxSec = source["networkRxSec"];
	        this.networkTxSec = source["networkTxSec"];
	        this.batteryLevel = source["batteryLevel"];
	        this.batteryTemperatureC = source["batteryTemperatureC"];
	        this.storageUsedBytes = source["storageUsedBytes"];
	        this.storageTotalBytes = source["storageTotalBytes"];
	        this.uptimeSeconds = source["uptimeSeconds"];
	    }
	}
	export class Summary {
	    serial: string;
	    state: string;
	    mode: string;
	    product?: string;
	    model?: string;
	    device?: string;
	    transportId?: string;
	
	    static createFrom(source: any = {}) {
	        return new Summary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serial = source["serial"];
	        this.state = source["state"];
	        this.mode = source["mode"];
	        this.product = source["product"];
	        this.model = source["model"];
	        this.device = source["device"];
	        this.transportId = source["transportId"];
	    }
	}

}

export namespace dialog {
	
	export class PlatformToolsSelection {
	    directory: string;
	    adbPath: string;
	    fastbootPath: string;
	
	    static createFrom(source: any = {}) {
	        return new PlatformToolsSelection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.directory = source["directory"];
	        this.adbPath = source["adbPath"];
	        this.fastbootPath = source["fastbootPath"];
	    }
	}

}

export namespace file {
	
	export class Entry {
	    name: string;
	    path: string;
	    type: string;
	    size: number;
	    sizeHuman: string;
	    permissions: string;
	    modifiedAt: string;
	    isHidden: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Entry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.type = source["type"];
	        this.size = source["size"];
	        this.sizeHuman = source["sizeHuman"];
	        this.permissions = source["permissions"];
	        this.modifiedAt = source["modifiedAt"];
	        this.isHidden = source["isHidden"];
	    }
	}
	export class StorageInfo {
	    mountPoint: string;
	    totalBytes: number;
	    usedBytes: number;
	    freeBytes: number;
	    usedPct: number;
	
	    static createFrom(source: any = {}) {
	        return new StorageInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mountPoint = source["mountPoint"];
	        this.totalBytes = source["totalBytes"];
	        this.usedBytes = source["usedBytes"];
	        this.freeBytes = source["freeBytes"];
	        this.usedPct = source["usedPct"];
	    }
	}

}

export namespace flasher {
	
	export class FastbootDeviceInfo {
	    serial: string;
	    state: string;
	    mode: string;
	
	    static createFrom(source: any = {}) {
	        return new FastbootDeviceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serial = source["serial"];
	        this.state = source["state"];
	        this.mode = source["mode"];
	    }
	}
	export class Step {
	    partition: string;
	    image_file: string;
	
	    static createFrom(source: any = {}) {
	        return new Step(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.partition = source["partition"];
	        this.image_file = source["image_file"];
	    }
	}
	export class Plan {
	    steps: Step[];
	
	    static createFrom(source: any = {}) {
	        return new Plan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.steps = this.convertValues(source["steps"], Step);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace packagemgr {
	
	export class Details {
	    packageName: string;
	    versionName: string;
	    versionCode: string;
	    apkSizeBytes: number;
	    dataSizeBytes: number;
	    totalSizeBytes: number;
	
	    static createFrom(source: any = {}) {
	        return new Details(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.packageName = source["packageName"];
	        this.versionName = source["versionName"];
	        this.versionCode = source["versionCode"];
	        this.apkSizeBytes = source["apkSizeBytes"];
	        this.dataSizeBytes = source["dataSizeBytes"];
	        this.totalSizeBytes = source["totalSizeBytes"];
	    }
	}
	export class Info {
	    packageName: string;
	    isEnabled: boolean;
	    isSystemApp: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Info(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.packageName = source["packageName"];
	        this.isEnabled = source["isEnabled"];
	        this.isSystemApp = source["isSystemApp"];
	    }
	}

}

export namespace scrcpy {
	
	export class CodecSupport {
	    codec: string;
	    encoderName: string;
	    hardware: boolean;
	    vendor: boolean;
	    softwareOnly: boolean;
	    recommended: boolean;
	    aliasOf: string;
	
	    static createFrom(source: any = {}) {
	        return new CodecSupport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.codec = source["codec"];
	        this.encoderName = source["encoderName"];
	        this.hardware = source["hardware"];
	        this.vendor = source["vendor"];
	        this.softwareOnly = source["softwareOnly"];
	        this.recommended = source["recommended"];
	        this.aliasOf = source["aliasOf"];
	    }
	}
	export class EncoderSupport {
	    serial: string;
	    videoCodecs: CodecSupport[];
	    audioCodecs: CodecSupport[];
	
	    static createFrom(source: any = {}) {
	        return new EncoderSupport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serial = source["serial"];
	        this.videoCodecs = this.convertValues(source["videoCodecs"], CodecSupport);
	        this.audioCodecs = this.convertValues(source["audioCodecs"], CodecSupport);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Options {
	    max_size: number;
	    bit_rate: number;
	    max_fps: number;
	    audio_bit_rate: number;
	    audio_codec: string;
	    video_codec: string;
	    show_touches: boolean;
	    no_audio: boolean;
	    no_control: boolean;
	    stay_awake: boolean;
	    turn_screen_off: boolean;
	    power_off_on_close: boolean;
	    fullscreen: boolean;
	    always_on_top: boolean;
	    disable_screensaver: boolean;
	    rotation: number;
	    display_id: number;
	    time_limit: number;
	
	    static createFrom(source: any = {}) {
	        return new Options(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.max_size = source["max_size"];
	        this.bit_rate = source["bit_rate"];
	        this.max_fps = source["max_fps"];
	        this.audio_bit_rate = source["audio_bit_rate"];
	        this.audio_codec = source["audio_codec"];
	        this.video_codec = source["video_codec"];
	        this.show_touches = source["show_touches"];
	        this.no_audio = source["no_audio"];
	        this.no_control = source["no_control"];
	        this.stay_awake = source["stay_awake"];
	        this.turn_screen_off = source["turn_screen_off"];
	        this.power_off_on_close = source["power_off_on_close"];
	        this.fullscreen = source["fullscreen"];
	        this.always_on_top = source["always_on_top"];
	        this.disable_screensaver = source["disable_screensaver"];
	        this.rotation = source["rotation"];
	        this.display_id = source["display_id"];
	        this.time_limit = source["time_limit"];
	    }
	}
	export class Session {
	    id: string;
	    serial: string;
	    status: string;
	    pid: number;
	    startedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new Session(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.serial = source["serial"];
	        this.status = source["status"];
	        this.pid = source["pid"];
	        this.startedAt = source["startedAt"];
	    }
	}

}

export namespace shell {
	
	export class Session {
	    id: string;
	    serial: string;
	    mode: string;
	
	    static createFrom(source: any = {}) {
	        return new Session(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.serial = source["serial"];
	        this.mode = source["mode"];
	    }
	}

}

