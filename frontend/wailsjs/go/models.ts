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

