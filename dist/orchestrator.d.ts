export interface OrchestrationOptions {
    baseUrl?: string;
    includeRoutes?: string[];
    excludeRoutes?: string[];
    skipIfNoServer?: boolean;
    timeout?: number;
}
export interface OrchestrationResult {
    success: boolean;
    message: string;
    sessionId?: string;
    capturedRoutes?: number;
    errors?: string[];
}
export declare class VizRepoOrchestrator {
    private projectRoot;
    private gitManager;
    private storageManager;
    private capture;
    constructor(projectRoot: string);
    /**
     * Initialize VizRepoAssist for the current project
     */
    initialize(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Install the pre-commit hook
     */
    installHook(force?: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Main orchestration method - captures screenshots for all discovered routes
     */
    captureScreenshots(options?: OrchestrationOptions): Promise<OrchestrationResult>;
    /**
     * Test if the development server is available
     */
    private testServerAvailability;
    /**
     * Get project status information
     */
    getStatus(): Promise<{
        gitRepository: boolean;
        vizRepoInitialized: boolean;
        hookInstalled: boolean;
        currentBranch?: string;
        currentCommit?: string;
        hasChanges?: boolean;
    }>;
    /**
     * List recent capture sessions
     */
    listSessions(limit?: number): Promise<any[]>;
    /**
     * Cleanup old capture sessions
     */
    cleanup(): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=orchestrator.d.ts.map