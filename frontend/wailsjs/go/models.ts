export namespace main {
	
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
	export class BinarySetupResult {
	    adb?: BinaryInfo;
	    fastboot?: BinaryInfo;
	    scrcpy?: BinaryInfo;
	    ready: boolean;
	
	    static createFrom(source: any = {}) {
	        return new BinarySetupResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.adb = this.convertValues(source["adb"], BinaryInfo);
	        this.fastboot = this.convertValues(source["fastboot"], BinaryInfo);
	        this.scrcpy = this.convertValues(source["scrcpy"], BinaryInfo);
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
	export class DeviceInfo {
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
	        return new DeviceInfo(source);
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
	export class DeviceSummary {
	    serial: string;
	    state: string;
	    mode: string;
	    product?: string;
	    model?: string;
	    device?: string;
	    transportId?: string;
	
	    static createFrom(source: any = {}) {
	        return new DeviceSummary(source);
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
	export class FileEntry {
	    name: string;
	    path: string;
	    type: string;
	    size: number;
	    sizeHuman: string;
	    permissions: string;
	    modifiedAt: string;
	    isHidden: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileEntry(source);
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
	export class PackageDetails {
	    packageName: string;
	    versionName: string;
	    versionCode: string;
	    apkSizeBytes: number;
	    dataSizeBytes: number;
	    totalSizeBytes: number;
	
	    static createFrom(source: any = {}) {
	        return new PackageDetails(source);
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
	export class PackageInfo {
	    packageName: string;
	    isEnabled: boolean;
	    isSystemApp: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PackageInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.packageName = source["packageName"];
	        this.isEnabled = source["isEnabled"];
	        this.isSystemApp = source["isSystemApp"];
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

