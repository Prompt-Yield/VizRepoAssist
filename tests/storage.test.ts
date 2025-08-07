import { StorageManager } from '../src/storage';
import * as path from 'path';

// Mock modules
jest.mock('fs');
jest.mock('child_process');

// Import after mocking
const fs = require('fs');
const { execSync } = require('child_process');

describe('StorageManager', () => {
  const testProjectRoot = '/test/project';
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager({
      projectRoot: testProjectRoot,
      maxCommits: 5,
    });

    // Reset mocks
    jest.clearAllMocks();
    
    // Mock git commands to return different values based on command
    execSync.mockImplementation((command: string) => {
      if (command.includes('rev-parse --short HEAD')) {
        return 'abc1234';
      } else if (command.includes('rev-parse --abbrev-ref HEAD')) {
        return 'main';
      }
      return 'abc1234';
    });

    // Mock file system operations
    fs.statSync = jest.fn().mockImplementation((filePath: string) => {
      if (filePath.includes('.json')) {
        throw new Error('File not found');
      }
      return { isDirectory: () => false, isFile: () => false };
    });

    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.readFileSync = jest.fn().mockReturnValue('{"sessions":[],"lastCleanup":"2023-01-01T00:00:00.000Z"}');
  });

  describe('initialize', () => {
    it('should create required directories', async () => {
      await storageManager.initialize();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(testProjectRoot, '.vizrepo'),
        { recursive: true }
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(testProjectRoot, '.vizrepo', 'screenshots'),
        { recursive: true }
      );
    });

    it('should create initial metadata file', async () => {
      await storageManager.initialize();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(testProjectRoot, '.vizrepo', 'index.json'),
        expect.stringContaining('"sessions": []'),
        'utf8'
      );
    });
  });

  describe('createCaptureSession', () => {
    beforeEach(() => {
      // Mock successful directory creation
      fs.statSync = jest.fn().mockReturnValue({ 
        isDirectory: () => false, 
        isFile: () => false 
      });
    });

    it('should create session with correct structure', async () => {
      const session = await storageManager.createCaptureSession();

      expect(session).toMatchObject({
        commitHash: 'abc1234',
        branch: 'main',
        sessionId: expect.stringMatching(/^abc1234_.*_main$/),
        timestamp: expect.any(String),
      });

      expect(session.desktopPath).toContain('desktop');
      expect(session.mobilePath).toContain('mobile');
    });

    it('should create viewport subdirectories', async () => {
      await storageManager.createCaptureSession();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('desktop'),
        { recursive: true }
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('mobile'),
        { recursive: true }
      );
    });
  });

  describe('generateScreenshotPath', () => {
    it('should generate correct file paths', async () => {
      const session = await storageManager.createCaptureSession();
      
      const desktopPath = storageManager.generateScreenshotPath(
        session,
        '/',
        'desktop',
        { width: 1920, height: 1200 }
      );

      const mobilePath = storageManager.generateScreenshotPath(
        session,
        '/about',
        'mobile',
        { width: 390, height: 844 }
      );

      expect(desktopPath).toContain('desktop/home_1920x1200.jpg');
      expect(mobilePath).toContain('mobile/about_390x844.jpg');
    });

    it('should handle complex route paths', async () => {
      const session = await storageManager.createCaptureSession();
      
      const path = storageManager.generateScreenshotPath(
        session,
        '/products/[id]/reviews',
        'desktop',
        { width: 1920, height: 1200 }
      );

      expect(path).toContain('products_id_reviews_1920x1200.jpg');
    });
  });

  describe('git integration', () => {
    it('should handle git command failures gracefully', async () => {
      // Clear previous mocks and set up failure
      execSync.mockReset();
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const session = await storageManager.createCaptureSession();

      // Should use fallback values
      expect(session.commitHash).toMatch(/^[a-z0-9]{6}$/);
      expect(session.branch).toBe('unknown');
    });
  });

  describe('cleanup', () => {
    it('should not remove sessions when under limit', async () => {
      // Mock metadata with fewer sessions than maxCommits (5)
      const mockMetadata = {
        sessions: [
          { sessionId: 'session1', timestamp: '2023-01-01T00:00:00.000Z' },
          { sessionId: 'session2', timestamp: '2023-01-02T00:00:00.000Z' },
        ],
        lastCleanup: '2023-01-01T00:00:00.000Z',
      };

      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockMetadata));
      fs.rmSync = jest.fn();

      await storageManager.cleanup();

      // Should not remove any sessions since we're under the limit
      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it('should handle cleanup when no sessions exist', async () => {
      const mockMetadata = {
        sessions: [],
        lastCleanup: '2023-01-01T00:00:00.000Z',
      };

      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockMetadata));
      fs.rmSync = jest.fn();

      await storageManager.cleanup();

      // Should not try to remove anything when no sessions exist
      expect(fs.rmSync).not.toHaveBeenCalled();
    });
  });
});