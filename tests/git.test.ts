import { GitManager } from '../src/git';
import * as path from 'path';

// Mock modules
jest.mock('fs');
jest.mock('child_process');

// Import after mocking
const fs = require('fs');
const { execSync } = require('child_process');

describe('GitManager', () => {
  const testProjectRoot = '/test/project';
  let gitManager: GitManager;

  beforeEach(() => {
    gitManager = new GitManager(testProjectRoot);
    jest.clearAllMocks();

    // Default mock setup - assume valid git repo
    execSync.mockImplementation((command: string) => {
      if (command.includes('rev-parse --git-dir')) {
        return '.git';
      } else if (command.includes('rev-parse --short HEAD')) {
        return 'abc1234';
      } else if (command.includes('rev-parse --abbrev-ref HEAD')) {
        return 'main';
      } else if (command.includes('status --porcelain')) {
        return '';
      } else if (command.includes('diff --cached --name-only')) {
        return '';
      } else if (command.includes('--version')) {
        return 'git version 2.34.1';
      }
      return '';
    });

    fs.existsSync = jest.fn().mockReturnValue(false);
  });

  describe('isGitRepository', () => {
    it('should return true for valid git repository', () => {
      const result = gitManager.isGitRepository();
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('git rev-parse --git-dir', {
        cwd: testProjectRoot,
        stdio: 'pipe',
        encoding: 'utf8',
      });
    });

    it('should return false when git command fails', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = gitManager.isGitRepository();
      expect(result).toBe(false);
    });
  });

  describe('getCurrentCommitHash', () => {
    it('should return current commit hash', () => {
      const result = gitManager.getCurrentCommitHash();
      expect(result).toBe('abc1234');
      expect(execSync).toHaveBeenCalledWith('git rev-parse --short HEAD', {
        cwd: testProjectRoot,
        encoding: 'utf8',
      });
    });

    it('should throw error when git command fails', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      expect(() => gitManager.getCurrentCommitHash()).toThrow('Failed to get commit hash');
    });
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      const result = gitManager.getCurrentBranch();
      expect(result).toBe('main');
      expect(execSync).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD', {
        cwd: testProjectRoot,
        encoding: 'utf8',
      });
    });

    it('should throw error when git command fails', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      expect(() => gitManager.getCurrentBranch()).toThrow('Failed to get branch name');
    });
  });

  describe('getStatus', () => {
    it('should return complete git status for valid repository', async () => {
      execSync.mockImplementation((command: string) => {
        if (command.includes('rev-parse --git-dir')) return '.git';
        if (command.includes('rev-parse --short HEAD')) return 'abc1234';
        if (command.includes('rev-parse --abbrev-ref HEAD')) return 'feature-branch';
        if (command.includes('status --porcelain')) return ' M modified.txt\n?? untracked.txt\nA  staged.txt';
        return '';
      });

      const result = await gitManager.getStatus();

      expect(result).toMatchObject({
        isRepository: true,
        hasChanges: true,
        currentBranch: 'feature-branch',
        currentCommit: 'abc1234',
        stagedFiles: ['staged.txt'], // A  means staged
        modifiedFiles: ['modified.txt'], // ' M' means modified in working tree
        untrackedFiles: ['untracked.txt'], // ?? means untracked
      });
    });

    it('should return empty status for non-git repository', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = await gitManager.getStatus();

      expect(result).toMatchObject({
        isRepository: false,
        hasChanges: false,
        stagedFiles: [],
        modifiedFiles: [],
        untrackedFiles: [],
        currentBranch: '',
        currentCommit: '',
      });
    });

    it('should handle empty git status', async () => {
      execSync.mockImplementation((command: string) => {
        if (command.includes('rev-parse --git-dir')) return '.git';
        if (command.includes('rev-parse --short HEAD')) return 'abc1234';
        if (command.includes('rev-parse --abbrev-ref HEAD')) return 'main';
        if (command.includes('status --porcelain')) return '';
        return '';
      });

      const result = await gitManager.getStatus();

      expect(result).toMatchObject({
        isRepository: true,
        hasChanges: false,
        stagedFiles: [],
        modifiedFiles: [],
        untrackedFiles: [],
      });
    });
  });

  describe('hasStagedChanges', () => {
    it('should return true when there are staged changes', () => {
      execSync.mockImplementation((command: string) => {
        if (command.includes('diff --cached --name-only')) {
          return 'staged-file.txt';
        }
        return '';
      });

      const result = gitManager.hasStagedChanges();
      expect(result).toBe(true);
    });

    it('should return false when there are no staged changes', () => {
      execSync.mockImplementation((command: string) => {
        if (command.includes('diff --cached --name-only')) {
          return '';
        }
        return '';
      });

      const result = gitManager.hasStagedChanges();
      expect(result).toBe(false);
    });

    it('should return false on git error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = gitManager.hasStagedChanges();
      expect(result).toBe(false);
    });
  });

  describe('getHooksDirectory', () => {
    it('should return hooks directory path', () => {
      execSync.mockImplementation((command: string) => {
        if (command.includes('rev-parse --git-dir')) {
          return '.git';
        }
        return '';
      });

      const result = gitManager.getHooksDirectory();
      expect(result).toBe(path.join(testProjectRoot, '.git', 'hooks'));
    });

    it('should handle absolute git directory', () => {
      const absoluteGitDir = '/absolute/path/to/.git';
      execSync.mockImplementation((command: string) => {
        if (command.includes('rev-parse --git-dir')) {
          return absoluteGitDir;
        }
        return '';
      });

      const result = gitManager.getHooksDirectory();
      expect(result).toBe(path.join(absoluteGitDir, 'hooks'));
    });

    it('should throw error when git command fails', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      expect(() => gitManager.getHooksDirectory()).toThrow('Failed to get hooks directory');
    });
  });

  describe('safe methods', () => {
    it('should return fallback values on error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Git error');
      });

      const commitHash = gitManager.safeGetCommitHash();
      const branch = gitManager.safeGetBranch();

      expect(commitHash).toMatch(/^[a-z0-9]{6}$/);
      expect(branch).toBe('unknown');
    });

    it('should return normal values when git works', () => {
      const commitHash = gitManager.safeGetCommitHash();
      const branch = gitManager.safeGetBranch();

      expect(commitHash).toBe('abc1234');
      expect(branch).toBe('main');
    });
  });

  describe('isInGitOperation', () => {
    beforeEach(() => {
      fs.existsSync = jest.fn().mockReturnValue(false);
    });

    it('should return false when no git operations are active', () => {
      const result = gitManager.isInGitOperation();
      expect(result).toBe(false);
    });

    it('should return true when merge is in progress', () => {
      fs.existsSync = jest.fn().mockImplementation((filePath: string) => {
        return filePath.includes('MERGE_HEAD');
      });

      const result = gitManager.isInGitOperation();
      expect(result).toBe(true);
    });

    it('should return true when rebase is in progress', () => {
      fs.existsSync = jest.fn().mockImplementation((filePath: string) => {
        return filePath.includes('REBASE_HEAD');
      });

      const result = gitManager.isInGitOperation();
      expect(result).toBe(true);
    });

    it('should return false on git error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = gitManager.isInGitOperation();
      expect(result).toBe(false);
    });
  });

  describe('validateGitInstallation', () => {
    it('should return true when git is installed', () => {
      const result = gitManager.validateGitInstallation();
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('git --version', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
    });

    it('should return false when git is not installed', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = gitManager.validateGitInstallation();
      expect(result).toBe(false);
    });
  });

  describe('getRepositoryInfo', () => {
    it('should return repository information', () => {
      const result = gitManager.getRepositoryInfo();

      expect(result).toMatchObject({
        projectRoot: testProjectRoot,
        gitDir: path.join(testProjectRoot, '.git'),
        isRepository: true,
      });
    });

    it('should handle non-repository case', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = gitManager.getRepositoryInfo();

      expect(result).toMatchObject({
        projectRoot: testProjectRoot,
        gitDir: '',
        isRepository: false,
      });
    });
  });
});