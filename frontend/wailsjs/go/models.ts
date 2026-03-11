export namespace backend {
	
	export class CommandLogEntry {
	    id: number;
	    timestamp: string;
	    serial: string;
	    mode: string;
	    command: string;
	    durationMs: number;
	    status: string;
	    outputPreview: string;
	
	    static createFrom(source: any = {}) {
	        return new CommandLogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = source["timestamp"];
	        this.serial = source["serial"];
	        this.mode = source["mode"];
	        this.command = source["command"];
	        this.durationMs = source["durationMs"];
	        this.status = source["status"];
	        this.outputPreview = source["outputPreview"];
	    }
	}
	export class Device {
	    Serial: string;
	    Status: string;
	
	    static createFrom(source: any = {}) {
	        return new Device(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Serial = source["Serial"];
	        this.Status = source["Status"];
	    }
	}
	export class DeviceInfo {
	    Model: string;
	    AndroidVersion: string;
	    BuildNumber: string;
	    BatteryLevel: string;
	    Serial: string;
	    IPAddress: string;
	    RootStatus: string;
	    Codename: string;
	    RamTotal: string;
	    StorageInfo: string;
	    Brand: string;
	    DeviceName: string;
	
	    static createFrom(source: any = {}) {
	        return new DeviceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Model = source["Model"];
	        this.AndroidVersion = source["AndroidVersion"];
	        this.BuildNumber = source["BuildNumber"];
	        this.BatteryLevel = source["BatteryLevel"];
	        this.Serial = source["Serial"];
	        this.IPAddress = source["IPAddress"];
	        this.RootStatus = source["RootStatus"];
	        this.Codename = source["Codename"];
	        this.RamTotal = source["RamTotal"];
	        this.StorageInfo = source["StorageInfo"];
	        this.Brand = source["Brand"];
	        this.DeviceName = source["DeviceName"];
	    }
	}
	export class FileEntry {
	    Name: string;
	    Type: string;
	    Size: string;
	    Permissions: string;
	    Date: string;
	    Time: string;
	
	    static createFrom(source: any = {}) {
	        return new FileEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Type = source["Type"];
	        this.Size = source["Size"];
	        this.Permissions = source["Permissions"];
	        this.Date = source["Date"];
	        this.Time = source["Time"];
	    }
	}
	export class FlashStep {
	    partition: string;
	    imageFile: string;
	
	    static createFrom(source: any = {}) {
	        return new FlashStep(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.partition = source["partition"];
	        this.imageFile = source["imageFile"];
	    }
	}
	export class FlashPlan {
	    steps: FlashStep[];
	
	    static createFrom(source: any = {}) {
	        return new FlashPlan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.steps = this.convertValues(source["steps"], FlashStep);
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
	
	export class PackageInfo {
	    PackageName: string;
	    IsEnabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PackageInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.PackageName = source["PackageName"];
	        this.IsEnabled = source["IsEnabled"];
	    }
	}
	export class PerformanceSnapshot {
	    cpuUsage: number;
	    ramUsage: number;
	    networkRxSec: number;
	    networkTxSec: number;
	
	    static createFrom(source: any = {}) {
	        return new PerformanceSnapshot(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cpuUsage = source["cpuUsage"];
	        this.ramUsage = source["ramUsage"];
	        this.networkRxSec = source["networkRxSec"];
	        this.networkTxSec = source["networkTxSec"];
	    }
	}

}

