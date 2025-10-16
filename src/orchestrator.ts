import { ScreenshotCapture } from './capture';
import { RouteDiscovery } from './discovery';
import { StorageManager } from './storage';
import { GitManager } from './git';
import { HookInstaller } from './hook-installer';

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

export class VizRepoOrchestrator {
  private projectRoot: string;
  private gitManager: GitManager;
  private storageManager: StorageManager;
  private capture: ScreenshotCapture;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.gitManager = new GitManager(projectRoot);
    this.storageManager = new StorageManager({ projectRoot });
    this.capture = new ScreenshotCapture();
  }

  /**
   * Initialize VizRepoAssist for the current project
   */
  public async initialize(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if git repository
      if (!this.gitManager.isGitRepository()) {
        return {
          success: false,
          message: 'Not a git repository. Run "git init" first.',
        };
      }

      // Initialize storage directory structure
      const hookInstaller = new HookInstaller(this.projectRoot);
      const initResult = hookInstaller.initializeVizRepoDirectory();

      if (!initResult.success) {
        return initResult;
      }

      // Initialize storage manager
      await this.storageManager.initialize();

      return {
        success: true,
        message:
          'VizRepoAssist initialized successfully! Run "vizrepo install-hook" to set up automatic screenshot capture.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Initialization failed: ${error}`,
      };
    }
  }

  /**
   * Install the pre-commit hook
   */
  public async installHook(
    force = false
  ): Promise<{ success: boolean; message: string }> {
    const hookInstaller = new HookInstaller(this.projectRoot);
    return await hookInstaller.installPreCommitHook({
      projectRoot: this.projectRoot,
      force,
    });
  }

  /**
   * Main orchestration method - captures screenshots for all discovered routes
   */
  public async captureScreenshots(
    options: OrchestrationOptions = {}
  ): Promise<OrchestrationResult> {
    const {
      baseUrl = 'http://localhost:3000',
      includeRoutes,
      excludeRoutes,
      skipIfNoServer = true,
      timeout = 30000,
    } = options;

    const errors: string[] = [];

    try {
      // Check if this is a git repository
      if (!this.gitManager.isGitRepository()) {
        return {
          success: false,
          message:
            'Not a git repository. Screenshots can only be captured in git repositories.',
        };
      }

      // Check if we're in the middle of a git operation
      if (this.gitManager.isInGitOperation()) {
        return {
          success: false,
          message:
            'Git operation in progress (merge, rebase, etc.). Skipping screenshot capture.',
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

      console.log(
        `📸 Starting screenshot capture session: ${session.sessionId}`
      );

      // Discover routes
      const discovery = new RouteDiscovery({
        projectRoot: this.projectRoot,
        baseUrl,
        include: includeRoutes,
        exclude: excludeRoutes,
      });

      const routes = await discovery.discoverRoutes();

      if (routes.length === 0) {
        return {
          success: false,
          message:
            'No routes discovered. Ensure your Next.js app has pages in app/ or pages/ directory.',
          sessionId: session.sessionId,
        };
      }

      console.log(`🔍 Discovered ${routes.length} routes to capture`);

      // Initialize screenshot capture
      await this.capture.init();

      let successCount = 0;
      const routeErrors: string[] = [];

      // Capture screenshots for each route
      for (const route of routes) {
        try {
          console.log(`📸 Capturing: ${route.path}`);

          const desktopPath = this.storageManager.generateScreenshotPath(
            session,
            route.path,
            'desktop',
            { width: 1920, height: 1200 }
          );

          const mobilePath = this.storageManager.generateScreenshotPath(
            session,
            route.path,
            'mobile',
            { width: 390, height: 844 }
          );

          const results = await this.capture.captureMultiViewport(
            route.fullUrl,
            { desktop: desktopPath, mobile: mobilePath },
            { timeout }
          );

          let routeSuccess = 0;
          for (const result of results) {
            if (result.success) {
              routeSuccess++;
            } else {
              routeErrors.push(
                `${route.path} (${result.viewport.name}): ${result.error}`
              );
            }
          }

          if (routeSuccess > 0) {
            successCount++;
            console.log(
              `✅ ${route.path}: ${routeSuccess}/2 viewports captured`
            );
          } else {
            console.log(`❌ ${route.path}: Failed to capture any viewports`);
          }
        } catch (error) {
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
    } catch (error) {
      // Ensure browser cleanup
      try {
        await this.capture.close();
      } catch {
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
  private async testServerAvailability(baseUrl: string): Promise<boolean> {
    try {
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get project status information
   */
  public async getStatus(): Promise<{
    gitRepository: boolean;
    vizRepoInitialized: boolean;
    hookInstalled: boolean;
    currentBranch?: string;
    currentCommit?: string;
    hasChanges?: boolean;
  }> {
    const isGitRepo = this.gitManager.isGitRepository();

    let currentBranch: string | undefined;
    let currentCommit: string | undefined;
    let hasChanges: boolean | undefined;

    if (isGitRepo) {
      try {
        const status = await this.gitManager.getStatus();
        currentBranch = status.currentBranch;
        currentCommit = status.currentCommit;
        hasChanges = status.hasChanges;
      } catch {
        // ignore status errors
      }
    }

    const hookInstaller = new HookInstaller(this.projectRoot);
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
  public async listSessions(limit = 10): Promise<any[]> {
    try {
      const sessions = await this.storageManager.getSessions();
      return sessions.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Cleanup old capture sessions
   */
  public async cleanup(): Promise<{ success: boolean; message: string }> {
    try {
      await this.storageManager.cleanup();
      return {
        success: true,
        message: 'Cleanup completed successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Cleanup failed: ${error}`,
      };
    }
  }
}
