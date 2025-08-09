import { VizRepoCli } from '../src/cli';
import { VizRepoOrchestrator } from '../src/orchestrator';

// Mock modules
jest.mock('../src/orchestrator');

describe('VizRepoCli', () => {
  let cli: VizRepoCli;
  let mockOrchestrator: jest.Mocked<VizRepoOrchestrator>;
  let originalArgv: string[];
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock orchestrator
    const OrchestratorMock = VizRepoOrchestrator as jest.MockedClass<typeof VizRepoOrchestrator>;
    mockOrchestrator = new OrchestratorMock('/test') as jest.Mocked<VizRepoOrchestrator>;
    
    // Setup default mock responses
    mockOrchestrator.initialize = jest.fn().mockResolvedValue({
      success: true,
      message: 'VizRepoAssist initialized successfully',
    });

    mockOrchestrator.getStatus = jest.fn().mockResolvedValue({
      gitRepository: true,
      vizRepoInitialized: true,
      hookInstalled: false,
      currentBranch: 'main',
      currentCommit: 'abc1234',
      hasChanges: false,
    });

    mockOrchestrator.listSessions = jest.fn().mockResolvedValue([]);

    cli = new VizRepoCli();
    
    // Store original argv and mock console
    originalArgv = process.argv;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restore original argv and console
    process.argv = originalArgv;
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Argument Parsing', () => {
    it('should parse basic commands', () => {
      const parseArgs = (cli as any).parseArgs;
      
      const result = parseArgs(['node', 'cli.js', 'init']);
      
      expect(result.command).toBe('init');
      expect(result.args).toEqual([]);
      expect(result.options).toEqual({});
    });

    it('should parse commands with arguments', () => {
      const parseArgs = (cli as any).parseArgs;
      
      const result = parseArgs(['node', 'cli.js', 'hook', 'install']);
      
      expect(result.command).toBe('hook');
      expect(result.args).toEqual(['install']);
    });

    it('should parse options', () => {
      const parseArgs = (cli as any).parseArgs;
      
      const result = parseArgs(['node', 'cli.js', 'init', '--no-hook', '--force']);
      
      expect(result.command).toBe('init');
      expect(result.options).toEqual({
        'no-hook': true,
        'force': true
      });
    });

    it('should parse options with values', () => {
      const parseArgs = (cli as any).parseArgs;
      
      const result = parseArgs(['node', 'cli.js', 'capture', '--url', 'http://localhost:4000']);
      
      expect(result.command).toBe('capture');
      expect(result.options).toEqual({
        'url': 'http://localhost:4000'
      });
    });
  });

  describe('Command Execution', () => {
    it('should show help by default', async () => {
      process.argv = ['node', 'cli.js'];
      
      await cli.run();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('VizRepoAssist CLI');
    });

    it('should show version', async () => {
      process.argv = ['node', 'cli.js', 'version'];
      
      await cli.run();
      
      expect(consoleSpy).toHaveBeenCalledWith('VizRepoAssist v0.1.0');
    });
  });

  describe('Error Handling', () => {
    it('should handle orchestrator errors gracefully', async () => {
      mockOrchestrator.initialize = jest.fn().mockRejectedValue(new Error('Test error'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => code as never);

      process.argv = ['node', 'cli.js', 'init'];

      await cli.run();

      expect(errorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});