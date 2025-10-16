import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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

export class StorageManager {
  private options: StorageOptions;
  private baseDir: string;
  private screenshotsDir: string;
  private metadataPath: string;

  constructor(options: StorageOptions) {
    this.options = {
      maxCommits: 50,
      baseDirectory: '.vizrepo',
      ...options,
    };

    this.baseDir = path.join(
      this.options.projectRoot,
      this.options.baseDirectory!
    );
    this.screenshotsDir = path.join(this.baseDir, 'screenshots');
    this.metadataPath = path.join(this.baseDir, 'index.json');
  }

  /**
   * Initialize storage directory structure
   */
  public async initialize(): Promise<void> {
    try {
      // Create base directories
      await this.ensureDirectory(this.baseDir);
      await this.ensureDirectory(this.screenshotsDir);

      // Initialize metadata file if it doesn't exist
      if (!this.fileExists(this.metadataPath)) {
        const initialMetadata: StorageMetadata = {
          sessions: [],
          lastCleanup: new Date().toISOString(),
        };
        await this.writeJsonFile(this.metadataPath, initialMetadata);
      }
    } catch (error) {
      throw new Error(`Failed to initialize storage: ${error}`);
    }
  }

  /**
   * Create a new capture session directory
   */
  public async createCaptureSession(): Promise<CaptureSession> {
    await this.initialize();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const commitHash = this.getCurrentCommitHash();
    const branch = this.getCurrentBranch();

    const sessionId = `${commitHash}_${timestamp}_${branch}`;
    const sessionDir = path.join(this.screenshotsDir, sessionId);

    // Create session directory and viewport subdirectories
    await this.ensureDirectory(sessionDir);
    const desktopPath = path.join(sessionDir, 'desktop');
    const mobilePath = path.join(sessionDir, 'mobile');
    await this.ensureDirectory(desktopPath);
    await this.ensureDirectory(mobilePath);

    const session: CaptureSession = {
      sessionId,
      timestamp,
      commitHash,
      branch,
      desktopPath,
      mobilePath,
    };

    // Update metadata
    await this.addSessionToMetadata(session);

    return session;
  }

  /**
   * Generate screenshot file path for a route
   */
  public generateScreenshotPath(
    session: CaptureSession,
    routePath: string,
    viewport: 'desktop' | 'mobile',
    viewportSize: { width: number; height: number }
  ): string {
    // Convert route path to safe filename
    const safeRouteName = this.routeToFileName(routePath);
    const fileName = `${safeRouteName}_${viewportSize.width}x${viewportSize.height}.jpg`;

    const viewportDir =
      viewport === 'desktop' ? session.desktopPath : session.mobilePath;
    return path.join(viewportDir, fileName);
  }

  /**
   * Clean up old capture sessions
   */
  public async cleanup(): Promise<void> {
    const metadata = await this.loadMetadata();

    if (metadata.sessions.length <= this.options.maxCommits!) {
      return;
    }

    // Sort sessions by timestamp (oldest first)
    const sortedSessions = [...metadata.sessions].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Remove oldest sessions
    const sessionsToRemove = sortedSessions.slice(
      0,
      sortedSessions.length - this.options.maxCommits!
    );

    for (const session of sessionsToRemove) {
      const sessionDir = path.join(this.screenshotsDir, session.sessionId);
      if (this.directoryExists(sessionDir)) {
        await this.removeDirectory(sessionDir);
      }
    }

    // Update metadata
    const remainingSessions = metadata.sessions.filter(
      (session) =>
        !sessionsToRemove.some(
          (removed) => removed.sessionId === session.sessionId
        )
    );

    metadata.sessions = remainingSessions;
    metadata.lastCleanup = new Date().toISOString();
    await this.writeJsonFile(this.metadataPath, metadata);
  }

  /**
   * Get all capture sessions
   */
  public async getSessions(): Promise<CaptureSession[]> {
    const metadata = await this.loadMetadata();
    return metadata.sessions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get latest capture session
   */
  public async getLatestSession(): Promise<CaptureSession | null> {
    const sessions = await this.getSessions();
    return sessions.length > 0 ? sessions[0]! : null;
  }

  /**
   * Convert route path to safe filename
   */
  private routeToFileName(routePath: string): string {
    // Convert route path to safe filename
    return (
      routePath
        .replace(/^\//, '') // Remove leading slash
        .replace(/\/$/, '') // Remove trailing slash
        .replace(/\//g, '_') // Replace slashes with underscores
        .replace(/[^a-zA-Z0-9_-]/g, '') || // Remove special characters
      'home'
    ); // Default to 'home' for root route
  }

  /**
   * Get current Git commit hash
   */
  private getCurrentCommitHash(): string {
    try {
      return execSync('git rev-parse --short HEAD', {
        cwd: this.options.projectRoot,
        encoding: 'utf8',
      }).trim();
    } catch {
      // Fallback if not in git repo
      return Math.random().toString(36).substring(2, 8);
    }
  }

  /**
   * Get current Git branch name
   */
  private getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.options.projectRoot,
        encoding: 'utf8',
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Add session to metadata
   */
  private async addSessionToMetadata(session: CaptureSession): Promise<void> {
    const metadata = await this.loadMetadata();
    metadata.sessions.push(session);
    await this.writeJsonFile(this.metadataPath, metadata);
  }

  /**
   * Load metadata from file
   */
  private async loadMetadata(): Promise<StorageMetadata> {
    try {
      const data = fs.readFileSync(this.metadataPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return {
        sessions: [],
        lastCleanup: new Date().toISOString(),
      };
    }
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    if (!this.directoryExists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Remove directory recursively
   */
  private async removeDirectory(dirPath: string): Promise<void> {
    if (this.directoryExists(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  /**
   * Write JSON data to file
   */
  private async writeJsonFile(filePath: string, data: any): Promise<void> {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Check if directory exists
   */
  private directoryExists(dirPath: string): boolean {
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if file exists
   */
  private fileExists(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }
}
