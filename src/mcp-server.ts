#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { VizRepoOrchestrator } from './orchestrator.js';
import { HookInstaller } from './hook-installer.js';
import * as fs from 'fs';
import * as path from 'path';

interface VizRepoConfig {
  framework?: 'nextjs' | 'react' | 'vue' | 'auto';
  viewports?: {
    desktop?: { width: number; height: number };
    mobile?: { width: number; height: number };
  };
  routes?: {
    autodiscover?: boolean;
    include?: string[];
    exclude?: string[];
    baseUrl?: string;
  };
  capture?: {
    format?: 'jpeg' | 'png';
    quality?: number;
    fullPage?: boolean;
    timeout?: number;
  };
  storage?: {
    directory?: string;
    maxCommits?: number;
    compression?: boolean;
  };
}

class VizRepoMCPServer {
  private server: Server;
  private orchestrator: VizRepoOrchestrator;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.server = new Server({
      name: 'vizrepo-assist',
      version: '0.1.0',
      description:
        'Visual development artifacts MCP server - captures screenshots during development',
    });

    this.orchestrator = new VizRepoOrchestrator(this.projectRoot);
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'capture_screenshots',
            description:
              'Capture screenshots of your web application for the current commit',
            inputSchema: {
              type: 'object',
              properties: {
                baseUrl: {
                  type: 'string',
                  description:
                    'Base URL of your development server (default: http://localhost:3000)',
                  default: 'http://localhost:3000',
                },
                routes: {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    'Specific routes to capture (optional, auto-discovers if not provided)',
                },
                skipServerCheck: {
                  type: 'boolean',
                  description: 'Skip checking if development server is running',
                  default: false,
                },
              },
            },
          },
          {
            name: 'get_project_status',
            description:
              'Get the current status of VizRepoAssist in this project',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'initialize_project',
            description: 'Initialize VizRepoAssist for this project',
            inputSchema: {
              type: 'object',
              properties: {
                installHook: {
                  type: 'boolean',
                  description: 'Also install the pre-commit hook',
                  default: true,
                },
              },
            },
          },
          {
            name: 'install_git_hook',
            description: 'Install the VizRepoAssist pre-commit hook',
            inputSchema: {
              type: 'object',
              properties: {
                force: {
                  type: 'boolean',
                  description:
                    'Force installation even if a hook already exists',
                  default: false,
                },
              },
            },
          },
          {
            name: 'uninstall_git_hook',
            description: 'Remove the VizRepoAssist pre-commit hook',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_capture_sessions',
            description: 'List recent screenshot capture sessions',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of sessions to return',
                  default: 10,
                },
              },
            },
          },
          {
            name: 'manage_configuration',
            description: 'View or update VizRepoAssist configuration',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['get', 'set', 'reset'],
                  description: 'Action to perform on configuration',
                },
                config: {
                  type: 'object',
                  description:
                    'Configuration object to set (when action is "set")',
                  additionalProperties: true,
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'cleanup_old_sessions',
            description: 'Clean up old screenshot capture sessions',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'capture_screenshots':
            return await this.handleCaptureScreenshots(args);

          case 'get_project_status':
            return await this.handleGetProjectStatus();

          case 'initialize_project':
            return await this.handleInitializeProject(args);

          case 'install_git_hook':
            return await this.handleInstallGitHook(args);

          case 'uninstall_git_hook':
            return await this.handleUninstallGitHook();

          case 'list_capture_sessions':
            return await this.handleListCaptureSessions(args);

          case 'manage_configuration':
            return await this.handleManageConfiguration(args);

          case 'cleanup_old_sessions':
            return await this.handleCleanupOldSessions();

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  private async handleCaptureScreenshots(args: any) {
    const {
      baseUrl = 'http://localhost:3000',
      routes,
      skipServerCheck = false,
    } = args;

    const result = await this.orchestrator.captureScreenshots({
      baseUrl,
      includeRoutes: routes,
      skipIfNoServer: !skipServerCheck,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: result.success,
              message: result.message,
              sessionId: result.sessionId,
              capturedRoutes: result.capturedRoutes,
              errors: result.errors,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleGetProjectStatus() {
    const status = await this.orchestrator.getStatus();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              project: this.projectRoot,
              gitRepository: status.gitRepository,
              vizRepoInitialized: status.vizRepoInitialized,
              hookInstalled: status.hookInstalled,
              currentBranch: status.currentBranch,
              currentCommit: status.currentCommit,
              hasChanges: status.hasChanges,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleInitializeProject(args: any) {
    const { installHook = true } = args;

    try {
      // Initialize VizRepoAssist
      const initResult = await this.orchestrator.initialize();
      if (!initResult.success) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Initialization failed: ${initResult.message}`,
            },
          ],
        };
      }

      let hookResult = { success: true, message: 'Hook installation skipped' };
      if (installHook) {
        hookResult = await this.orchestrator.installHook();
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ VizRepoAssist initialized successfully!\n\n${initResult.message}\n\nGit Hook: ${hookResult.message}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Initialization failed: ${error}`,
          },
        ],
      };
    }
  }

  private async handleInstallGitHook(args: any) {
    const { force = false } = args;

    const result = await this.orchestrator.installHook(force);

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `✅ ${result.message}`
            : `❌ ${result.message}`,
        },
      ],
    };
  }

  private async handleUninstallGitHook() {
    const hookInstaller = new HookInstaller(this.projectRoot);
    const result = await hookInstaller.uninstallPreCommitHook();

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `✅ ${result.message}`
            : `❌ ${result.message}`,
        },
      ],
    };
  }

  private async handleListCaptureSessions(args: any) {
    const { limit = 10 } = args;

    const sessions = await this.orchestrator.listSessions(limit);

    if (sessions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📸 No screenshot sessions found. Run capture_screenshots to create your first session!',
          },
        ],
      };
    }

    const sessionList = sessions
      .map((session, index) => {
        const date = new Date(session.timestamp).toLocaleString();
        return `${index + 1}. ${session.sessionId}\n   📅 ${date}\n   🌿 ${session.branch} (${session.commitHash})\n   📁 Desktop: ${path.relative(this.projectRoot, session.desktopPath)}\n   📱 Mobile: ${path.relative(this.projectRoot, session.mobilePath)}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `📸 Recent Screenshot Sessions:\n\n${sessionList}`,
        },
      ],
    };
  }

  private async handleManageConfiguration(args: any) {
    const { action, config } = args;
    const configPath = path.join(this.projectRoot, 'vizrepo.config.js');

    switch (action) {
      case 'get':
        return this.getConfiguration(configPath);

      case 'set':
        return this.setConfiguration(configPath, config);

      case 'reset':
        return this.resetConfiguration(configPath);

      default:
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid configuration action: ${action}`
        );
    }
  }

  private getConfiguration(configPath: string) {
    try {
      if (!fs.existsSync(configPath)) {
        return {
          content: [
            {
              type: 'text',
              text: '⚙️ No configuration file found. Using default settings.\n\nRun manage_configuration with action="set" to create one.',
            },
          ],
        };
      }

      // Read and display the configuration file content
      const configContent = fs.readFileSync(configPath, 'utf8');

      return {
        content: [
          {
            type: 'text',
            text: `⚙️ Current VizRepoAssist Configuration:\n\n\`\`\`javascript\n${configContent}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error reading configuration: ${error}`,
          },
        ],
      };
    }
  }

  private setConfiguration(configPath: string, config: VizRepoConfig) {
    try {
      const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;

      fs.writeFileSync(configPath, configContent, 'utf8');

      return {
        content: [
          {
            type: 'text',
            text: `✅ Configuration saved to vizrepo.config.js\n\n\`\`\`javascript\n${configContent}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error saving configuration: ${error}`,
          },
        ],
      };
    }
  }

  private resetConfiguration(configPath: string) {
    try {
      const defaultConfig: VizRepoConfig = {
        framework: 'auto',
        viewports: {
          desktop: { width: 1920, height: 1200 },
          mobile: { width: 390, height: 844 },
        },
        routes: {
          autodiscover: true,
          include: [],
          exclude: ['/api/*', '/admin/*'],
          baseUrl: 'http://localhost:3000',
        },
        capture: {
          format: 'jpeg',
          quality: 80,
          fullPage: true,
          timeout: 30000,
        },
        storage: {
          directory: '.vizrepo/screenshots',
          maxCommits: 50,
          compression: true,
        },
      };

      const configContent = `module.exports = ${JSON.stringify(defaultConfig, null, 2)};`;
      fs.writeFileSync(configPath, configContent, 'utf8');

      return {
        content: [
          {
            type: 'text',
            text: `✅ Configuration reset to defaults and saved to vizrepo.config.js\n\n\`\`\`javascript\n${configContent}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error resetting configuration: ${error}`,
          },
        ],
      };
    }
  }

  private async handleCleanupOldSessions() {
    const result = await this.orchestrator.cleanup();

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `✅ ${result.message}`
            : `❌ ${result.message}`,
        },
      ],
    };
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('VizRepoAssist MCP server started');
  }
}

// Main execution
if (require.main === module) {
  const server = new VizRepoMCPServer();
  server.run().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { VizRepoMCPServer };
