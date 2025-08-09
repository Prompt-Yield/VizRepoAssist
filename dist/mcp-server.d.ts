#!/usr/bin/env node
declare class VizRepoMCPServer {
    private server;
    private orchestrator;
    private projectRoot;
    constructor();
    private setupErrorHandling;
    private setupToolHandlers;
    private handleCaptureScreenshots;
    private handleGetProjectStatus;
    private handleInitializeProject;
    private handleInstallGitHook;
    private handleUninstallGitHook;
    private handleListCaptureSessions;
    private handleManageConfiguration;
    private getConfiguration;
    private setConfiguration;
    private resetConfiguration;
    private handleCleanupOldSessions;
    run(): Promise<void>;
}
export { VizRepoMCPServer };
//# sourceMappingURL=mcp-server.d.ts.map