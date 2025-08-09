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
export declare class GitManager {
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Check if the current directory is a git repository
     */
    isGitRepository(): boolean;
    /**
     * Get current commit hash (short format)
     */
    getCurrentCommitHash(): string;
    /**
     * Get current branch name
     */
    getCurrentBranch(): string;
    /**
     * Get comprehensive git status
     */
    getStatus(): Promise<GitStatus>;
    /**
     * Check if there are any staged changes
     */
    hasStagedChanges(): boolean;
    /**
     * Get the git hooks directory path
     */
    getHooksDirectory(): string;
    /**
     * Get repository information
     */
    getRepositoryInfo(): GitRepositoryInfo;
    /**
     * Safe commit hash getter with fallback
     */
    safeGetCommitHash(): string;
    /**
     * Safe branch name getter with fallback
     */
    safeGetBranch(): string;
    /**
     * Check if we're in the middle of a git operation (merge, rebase, etc.)
     */
    isInGitOperation(): boolean;
    /**
     * Validate that git is available and working
     */
    validateGitInstallation(): boolean;
}
//# sourceMappingURL=git.d.ts.map