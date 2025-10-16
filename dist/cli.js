#!/usr/bin/env node
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
exports.VizRepoCli = void 0;
const orchestrator_1 = require("./orchestrator");
const hook_installer_1 = require("./hook-installer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class VizRepoCli {
    constructor() {
        this.projectRoot = process.cwd();
        this.orchestrator = new orchestrator_1.VizRepoOrchestrator(this.projectRoot);
    }
    parseArgs(argv) {
        const args = argv.slice(2);
        const command = args[0] || 'help';
        const remainingArgs = [];
        const options = {};
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (!arg)
                continue;
            if (arg.startsWith('--')) {
                const [key, value] = arg.slice(2).split('=');
                if (!key)
                    continue;
                if (value !== undefined) {
                    options[key] = value;
                }
                else if (i + 1 < args.length && args[i + 1] && !args[i + 1].startsWith('-')) {
                    options[key] = args[i + 1];
                    i++;
                }
                else {
                    options[key] = true;
                }
            }
            else if (arg.startsWith('-')) {
                const flags = arg.slice(1);
                for (const flag of flags) {
                    options[flag] = true;
                }
            }
            else {
                remainingArgs.push(arg);
            }
        }
        return { command, args: remainingArgs, options };
    }
    async runCommand(parsed) {
        const { command, args, options } = parsed;
        try {
            switch (command) {
                case 'init':
                    await this.handleInit(options);
                    break;
                case 'capture':
                    await this.handleCapture(options);
                    break;
                case 'hook':
                    await this.handleHook(args[0] || 'help', options);
                    break;
                case 'status':
                    await this.handleStatus();
                    break;
                case 'list':
                case 'sessions':
                    await this.handleList(options);
                    break;
                case 'cleanup':
                    await this.handleCleanup();
                    break;
                case 'config':
                    await this.handleConfig(args[0] || 'help', args[1], options);
                    break;
                case 'version':
                case '--version':
                case '-v':
                    this.showVersion();
                    break;
                case 'help':
                case '--help':
                case '-h':
                default:
                    this.showHelp();
                    break;
            }
        }
        catch (error) {
            console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
            process.exit(1);
        }
    }
    async handleInit(options) {
        console.log('🚀 Initializing VizRepoAssist...\n');
        const installHook = !options['no-hook'];
        // Initialize project
        const initResult = await this.orchestrator.initialize();
        if (!initResult.success) {
            console.error(`❌ ${initResult.message}`);
            process.exit(1);
        }
        console.log(`✅ ${initResult.message}\n`);
        // Install hook if requested
        if (installHook) {
            console.log('🔗 Installing pre-commit hook...');
            const hookResult = await this.orchestrator.installHook(Boolean(options.force));
            if (hookResult.success) {
                console.log(`✅ ${hookResult.message}`);
            }
            else {
                console.log(`⚠️  ${hookResult.message}`);
            }
        }
        else {
            console.log('ℹ️  Skipped hook installation (use --no-hook to skip)');
        }
        console.log('\n🎉 VizRepoAssist is ready!');
        console.log('💡 Run "vizrepo capture" to take screenshots manually');
        console.log('💡 Or just commit - screenshots will be captured automatically!');
    }
    async handleCapture(options) {
        console.log('📸 Capturing screenshots...\n');
        const baseUrl = options.url || 'http://localhost:3000';
        const routes = options.routes ? options.routes.split(',') : undefined;
        const skipServerCheck = Boolean(options['no-server-check']);
        const result = await this.orchestrator.captureScreenshots({
            baseUrl,
            includeRoutes: routes,
            skipIfNoServer: !skipServerCheck,
        });
        if (result.success) {
            console.log(`✅ ${result.message}`);
            if (result.sessionId) {
                console.log(`📁 Session: ${result.sessionId}`);
            }
            if (result.capturedRoutes !== undefined) {
                console.log(`📊 Routes captured: ${result.capturedRoutes}`);
            }
        }
        else {
            console.error(`❌ ${result.message}`);
            if (result.errors && result.errors.length > 0) {
                console.error('Errors:');
                result.errors.forEach(error => console.error(`  • ${error}`));
            }
            process.exit(1);
        }
    }
    async handleHook(action, options) {
        const hookInstaller = new hook_installer_1.HookInstaller(this.projectRoot);
        switch (action) {
            case 'install':
                console.log('🔗 Installing pre-commit hook...');
                const installResult = await hookInstaller.installPreCommitHook({
                    projectRoot: this.projectRoot,
                    force: Boolean(options.force),
                });
                if (installResult.success) {
                    console.log(`✅ ${installResult.message}`);
                }
                else {
                    console.error(`❌ ${installResult.message}`);
                    process.exit(1);
                }
                break;
            case 'uninstall':
            case 'remove':
                console.log('🗑️  Uninstalling pre-commit hook...');
                const uninstallResult = await hookInstaller.uninstallPreCommitHook();
                if (uninstallResult.success) {
                    console.log(`✅ ${uninstallResult.message}`);
                }
                else {
                    console.error(`❌ ${uninstallResult.message}`);
                    process.exit(1);
                }
                break;
            case 'status':
                const status = hookInstaller.getHookStatus();
                console.log(`🔗 Hook Status: ${status.installed ? '✅ Installed' : '❌ Not installed'}`);
                if (status.installed && status.isVizRepoHook !== undefined) {
                    console.log(`📝 VizRepo Hook: ${status.isVizRepoHook ? '✅ Yes' : '⚠️  No (custom hook detected)'}`);
                }
                break;
            default:
                console.log('Hook commands:');
                console.log('  vizrepo hook install   - Install pre-commit hook');
                console.log('  vizrepo hook uninstall - Remove pre-commit hook');
                console.log('  vizrepo hook status    - Check hook status');
                console.log('\nOptions:');
                console.log('  --force               - Force installation even if hook exists');
                break;
        }
    }
    async handleStatus() {
        console.log('📊 VizRepoAssist Status\n');
        try {
            const status = await this.orchestrator.getStatus();
            // Project info
            console.log(`📁 Project: ${this.projectRoot}`);
            console.log(`🔧 Git Repository: ${status.gitRepository ? '✅' : '❌'}`);
            console.log(`⚙️  VizRepo Initialized: ${status.vizRepoInitialized ? '✅' : '❌'}`);
            console.log(`🔗 Hook Installed: ${status.hookInstalled ? '✅' : '❌'}`);
            if (status.gitRepository) {
                console.log(`🌿 Current Branch: ${status.currentBranch || 'unknown'}`);
                console.log(`📝 Current Commit: ${status.currentCommit || 'unknown'}`);
                console.log(`📋 Has Changes: ${status.hasChanges ? '✅' : '❌'}`);
            }
            // Check for recent sessions
            console.log('\n📸 Recent Sessions:');
            const sessions = await this.orchestrator.listSessions(3);
            if (sessions.length === 0) {
                console.log('  No sessions found');
            }
            else {
                sessions.forEach((session, index) => {
                    const date = new Date(session.timestamp).toLocaleString();
                    console.log(`  ${index + 1}. ${session.sessionId} (${date})`);
                });
            }
        }
        catch (error) {
            console.error(`❌ Error getting status: ${error}`);
            process.exit(1);
        }
    }
    async handleList(options) {
        const limit = parseInt(options.limit) || 10;
        console.log(`📸 Screenshot Sessions (last ${limit}):\n`);
        try {
            const sessions = await this.orchestrator.listSessions(limit);
            if (sessions.length === 0) {
                console.log('No screenshot sessions found.');
                console.log('💡 Run "vizrepo capture" to create your first session!');
                return;
            }
            sessions.forEach((session, index) => {
                const date = new Date(session.timestamp).toLocaleString();
                console.log(`${index + 1}. ${session.sessionId}`);
                console.log(`   📅 ${date}`);
                console.log(`   🌿 ${session.branch} (${session.commitHash})`);
                console.log(`   📁 ${path.relative(this.projectRoot, session.desktopPath)}`);
                console.log(`   📱 ${path.relative(this.projectRoot, session.mobilePath)}`);
                console.log('');
            });
        }
        catch (error) {
            console.error(`❌ Error listing sessions: ${error}`);
            process.exit(1);
        }
    }
    async handleCleanup() {
        console.log('🧹 Cleaning up old screenshot sessions...\n');
        try {
            const result = await this.orchestrator.cleanup();
            if (result.success) {
                console.log(`✅ ${result.message}`);
            }
            else {
                console.error(`❌ ${result.message}`);
                process.exit(1);
            }
        }
        catch (error) {
            console.error(`❌ Cleanup failed: ${error}`);
            process.exit(1);
        }
    }
    async handleConfig(action, key, options = {}) {
        const configPath = path.join(this.projectRoot, 'vizrepo.config.js');
        switch (action) {
            case 'show':
            case 'get':
                if (fs.existsSync(configPath)) {
                    console.log('⚙️  Current Configuration:\n');
                    const content = fs.readFileSync(configPath, 'utf8');
                    console.log(content);
                }
                else {
                    console.log('⚙️  No configuration file found.');
                    console.log('💡 Run "vizrepo config init" to create default configuration.');
                }
                break;
            case 'init':
            case 'reset':
                console.log('⚙️  Creating default configuration...');
                const defaultConfig = {
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
                console.log(`✅ Configuration saved to vizrepo.config.js`);
                break;
            default:
                console.log('Configuration commands:');
                console.log('  vizrepo config show    - Display current configuration');
                console.log('  vizrepo config init    - Create default configuration file');
                console.log('  vizrepo config reset   - Reset to default configuration');
                break;
        }
    }
    showVersion() {
        // Read version from package.json
        try {
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            console.log(`VizRepoAssist v${packageJson.version}`);
        }
        catch {
            console.log('VizRepoAssist v0.1.0');
        }
    }
    showHelp() {
        console.log(`
📸 VizRepoAssist CLI - Visual Development Artifacts

USAGE:
  vizrepo <command> [options]

COMMANDS:
  init                    Initialize VizRepoAssist for this project
  capture                 Capture screenshots manually
  hook <action>           Manage pre-commit hook (install/uninstall/status)
  status                  Show project and VizRepoAssist status
  list|sessions           List recent screenshot sessions
  cleanup                 Clean up old screenshot sessions
  config <action>         Manage configuration (show/init/reset)
  version                 Show version information
  help                    Show this help message

INIT OPTIONS:
  --no-hook              Skip installing pre-commit hook
  --force                Force operations even if conflicts exist

CAPTURE OPTIONS:
  --url <url>            Development server URL (default: http://localhost:3000)
  --routes <routes>      Comma-separated list of routes to capture
  --no-server-check      Skip checking if server is running

HOOK OPTIONS:
  --force                Force hook installation

LIST OPTIONS:
  --limit <number>       Maximum number of sessions to show (default: 10)

EXAMPLES:
  vizrepo init                                # Initialize with hook
  vizrepo init --no-hook                      # Initialize without hook
  vizrepo capture                             # Capture all discovered routes
  vizrepo capture --url http://localhost:4000 # Use custom server URL
  vizrepo capture --routes="/,/about,/contact" # Capture specific routes
  vizrepo hook install                        # Install pre-commit hook
  vizrepo hook status                         # Check hook status
  vizrepo status                             # Show project status
  vizrepo list --limit 20                    # Show last 20 sessions
  vizrepo cleanup                            # Clean old sessions
  vizrepo config show                        # Show current config

💡 For more information, visit: https://github.com/lucasdickey/VizRepoAssist
`);
    }
    async run() {
        const parsed = this.parseArgs(process.argv);
        await this.runCommand(parsed);
    }
}
exports.VizRepoCli = VizRepoCli;
// Main execution
if (require.main === module) {
    const cli = new VizRepoCli();
    cli.run().catch((error) => {
        console.error('❌ CLI Error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=cli.js.map