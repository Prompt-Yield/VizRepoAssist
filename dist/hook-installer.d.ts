export interface HookInstallOptions {
    projectRoot?: string;
    force?: boolean;
    backup?: boolean;
}
export interface HookInstallResult {
    success: boolean;
    message: string;
    backupPath?: string;
    hookPath?: string;
}
export declare class HookInstaller {
    private gitManager;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Install the VizRepoAssist pre-commit hook
     */
    installPreCommitHook(options?: HookInstallOptions): Promise<HookInstallResult>;
    /**
     * Uninstall the VizRepoAssist pre-commit hook
     */
    uninstallPreCommitHook(): Promise<HookInstallResult>;
    /**
     * Check if VizRepoAssist hook is installed
     */
    isHookInstalled(): boolean;
    /**
     * Get hook status information
     */
    getHookStatus(): {
        installed: boolean;
        isVizRepoHook: boolean;
        hookPath?: string;
        executable?: boolean;
    };
    /**
     * Validate hook installation and permissions
     */
    validateHookInstallation(): {
        valid: boolean;
        issues: string[];
    };
    /**
     * Create VizRepoAssist configuration directory if it doesn't exist
     */
    initializeVizRepoDirectory(): {
        success: boolean;
        message: string;
    };
}
//# sourceMappingURL=hook-installer.d.ts.map