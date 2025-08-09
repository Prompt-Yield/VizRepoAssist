"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitManager = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
class GitManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    /**
     * Check if the current directory is a git repository
     */
    isGitRepository() {
        try {
            (0, child_process_1.execSync)('git rev-parse --git-dir', {
                cwd: this.projectRoot,
                stdio: 'pipe',
                encoding: 'utf8',
            });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get current commit hash (short format)
     */
    getCurrentCommitHash() {
        try {
            return (0, child_process_1.execSync)('git rev-parse --short HEAD', {
                cwd: this.projectRoot,
                encoding: 'utf8',
            }).trim();
        }
        catch (error) {
            throw new Error(`Failed to get commit hash: ${error}`);
        }
    }
    /**
     * Get current branch name
     */
    getCurrentBranch() {
        try {
            return (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD', {
                cwd: this.projectRoot,
                encoding: 'utf8',
            }).trim();
        }
        catch (error) {
            throw new Error(`Failed to get branch name: ${error}`);
        }
    }
    /**
     * Get comprehensive git status
     */
    async getStatus() {
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
            const statusOutput = (0, child_process_1.execSync)('git status --porcelain', {
                cwd: this.projectRoot,
                encoding: 'utf8',
            }).trimEnd(); // Only trim trailing whitespace, not leading
            const stagedFiles = [];
            const modifiedFiles = [];
            const untrackedFiles = [];
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
            const hasChanges = stagedFiles.length > 0 || modifiedFiles.length > 0 || untrackedFiles.length > 0;
            return {
                isRepository: true,
                hasChanges,
                stagedFiles,
                modifiedFiles,
                untrackedFiles,
                currentBranch,
                currentCommit,
            };
        }
        catch (error) {
            throw new Error(`Failed to get git status: ${error}`);
        }
    }
    /**
     * Check if there are any staged changes
     */
    hasStagedChanges() {
        try {
            const output = (0, child_process_1.execSync)('git diff --cached --name-only', {
                cwd: this.projectRoot,
                encoding: 'utf8',
            }).trim();
            return output.length > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Get the git hooks directory path
     */
    getHooksDirectory() {
        try {
            const gitDir = (0, child_process_1.execSync)('git rev-parse --git-dir', {
                cwd: this.projectRoot,
                encoding: 'utf8',
            }).trim();
            // Handle relative git dir (e.g., ".git")
            const fullGitDir = path.isAbsolute(gitDir)
                ? gitDir
                : path.join(this.projectRoot, gitDir);
            return path.join(fullGitDir, 'hooks');
        }
        catch (error) {
            throw new Error(`Failed to get hooks directory: ${error}`);
        }
    }
    /**
     * Get repository information
     */
    getRepositoryInfo() {
        const isRepository = this.isGitRepository();
        let gitDir = '';
        if (isRepository) {
            try {
                gitDir = (0, child_process_1.execSync)('git rev-parse --git-dir', {
                    cwd: this.projectRoot,
                    encoding: 'utf8',
                }).trim();
                if (!path.isAbsolute(gitDir)) {
                    gitDir = path.join(this.projectRoot, gitDir);
                }
            }
            catch {
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
    safeGetCommitHash() {
        try {
            return this.getCurrentCommitHash();
        }
        catch {
            // Generate a fallback hash for non-git environments
            return Math.random().toString(36).substring(2, 8);
        }
    }
    /**
     * Safe branch name getter with fallback
     */
    safeGetBranch() {
        try {
            return this.getCurrentBranch();
        }
        catch {
            return 'unknown';
        }
    }
    /**
     * Check if we're in the middle of a git operation (merge, rebase, etc.)
     */
    isInGitOperation() {
        try {
            const gitDir = (0, child_process_1.execSync)('git rev-parse --git-dir', {
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
        }
        catch {
            return false;
        }
    }
    /**
     * Validate that git is available and working
     */
    validateGitInstallation() {
        try {
            (0, child_process_1.execSync)('git --version', {
                stdio: 'pipe',
                encoding: 'utf8',
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.GitManager = GitManager;
//# sourceMappingURL=git.js.map