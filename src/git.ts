import { execSync } from 'child_process';
import * as path from 'path';

export interface GitStatus {
  isRepository: boolean;
  hasChanges: boolean;
  stagedFiles: string[];
  modifiedFiles: string[];
  untrackedFiles: string[];
  currentBranch: string;
  currentCommit: string;
}

export interface GitRepositoryInfo {
  projectRoot: string;
  gitDir: string;
  isRepository: boolean;
}

export class GitManager {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Check if the current directory is a git repository
   */
  public isGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        encoding: 'utf8',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current commit hash (short format)
   */
  public getCurrentCommitHash(): string {
    try {
      return execSync('git rev-parse --short HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      }).trim();
    } catch (error) {
      throw new Error(`Failed to get commit hash: ${error}`);
    }
  }

  /**
   * Get current branch name
   */
  public getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      }).trim();
    } catch (error) {
      throw new Error(`Failed to get branch name: ${error}`);
    }
  }

  /**
   * Get comprehensive git status
   */
  public async getStatus(): Promise<GitStatus> {
    if (!this.isGitRepository()) {
      return {
        isRepository: false,
        hasChanges: false,
        stagedFiles: [],
        modifiedFiles: [],
        untrackedFiles: [],
        currentBranch: '',
        currentCommit: '',
      };
    }

    try {
      const currentBranch = this.getCurrentBranch();
      const currentCommit = this.getCurrentCommitHash();

      // Get porcelain status for parsing
      const statusOutput = execSync('git status --porcelain', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      }).trimEnd(); // Only trim trailing whitespace, not leading

      const stagedFiles: string[] = [];
      const modifiedFiles: string[] = [];
      const untrackedFiles: string[] = [];

      if (statusOutput) {
        const lines = statusOutput.split('\n');
        for (const line of lines) {
          if (line.length >= 3) {
            const indexStatus = line[0];
            const workTreeStatus = line[1];
            const fileName = line.slice(3);

            // Staged files (index status)
            if (indexStatus !== ' ' && indexStatus !== '?') {
              stagedFiles.push(fileName);
            }

            // Modified files (work tree status)
            if (workTreeStatus === 'M') {
              modifiedFiles.push(fileName);
            }

            // Untracked files
            if (indexStatus === '?' && workTreeStatus === '?') {
              untrackedFiles.push(fileName);
            }
          }
        }
      }

      const hasChanges =
        stagedFiles.length > 0 ||
        modifiedFiles.length > 0 ||
        untrackedFiles.length > 0;

      return {
        isRepository: true,
        hasChanges,
        stagedFiles,
        modifiedFiles,
        untrackedFiles,
        currentBranch,
        currentCommit,
      };
    } catch (error) {
      throw new Error(`Failed to get git status: ${error}`);
    }
  }

  /**
   * Check if there are any staged changes
   */
  public hasStagedChanges(): boolean {
    try {
      const output = execSync('git diff --cached --name-only', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      }).trim();
      return output.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get the git hooks directory path
   */
  public getHooksDirectory(): string {
    try {
      const gitDir = execSync('git rev-parse --git-dir', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      }).trim();

      // Handle relative git dir (e.g., ".git")
      const fullGitDir = path.isAbsolute(gitDir)
        ? gitDir
        : path.join(this.projectRoot, gitDir);

      return path.join(fullGitDir, 'hooks');
    } catch (error) {
      throw new Error(`Failed to get hooks directory: ${error}`);
    }
  }

  /**
   * Get repository information
   */
  public getRepositoryInfo(): GitRepositoryInfo {
    const isRepository = this.isGitRepository();

    let gitDir = '';
    if (isRepository) {
      try {
        gitDir = execSync('git rev-parse --git-dir', {
          cwd: this.projectRoot,
          encoding: 'utf8',
        }).trim();

        if (!path.isAbsolute(gitDir)) {
          gitDir = path.join(this.projectRoot, gitDir);
        }
      } catch {
        // ignore error, gitDir remains empty
      }
    }

    return {
      projectRoot: this.projectRoot,
      gitDir,
      isRepository,
    };
  }

  /**
   * Safe commit hash getter with fallback
   */
  public safeGetCommitHash(): string {
    try {
      return this.getCurrentCommitHash();
    } catch {
      // Generate a fallback hash for non-git environments
      return Math.random().toString(36).substring(2, 8);
    }
  }

  /**
   * Safe branch name getter with fallback
   */
  public safeGetBranch(): string {
    try {
      return this.getCurrentBranch();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if we're in the middle of a git operation (merge, rebase, etc.)
   */
  public isInGitOperation(): boolean {
    try {
      const gitDir = execSync('git rev-parse --git-dir', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      }).trim();

      const fullGitDir = path.isAbsolute(gitDir)
        ? gitDir
        : path.join(this.projectRoot, gitDir);

      // Check for common git operation indicators
      const fs = require('fs');
      const operationFiles = [
        'MERGE_HEAD',
        'REBASE_HEAD',
        'CHERRY_PICK_HEAD',
        'BISECT_LOG',
      ];

      for (const file of operationFiles) {
        if (fs.existsSync(path.join(fullGitDir, file))) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Validate that git is available and working
   */
  public validateGitInstallation(): boolean {
    try {
      execSync('git --version', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      return true;
    } catch {
      return false;
    }
  }
}
