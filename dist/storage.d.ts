export interface StorageOptions {
    projectRoot: string;
    maxCommits?: number;
    baseDirectory?: string;
}
export interface CaptureSession {
    sessionId: string;
    timestamp: string;
    commitHash: string;
    branch: string;
    desktopPath: string;
    mobilePath: string;
}
export interface StorageMetadata {
    sessions: CaptureSession[];
    lastCleanup: string;
}
export declare class StorageManager {
    private options;
    private baseDir;
    private screenshotsDir;
    private metadataPath;
    constructor(options: StorageOptions);
    /**
     * Initialize storage directory structure
     */
    initialize(): Promise<void>;
    /**
     * Create a new capture session directory
     */
    createCaptureSession(): Promise<CaptureSession>;
    /**
     * Generate screenshot file path for a route
     */
    generateScreenshotPath(session: CaptureSession, routePath: string, viewport: 'desktop' | 'mobile', viewportSize: {
        width: number;
        height: number;
    }): string;
    /**
     * Clean up old capture sessions
     */
    cleanup(): Promise<void>;
    /**
     * Get all capture sessions
     */
    getSessions(): Promise<CaptureSession[]>;
    /**
     * Get latest capture session
     */
    getLatestSession(): Promise<CaptureSession | null>;
    /**
     * Convert route path to safe filename
     */
    private routeToFileName;
    /**
     * Get current Git commit hash
     */
    private getCurrentCommitHash;
    /**
     * Get current Git branch name
     */
    private getCurrentBranch;
    /**
     * Add session to metadata
     */
    private addSessionToMetadata;
    /**
     * Load metadata from file
     */
    private loadMetadata;
    /**
     * Ensure directory exists, create if it doesn't
     */
    private ensureDirectory;
    /**
     * Remove directory recursively
     */
    private removeDirectory;
    /**
     * Write JSON data to file
     */
    private writeJsonFile;
    /**
     * Check if directory exists
     */
    private directoryExists;
    /**
     * Check if file exists
     */
    private fileExists;
}
//# sourceMappingURL=storage.d.ts.map