import { HookInstaller } from '../src/hook-installer';
import * as path from 'path';

// Mock modules
jest.mock('fs');
jest.mock('../src/git', () => ({
  GitManager: jest.fn(),
}));

// Import after mocking
const fs = require('fs');
const { GitManager } = require('../src/git');

describe('HookInstaller', () => {
  const testProjectRoot = '/test/project';
  let hookInstaller: HookInstaller;
  let mockGitManager: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock GitManager
    mockGitManager = {
      isGitRepository: jest.fn().mockReturnValue(true),
      getHooksDirectory: jest.fn().mockReturnValue('/test/project/.git/hooks'),
      validateGitInstallation: jest.fn().mockReturnValue(true),
    };

    // Setup GitManager mock
    (GitManager as jest.MockedClass<typeof GitManager>).mockImplementation(() => mockGitManager);

    // Default fs mocks
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();
    fs.copyFileSync = jest.fn();
    fs.chmodSync = jest.fn();
    fs.readFileSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.unlinkSync = jest.fn();
    fs.statSync = jest.fn().mockReturnValue({ mode: 0o755 });

    // Create HookInstaller after mocks are setup
    hookInstaller = new HookInstaller(testProjectRoot);
  });

  describe('installPreCommitHook', () => {
    beforeEach(() => {
      // Mock template file exists and hooks directory doesn't exist initially
      fs.existsSync = jest.fn().mockImplementation((filePath: string) => {
        if (filePath.includes('hooks/pre-commit') && !filePath.includes('.git/hooks')) {
          return true; // Template file exists
        }
        if (filePath.includes('.git/hooks/pre-commit')) {
          return false; // Hook doesn't exist initially
        }
        if (filePath.includes('.git/hooks')) {
          return false; // Hooks directory doesn't exist initially
        }
        return false;
      });
    });

    it('should install hook successfully in new repository', async () => {
      const result = await hookInstaller.installPreCommitHook();

      expect(result.success).toBe(true);
      expect(result.message).toContain('installed successfully');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/project/.git/hooks', { recursive: true });
      expect(fs.copyFileSync).toHaveBeenCalled();
      expect(fs.chmodSync).toHaveBeenCalledWith('/test/project/.git/hooks/pre-commit', 0o755);
    });

    it('should fail if not a git repository', async () => {
      mockGitManager.isGitRepository.mockReturnValue(false);

      const result = await hookInstaller.installPreCommitHook();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Not a git repository');
    });

    it('should detect existing VizRepo hook', async () => {
      fs.existsSync = jest.fn().mockImplementation((filePath: string) => {
        return true; // Hook exists
      });
      fs.readFileSync = jest.fn().mockReturnValue('VizRepoAssist Pre-commit Hook');

      const result = await hookInstaller.installPreCommitHook();

      expect(result.success).toBe(true);
      expect(result.message).toContain('already installed');
    });

    it('should refuse to overwrite existing non-VizRepo hook without force', async () => {
      fs.existsSync = jest.fn().mockImplementation((filePath: string) => {
        return filePath.includes('/pre-commit'); // Hook exists
      });
      fs.readFileSync = jest.fn().mockReturnValue('#!/bin/sh\n# Some other hook');

      const result = await hookInstaller.installPreCommitHook();

      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
      expect(result.message).toContain('--force');
    });

    it('should overwrite existing hook when force is true', async () => {
      fs.existsSync = jest.fn().mockImplementation((filePath: string) => {
        if (filePath.includes('/pre-commit')) return true; // Hook exists
        if (filePath.includes('hooks/pre-commit')) return true; // Template exists
        return false;
      });
      fs.readFileSync = jest.fn().mockReturnValue('#!/bin/sh\n# Some other hook');

      const result = await hookInstaller.installPreCommitHook({ 
        projectRoot: testProjectRoot, 
        force: true,
        backup: true 
      });

      expect(result.success).toBe(true);
      expect(fs.copyFileSync).toHaveBeenCalledTimes(2); // backup + install
    });

    it('should fail if template file does not exist', async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await hookInstaller.installPreCommitHook();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Hook template not found');
    });

    it('should handle filesystem errors gracefully', async () => {
      fs.existsSync = jest.fn().mockImplementation((filePath: string) => {
        return filePath.includes('hooks/pre-commit');
      });
      fs.copyFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await hookInstaller.installPreCommitHook();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to install pre-commit hook');
    });
  });

  describe('uninstallPreCommitHook', () => {
    it('should remove VizRepo hook successfully', async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('VizRepoAssist Pre-commit Hook');

      const result = await hookInstaller.uninstallPreCommitHook();

      expect(result.success).toBe(true);
      expect(result.message).toContain('removed successfully');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/project/.git/hooks/pre-commit');
    });

    it('should handle case when no hook exists', async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await hookInstaller.uninstallPreCommitHook();

      expect(result.success).toBe(true);
      expect(result.message).toContain('No pre-commit hook found');
    });

    it('should refuse to remove non-VizRepo hook', async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('#!/bin/sh\n# Some other hook');

      const result = await hookInstaller.uninstallPreCommitHook();

      expect(result.success).toBe(false);
      expect(result.message).toContain('not a VizRepoAssist hook');
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should fail if not a git repository', async () => {
      mockGitManager.isGitRepository.mockReturnValue(false);

      const result = await hookInstaller.uninstallPreCommitHook();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Not a git repository');
    });
  });

  describe('isHookInstalled', () => {
    it('should return true when VizRepo hook is installed', () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('VizRepoAssist Pre-commit Hook');

      const result = hookInstaller.isHookInstalled();
      expect(result).toBe(true);
    });

    it('should return false when no hook exists', () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = hookInstaller.isHookInstalled();
      expect(result).toBe(false);
    });

    it('should return false when non-VizRepo hook exists', () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('#!/bin/sh\n# Some other hook');

      const result = hookInstaller.isHookInstalled();
      expect(result).toBe(false);
    });

    it('should handle filesystem errors gracefully', () => {
      fs.existsSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = hookInstaller.isHookInstalled();
      expect(result).toBe(false);
    });
  });

  describe('getHookStatus', () => {
    it('should return complete status for installed VizRepo hook', () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('VizRepoAssist Pre-commit Hook');
      fs.statSync = jest.fn().mockReturnValue({ mode: 0o755 });

      const result = hookInstaller.getHookStatus();

      expect(result).toMatchObject({
        installed: true,
        isVizRepoHook: true,
        hookPath: '/test/project/.git/hooks/pre-commit',
        executable: true,
      });
    });

    it('should return status for non-executable hook', () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('VizRepoAssist Pre-commit Hook');
      fs.statSync = jest.fn().mockReturnValue({ mode: 0o644 }); // Not executable

      const result = hookInstaller.getHookStatus();

      expect(result.executable).toBe(false);
    });

    it('should return status when no hook exists', () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = hookInstaller.getHookStatus();

      expect(result).toMatchObject({
        installed: false,
        isVizRepoHook: false,
      });
    });
  });

  describe('validateHookInstallation', () => {
    it('should pass validation for correct setup', () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('VizRepoAssist Pre-commit Hook');
      fs.statSync = jest.fn().mockReturnValue({ mode: 0o755 });
      fs.writeFileSync = jest.fn(); // For permission test
      fs.unlinkSync = jest.fn(); // For permission test cleanup

      const result = hookInstaller.validateHookInstallation();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect not being a git repository', () => {
      mockGitManager.isGitRepository.mockReturnValue(false);

      const result = hookInstaller.validateHookInstallation();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Not a git repository');
    });

    it('should detect missing git installation', () => {
      mockGitManager.validateGitInstallation.mockReturnValue(false);

      const result = hookInstaller.validateHookInstallation();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Git is not installed or not working');
    });

    it('should detect missing hook', () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = hookInstaller.validateHookInstallation();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Pre-commit hook is not installed');
    });

    it('should detect non-executable hook', () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('VizRepoAssist Pre-commit Hook');
      fs.statSync = jest.fn().mockReturnValue({ mode: 0o644 });
      fs.writeFileSync = jest.fn();
      fs.unlinkSync = jest.fn();

      const result = hookInstaller.validateHookInstallation();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Pre-commit hook is not executable');
    });

    it('should detect permission issues', () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue('VizRepoAssist Pre-commit Hook');
      fs.statSync = jest.fn().mockReturnValue({ mode: 0o755 });
      fs.writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = hookInstaller.validateHookInstallation();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Cannot write to git hooks directory (permission issue)');
    });
  });

  describe('initializeVizRepoDirectory', () => {
    it('should create directory structure successfully', () => {
      const result = hookInstaller.initializeVizRepoDirectory();

      expect(result.success).toBe(true);
      expect(result.message).toContain('initialized successfully');
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(testProjectRoot, '.vizrepo'), { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(testProjectRoot, '.vizrepo/screenshots'), { recursive: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(testProjectRoot, '.vizrepo/config'), { recursive: true });
    });

    it('should create initial metadata file', () => {
      fs.existsSync = jest.fn().mockReturnValue(false); // index.json doesn't exist

      hookInstaller.initializeVizRepoDirectory();

      // Verify the call was made with valid JSON containing sessions array
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls.find(call => 
        call[0].includes('index.json')
      );
      expect(writeCall).toBeDefined();
      expect(writeCall[0]).toBe(path.join(testProjectRoot, '.vizrepo/index.json'));
      
      const jsonContent = JSON.parse(writeCall[1]);
      expect(jsonContent.sessions).toEqual([]);
      expect(jsonContent.lastCleanup).toBeDefined();
    });

    it('should not overwrite existing metadata file', () => {
      fs.existsSync = jest.fn().mockImplementation((filePath: string) => {
        return filePath.includes('index.json');
      });

      hookInstaller.initializeVizRepoDirectory();

      expect(fs.writeFileSync).not.toHaveBeenCalledWith(
        path.join(testProjectRoot, '.vizrepo/index.json'),
        expect.anything(),
        expect.anything()
      );
    });

    it('should handle filesystem errors', () => {
      fs.mkdirSync = jest.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = hookInstaller.initializeVizRepoDirectory();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to initialize VizRepoAssist directory');
    });
  });
});