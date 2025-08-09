#!/usr/bin/env node
declare class VizRepoCli {
    private orchestrator;
    private projectRoot;
    constructor();
    private parseArgs;
    private runCommand;
    private handleInit;
    private handleCapture;
    private handleHook;
    private handleStatus;
    private handleList;
    private handleCleanup;
    private handleConfig;
    private showVersion;
    private showHelp;
    run(): Promise<void>;
}
export { VizRepoCli };
//# sourceMappingURL=cli.d.ts.map