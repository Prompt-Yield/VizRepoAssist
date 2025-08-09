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
exports.StorageManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
class StorageManager {
    constructor(options) {
        this.options = {
            maxCommits: 50,
            baseDirectory: '.vizrepo',
            ...options,
        };
        this.baseDir = path.join(this.options.projectRoot, this.options.baseDirectory);
        this.screenshotsDir = path.join(this.baseDir, 'screenshots');
        this.metadataPath = path.join(this.baseDir, 'index.json');
    }
    /**
     * Initialize storage directory structure
     */
    async initialize() {
        try {
            // Create base directories
            await this.ensureDirectory(this.baseDir);
            await this.ensureDirectory(this.screenshotsDir);
            // Initialize metadata file if it doesn't exist
            if (!this.fileExists(this.metadataPath)) {
                const initialMetadata = {
                    sessions: [],
                    lastCleanup: new Date().toISOString(),
                };
                await this.writeJsonFile(this.metadataPath, initialMetadata);
            }
        }
        catch (error) {
            throw new Error(`Failed to initialize storage: ${error}`);
        }
    }
    /**
     * Create a new capture session directory
     */
    async createCaptureSession() {
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
        const session = {
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
    generateScreenshotPath(session, routePath, viewport, viewportSize) {
        // Convert route path to safe filename
        const safeRouteName = this.routeToFileName(routePath);
        const fileName = `${safeRouteName}_${viewportSize.width}x${viewportSize.height}.jpg`;
        const viewportDir = viewport === 'desktop' ? session.desktopPath : session.mobilePath;
        return path.join(viewportDir, fileName);
    }
    /**
     * Clean up old capture sessions
     */
    async cleanup() {
        const metadata = await this.loadMetadata();
        if (metadata.sessions.length <= this.options.maxCommits) {
            return;
        }
        // Sort sessions by timestamp (oldest first)
        const sortedSessions = [...metadata.sessions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        // Remove oldest sessions
        const sessionsToRemove = sortedSessions.slice(0, sortedSessions.length - this.options.maxCommits);
        for (const session of sessionsToRemove) {
            const sessionDir = path.join(this.screenshotsDir, session.sessionId);
            if (this.directoryExists(sessionDir)) {
                await this.removeDirectory(sessionDir);
            }
        }
        // Update metadata
        const remainingSessions = metadata.sessions.filter(session => !sessionsToRemove.some(removed => removed.sessionId === session.sessionId));
        metadata.sessions = remainingSessions;
        metadata.lastCleanup = new Date().toISOString();
        await this.writeJsonFile(this.metadataPath, metadata);
    }
    /**
     * Get all capture sessions
     */
    async getSessions() {
        const metadata = await this.loadMetadata();
        return metadata.sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    /**
     * Get latest capture session
     */
    async getLatestSession() {
        const sessions = await this.getSessions();
        return sessions.length > 0 ? sessions[0] : null;
    }
    /**
     * Convert route path to safe filename
     */
    routeToFileName(routePath) {
        // Convert route path to safe filename
        return routePath
            .replace(/^\//, '') // Remove leading slash
            .replace(/\/$/, '') // Remove trailing slash
            .replace(/\//g, '_') // Replace slashes with underscores
            .replace(/[^a-zA-Z0-9_-]/g, '') // Remove special characters
            || 'home'; // Default to 'home' for root route
    }
    /**
     * Get current Git commit hash
     */
    getCurrentCommitHash() {
        try {
            return (0, child_process_1.execSync)('git rev-parse --short HEAD', {
                cwd: this.options.projectRoot,
                encoding: 'utf8',
            }).trim();
        }
        catch {
            // Fallback if not in git repo
            return Math.random().toString(36).substring(2, 8);
        }
    }
    /**
     * Get current Git branch name
     */
    getCurrentBranch() {
        try {
            return (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD', {
                cwd: this.options.projectRoot,
                encoding: 'utf8',
            }).trim();
        }
        catch {
            return 'unknown';
        }
    }
    /**
     * Add session to metadata
     */
    async addSessionToMetadata(session) {
        const metadata = await this.loadMetadata();
        metadata.sessions.push(session);
        await this.writeJsonFile(this.metadataPath, metadata);
    }
    /**
     * Load metadata from file
     */
    async loadMetadata() {
        try {
            const data = fs.readFileSync(this.metadataPath, 'utf8');
            return JSON.parse(data);
        }
        catch {
            return {
                sessions: [],
                lastCleanup: new Date().toISOString(),
            };
        }
    }
    /**
     * Ensure directory exists, create if it doesn't
     */
    async ensureDirectory(dirPath) {
        if (!this.directoryExists(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    /**
     * Remove directory recursively
     */
    async removeDirectory(dirPath) {
        if (this.directoryExists(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    }
    /**
     * Write JSON data to file
     */
    async writeJsonFile(filePath, data) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
    /**
     * Check if directory exists
     */
    directoryExists(dirPath) {
        try {
            return fs.statSync(dirPath).isDirectory();
        }
        catch {
            return false;
        }
    }
    /**
     * Check if file exists
     */
    fileExists(filePath) {
        try {
            return fs.statSync(filePath).isFile();
        }
        catch {
            return false;
        }
    }
}
exports.StorageManager = StorageManager;
//# sourceMappingURL=storage.js.map