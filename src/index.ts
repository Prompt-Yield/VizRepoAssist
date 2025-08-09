#!/usr/bin/env node

export { VizRepoMCPServer } from './mcp-server.js';
export { VizRepoOrchestrator } from './orchestrator.js';
export { GitManager } from './git.js';
export { StorageManager } from './storage.js';
export { RouteDiscovery } from './discovery.js';
export { ScreenshotCapture } from './capture.js';
export { HookInstaller } from './hook-installer.js';

// Main entry point for MCP server
import { VizRepoMCPServer } from './mcp-server.js';

if (require.main === module) {
  const server = new VizRepoMCPServer();
  server.run().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}