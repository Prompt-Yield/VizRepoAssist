import * as fs from 'fs';
import * as path from 'path';
import { GitManager } from './git';

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

export class HookInstaller {
  private gitManager: GitManager;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.gitManager = new GitManager(projectRoot);
  }

  /**
   * Install the VizRepoAssist pre-commit hook
   */
  public async installPreCommitHook(options: HookInstallOptions = {}): Promise<HookInstallResult> {
    const { force = false, backup = true } = options;

    // Validate git repository
    if (!this.gitManager.isGitRepository()) {
      return {
        success: false,
        message: 'Not a git repository. Initialize git first with: git init',
      };
    }

    try {
      const hooksDir = this.gitManager.getHooksDirectory();
      const hookPath = path.join(hooksDir, 'pre-commit');
      const templatePath = path.join(__dirname, '..', 'hooks', 'pre-commit');

      // Ensure hooks directory exists
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }

      // Check if hook already exists
      if (fs.existsSync(hookPath) && !force) {
        const existingContent = fs.readFileSync(hookPath, 'utf8');
        
        // Check if it's already our hook
        if (existingContent.includes('VizRepoAssist Pre-commit Hook')) {
          return {
            success: true,
            message: 'VizRepoAssist pre-commit hook is already installed.',
            hookPath,
          };
        }

        return {
          success: false,
          message: 'A pre-commit hook already exists. Use --force to overwrite or remove it manually.',
          hookPath,
        };
      }

      let backupPath: string | undefined;

      // Backup existing hook if requested and it exists
      if (backup && fs.existsSync(hookPath)) {
        backupPath = `${hookPath}.backup.${Date.now()}`;
        fs.copyFileSync(hookPath, backupPath);
      }

      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        return {
          success: false,
          message: `Hook template not found at: ${templatePath}`,
        };
      }

      // Copy our hook template
      fs.copyFileSync(templatePath, hookPath);

      // Make hook executable
      fs.chmodSync(hookPath, 0o755);

      return {
        success: true,
        message: 'VizRepoAssist pre-commit hook installed successfully!',
        hookPath,
        backupPath,
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to install pre-commit hook: ${error}`,
      };
    }
  }

  /**
   * Uninstall the VizRepoAssist pre-commit hook
   */
  public async uninstallPreCommitHook(): Promise<HookInstallResult> {
    if (!this.gitManager.isGitRepository()) {
      return {
        success: false,
        message: 'Not a git repository.',
      };
    }

    try {
      const hooksDir = this.gitManager.getHooksDirectory();
      const hookPath = path.join(hooksDir, 'pre-commit');

      if (!fs.existsSync(hookPath)) {
        return {
          success: true,
          message: 'No pre-commit hook found to remove.',
        };
      }

      const hookContent = fs.readFileSync(hookPath, 'utf8');

      // Only remove if it's our hook
      if (!hookContent.includes('VizRepoAssist Pre-commit Hook')) {
        return {
          success: false,
          message: 'Pre-commit hook exists but is not a VizRepoAssist hook. Remove manually if needed.',
          hookPath,
        };
      }

      // Remove the hook
      fs.unlinkSync(hookPath);

      return {
        success: true,
        message: 'VizRepoAssist pre-commit hook removed successfully.',
        hookPath,
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to uninstall pre-commit hook: ${error}`,
      };
    }
  }

  /**
   * Check if VizRepoAssist hook is installed
   */
  public isHookInstalled(): boolean {
    try {
      const hooksDir = this.gitManager.getHooksDirectory();
      const hookPath = path.join(hooksDir, 'pre-commit');

      if (!fs.existsSync(hookPath)) {
        return false;
      }

      const hookContent = fs.readFileSync(hookPath, 'utf8');
      return hookContent.includes('VizRepoAssist Pre-commit Hook');
    } catch {
      return false;
    }
  }

  /**
   * Get hook status information
   */
  public getHookStatus(): {
    installed: boolean;
    isVizRepoHook: boolean;
    hookPath?: string;
    executable?: boolean;
  } {
    try {
      const hooksDir = this.gitManager.getHooksDirectory();
      const hookPath = path.join(hooksDir, 'pre-commit');

      if (!fs.existsSync(hookPath)) {
        return {
          installed: false,
          isVizRepoHook: false,
        };
      }

      const hookContent = fs.readFileSync(hookPath, 'utf8');
      const isVizRepoHook = hookContent.includes('VizRepoAssist Pre-commit Hook');
      const stats = fs.statSync(hookPath);
      const executable = (stats.mode & parseInt('111', 8)) !== 0;

      return {
        installed: true,
        isVizRepoHook,
        hookPath,
        executable,
      };
    } catch {
      return {
        installed: false,
        isVizRepoHook: false,
      };
    }
  }

  /**
   * Validate hook installation and permissions
   */
  public validateHookInstallation(): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check if git repository
    if (!this.gitManager.isGitRepository()) {
      issues.push('Not a git repository');
      return { valid: false, issues };
    }

    // Check git installation
    if (!this.gitManager.validateGitInstallation()) {
      issues.push('Git is not installed or not working');
    }

    const status = this.getHookStatus();

    if (!status.installed) {
      issues.push('Pre-commit hook is not installed');
    } else {
      if (!status.isVizRepoHook) {
        issues.push('Pre-commit hook exists but is not a VizRepoAssist hook');
      }

      if (!status.executable) {
        issues.push('Pre-commit hook is not executable');
      }
    }

    // Check hooks directory permissions
    try {
      const hooksDir = this.gitManager.getHooksDirectory();
      if (!fs.existsSync(hooksDir)) {
        issues.push('Git hooks directory does not exist');
      } else {
        // Try to write a test file to check permissions
        const testFile = path.join(hooksDir, '.vizrepo-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      }
    } catch {
      issues.push('Cannot write to git hooks directory (permission issue)');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Create VizRepoAssist configuration directory if it doesn't exist
   */
  public initializeVizRepoDirectory(): { success: boolean; message: string } {
    try {
      const vizRepoDir = path.join(this.projectRoot, '.vizrepo');
      const screenshotsDir = path.join(vizRepoDir, 'screenshots');
      const configDir = path.join(vizRepoDir, 'config');

      // Create directories
      fs.mkdirSync(vizRepoDir, { recursive: true });
      fs.mkdirSync(screenshotsDir, { recursive: true });
      fs.mkdirSync(configDir, { recursive: true });

      // Create initial index.json if it doesn't exist
      const indexPath = path.join(vizRepoDir, 'index.json');
      if (!fs.existsSync(indexPath)) {
        const initialMetadata = {
          sessions: [],
          lastCleanup: new Date().toISOString(),
        };
        fs.writeFileSync(indexPath, JSON.stringify(initialMetadata, null, 2));
      }

      return {
        success: true,
        message: 'VizRepoAssist directory structure initialized successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize VizRepoAssist directory: ${error}`,
      };
    }
  }
}