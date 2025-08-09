#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookInstaller = exports.ScreenshotCapture = exports.RouteDiscovery = exports.StorageManager = exports.GitManager = exports.VizRepoOrchestrator = exports.VizRepoMCPServer = void 0;
var mcp_server_js_1 = require("./mcp-server.js");
Object.defineProperty(exports, "VizRepoMCPServer", { enumerable: true, get: function () { return mcp_server_js_1.VizRepoMCPServer; } });
var orchestrator_js_1 = require("./orchestrator.js");
Object.defineProperty(exports, "VizRepoOrchestrator", { enumerable: true, get: function () { return orchestrator_js_1.VizRepoOrchestrator; } });
var git_js_1 = require("./git.js");
Object.defineProperty(exports, "GitManager", { enumerable: true, get: function () { return git_js_1.GitManager; } });
var storage_js_1 = require("./storage.js");
Object.defineProperty(exports, "StorageManager", { enumerable: true, get: function () { return storage_js_1.StorageManager; } });
var discovery_js_1 = require("./discovery.js");
Object.defineProperty(exports, "RouteDiscovery", { enumerable: true, get: function () { return discovery_js_1.RouteDiscovery; } });
var capture_js_1 = require("./capture.js");
Object.defineProperty(exports, "ScreenshotCapture", { enumerable: true, get: function () { return capture_js_1.ScreenshotCapture; } });
var hook_installer_js_1 = require("./hook-installer.js");
Object.defineProperty(exports, "HookInstaller", { enumerable: true, get: function () { return hook_installer_js_1.HookInstaller; } });
// Main entry point for MCP server
const mcp_server_js_2 = require("./mcp-server.js");
if (require.main === module) {
    const server = new mcp_server_js_2.VizRepoMCPServer();
    server.run().catch((error) => {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map