"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VizRepoOrchestrator = void 0;
const capture_1 = require("./capture");
const discovery_1 = require("./discovery");
const storage_1 = require("./storage");
const git_1 = require("./git");
const hook_installer_1 = require("./hook-installer");
class VizRepoOrchestrator {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.gitManager = new git_1.GitManager(projectRoot);
        this.storageManager = new storage_1.StorageManager({ projectRoot });
        this.capture = new capture_1.ScreenshotCapture();
    }
    /**
     * Initialize VizRepoAssist for the current project
     */
    async initialize() {
        try {
            // Check if git repository
            if (!this.gitManager.isGitRepository()) {
                return {
                    success: false,
                    message: 'Not a git repository. Run "git init" first.',
                };
            }
            // Initialize storage directory structure
            const hookInstaller = new hook_installer_1.HookInstaller(this.projectRoot);
            const initResult = hookInstaller.initializeVizRepoDirectory();
            if (!initResult.success) {
                return initResult;
            }
            // Initialize storage manager
            await this.storageManager.initialize();
            return {
                success: true,
                message: 'VizRepoAssist initialized successfully! Run "vizrepo install-hook" to set up automatic screenshot capture.',
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Initialization failed: ${error}`,
            };
        }
    }
    /**
     * Install the pre-commit hook
     */
    async installHook(force = false) {
        const hookInstaller = new hook_installer_1.HookInstaller(this.projectRoot);
        return await hookInstaller.installPreCommitHook({ projectRoot: this.projectRoot, force });
    }
    /**
     * Main orchestration method - captures screenshots for all discovered routes
     */
    async captureScreenshots(options = {}) {
        const { baseUrl = 'http://localhost:3000', includeRoutes, excludeRoutes, skipIfNoServer = true, timeout = 30000, } = options;
        const errors = [];
        try {
            // Check if this is a git repository
            if (!this.gitManager.isGitRepository()) {
                return {
                    success: false,
                    message: 'Not a git repository. Screenshots can only be captured in git repositories.',
                };
            }
            // Check if we're in the middle of a git operation
            if (this.gitManager.isInGitOperation()) {
                return {
                    success: false,
                    message: 'Git operation in progress (merge, rebase, etc.). Skipping screenshot capture.',
                };
            }
            // Test server availability if requested
            if (skipIfNoServer) {
                const serverAvailable = await this.testServerAvailability(baseUrl);
                if (!serverAvailable) {
                    return {
                        success: false,
                        message: `Development server not available at ${baseUrl}. Start your server first or use --no-skip-server.`,
                    };
                }
            }
            // Initialize storage and create new session
            await this.storageManager.initialize();
            const session = await this.storageManager.createCaptureSession();
            console.log(`📸 Starting screenshot capture session: ${session.sessionId}`);
            // Discover routes
            const discovery = new discovery_1.RouteDiscovery({
                projectRoot: this.projectRoot,
                baseUrl,
                include: includeRoutes,
                exclude: excludeRoutes,
            });
            const routes = await discovery.discoverRoutes();
            if (routes.length === 0) {
                return {
                    success: false,
                    message: 'No routes discovered. Ensure your Next.js app has pages in app/ or pages/ directory.',
                    sessionId: session.sessionId,
                };
            }
            console.log(`🔍 Discovered ${routes.length} routes to capture`);
            // Initialize screenshot capture
            await this.capture.init();
            let successCount = 0;
            const routeErrors = [];
            // Capture screenshots for each route
            for (const route of routes) {
                try {
                    console.log(`📸 Capturing: ${route.path}`);
                    const desktopPath = this.storageManager.generateScreenshotPath(session, route.path, 'desktop', { width: 1920, height: 1200 });
                    const mobilePath = this.storageManager.generateScreenshotPath(session, route.path, 'mobile', { width: 390, height: 844 });
                    const results = await this.capture.captureMultiViewport(route.fullUrl, { desktop: desktopPath, mobile: mobilePath }, { timeout });
                    let routeSuccess = 0;
                    for (const result of results) {
                        if (result.success) {
                            routeSuccess++;
                        }
                        else {
                            routeErrors.push(`${route.path} (${result.viewport.name}): ${result.error}`);
                        }
                    }
                    if (routeSuccess > 0) {
                        successCount++;
                        console.log(`✅ ${route.path}: ${routeSuccess}/2 viewports captured`);
                    }
                    else {
                        console.log(`❌ ${route.path}: Failed to capture any viewports`);
                    }
                }
                catch (error) {
                    const errorMsg = `${route.path}: ${error}`;
                    routeErrors.push(errorMsg);
                    console.log(`❌ ${errorMsg}`);
                }
            }
            // Cleanup old sessions
            await this.storageManager.cleanup();
            // Close screenshot capture
            await this.capture.close();
            const totalRoutes = routes.length;
            const hasErrors = routeErrors.length > 0;
            return {
                success: successCount > 0,
                message: hasErrors
                    ? `Screenshot capture completed with issues: ${successCount}/${totalRoutes} routes captured successfully.`
                    : `Screenshot capture successful: ${successCount}/${totalRoutes} routes captured.`,
                sessionId: session.sessionId,
                capturedRoutes: successCount,
                errors: hasErrors ? routeErrors : undefined,
            };
        }
        catch (error) {
            // Ensure browser cleanup
            try {
                await this.capture.close();
            }
            catch {
                // ignore cleanup errors
            }
            return {
                success: false,
                message: `Screenshot capture failed: ${error}`,
                errors: [...errors, String(error)],
            };
        }
    }
    /**
     * Test if the development server is available
     */
    async testServerAvailability(baseUrl) {
        try {
            const response = await fetch(baseUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    /**
     * Get project status information
     */
    async getStatus() {
        const isGitRepo = this.gitManager.isGitRepository();
        let currentBranch;
        let currentCommit;
        let hasChanges;
        if (isGitRepo) {
            try {
                const status = await this.gitManager.getStatus();
                currentBranch = status.currentBranch;
                currentCommit = status.currentCommit;
                hasChanges = status.hasChanges;
            }
            catch {
                // ignore status errors
            }
        }
        const hookInstaller = new hook_installer_1.HookInstaller(this.projectRoot);
        const hookInstalled = hookInstaller.isHookInstalled();
        // Check if .vizrepo directory exists
        const fs = require('fs');
        const path = require('path');
        const vizRepoDir = path.join(this.projectRoot, '.vizrepo');
        const vizRepoInitialized = fs.existsSync(vizRepoDir);
        return {
            gitRepository: isGitRepo,
            vizRepoInitialized,
            hookInstalled,
            currentBranch,
            currentCommit,
            hasChanges,
        };
    }
    /**
     * List recent capture sessions
     */
    async listSessions(limit = 10) {
        try {
            const sessions = await this.storageManager.getSessions();
            return sessions.slice(0, limit);
        }
        catch {
            return [];
        }
    }
    /**
     * Cleanup old capture sessions
     */
    async cleanup() {
        try {
            await this.storageManager.cleanup();
            return {
                success: true,
                message: 'Cleanup completed successfully.',
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Cleanup failed: ${error}`,
            };
        }
    }
}
exports.VizRepoOrchestrator = VizRepoOrchestrator;
//# sourceMappingURL=orchestrator.js.map