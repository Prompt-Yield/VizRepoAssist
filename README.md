# 📸 VizRepoAssist

**Visual Development Artifacts MCP Server**

VizRepoAssist automatically captures visual artifacts of web applications during development, preserving the visual journey of your product development by taking screenshots at logical breakpoints and storing them in your Git repository alongside your code.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g vizrepo-assist

# Initialize in your Next.js project
cd your-nextjs-project
vizrepo init

# Start your dev server and capture screenshots
npm run dev
vizrepo capture

# Or just commit - screenshots will be captured automatically!
git add .
git commit -m "Add new feature"
```

---

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g vizrepo-assist
```

### Local Installation
```bash
npm install --save-dev vizrepo-assist
npx vizrepo init
```

### From Source
```bash
git clone https://github.com/Prompt-Yield/VizRepoAssist.git
cd VizRepoAssist
npm install
npm run build
npm link
```

---

## 🎯 Core Problem & Solution

### The Problem
During rapid development cycles, teams often lose visual context when refactoring or switching between branches. While Git tracks code changes, it doesn't preserve the visual elements, UI design, branding, and layout decisions that developers want to reference later.

### The Solution
VizRepoAssist provides:
- **Automated screenshot capture** at commit time via pre-commit hooks
- **Route auto-discovery** for Next.js applications
- **Multi-viewport support** (desktop and mobile views)
- **Organized storage** with commit-based file organization
- **MCP server integration** for Claude Code and other AI tools
- **Comprehensive CLI** for manual operations

---

## 🏗️ Architecture Overview

```
VizRepoAssist/
├── 📸 Screenshot Capture     # Puppeteer-based browser automation
├── 🔍 Route Discovery        # Next.js pages/app directory scanning  
├── 💾 File Management        # Commit-based storage organization
├── 🔗 Git Integration        # Pre-commit hooks and repository ops
├── 🤖 MCP Server            # Model Context Protocol integration
└── 💻 CLI Interface         # Command-line tools
```

### File Organization
```
.vizrepo/
├── screenshots/
│   ├── {commit-hash}_{timestamp}_{branch}/
│   │   ├── desktop/
│   │   │   ├── home_1920x1200.jpg
│   │   │   ├── about_1920x1200.jpg
│   │   │   └── contact_1920x1200.jpg
│   │   └── mobile/
│   │       ├── home_390x844.jpg
│   │       ├── about_390x844.jpg
│   │       └── contact_390x844.jpg
│   └── index.json
└── config/
    └── vizrepo.config.js
```

---

## 💻 CLI Commands

### `vizrepo init`
Initialize VizRepoAssist for your project.

```bash
vizrepo init                    # Initialize with pre-commit hook
vizrepo init --no-hook          # Initialize without installing hook
vizrepo init --force            # Force initialization even if conflicts exist
```

**What it does:**
- Creates `.vizrepo/` directory structure
- Generates default `vizrepo.config.js` if none exists
- Installs pre-commit hook (unless `--no-hook` specified)
- Validates git repository status

### `vizrepo capture`
Manually capture screenshots of your application.

```bash
vizrepo capture                                        # Capture all discovered routes
vizrepo capture --url http://localhost:4000           # Use custom development server
vizrepo capture --routes="/,/about,/contact"          # Capture specific routes only
vizrepo capture --no-server-check                     # Skip server availability check
```

**Options:**
- `--url <url>`: Development server URL (default: `http://localhost:3000`)
- `--routes <routes>`: Comma-separated list of routes to capture
- `--no-server-check`: Skip checking if development server is running

### `vizrepo hook <action>`
Manage pre-commit git hooks.

```bash
vizrepo hook install            # Install pre-commit hook
vizrepo hook uninstall          # Remove pre-commit hook  
vizrepo hook status             # Check hook installation status
vizrepo hook install --force    # Force install even if hook exists
```

**Actions:**
- `install`: Install VizRepoAssist pre-commit hook
- `uninstall/remove`: Remove the pre-commit hook
- `status`: Display current hook status

### `vizrepo status`
Display comprehensive project status.

```bash
vizrepo status
```

**Information displayed:**
- Project root directory
- Git repository status
- VizRepoAssist initialization status
- Pre-commit hook status
- Current branch and commit
- Recent screenshot sessions

### `vizrepo list` / `vizrepo sessions`
List recent screenshot capture sessions.

```bash
vizrepo list                    # Show last 10 sessions
vizrepo list --limit 20         # Show last 20 sessions
vizrepo sessions --limit 5      # Alternative command name
```

**Output includes:**
- Session ID and timestamp
- Git branch and commit hash
- Desktop and mobile screenshot paths

### `vizrepo cleanup`
Clean up old screenshot sessions.

```bash
vizrepo cleanup
```

**What it does:**
- Removes old screenshot sessions beyond configured limit
- Cleans up orphaned files
- Updates index.json metadata

### `vizrepo config <action>`
Manage configuration files.

```bash
vizrepo config show             # Display current configuration
vizrepo config init             # Create default configuration file
vizrepo config reset            # Reset to default configuration
```

**Actions:**
- `show/get`: Display current `vizrepo.config.js` content
- `init`: Create default configuration file
- `reset`: Overwrite existing config with defaults

### `vizrepo version`
Show version information.

```bash
vizrepo version
vizrepo --version
vizrepo -v
```

### `vizrepo help`
Show comprehensive help information.

```bash
vizrepo help
vizrepo --help
vizrepo -h
```

---

## ⚙️ Configuration

VizRepoAssist uses a `vizrepo.config.js` file for configuration:

```javascript
module.exports = {
  // Framework detection and optimization
  framework: 'auto', // 'nextjs', 'react', 'vue', 'auto'
  
  // Viewport configurations for screenshots
  viewports: {
    desktop: { width: 1920, height: 1200 },
    mobile: { width: 390, height: 844 }
  },
  
  // Route discovery and filtering
  routes: {
    autodiscover: true,                    // Enable automatic route discovery
    include: ['/custom-page'],             // Additional routes to include
    exclude: ['/admin/*', '/api/*'],       // Routes to exclude
    baseUrl: 'http://localhost:3000'       // Development server URL
  },
  
  // Screenshot capture settings
  capture: {
    format: 'jpeg',                        // 'jpeg' or 'png'
    quality: 80,                          // JPEG quality (1-100)
    fullPage: true,                       // Capture full page or viewport only
    timeout: 30000                        // Page load timeout in milliseconds
  },
  
  // Storage and cleanup options
  storage: {
    directory: '.vizrepo/screenshots',     // Screenshot storage directory
    maxCommits: 50,                       // Maximum commits to keep
    compression: true                     // Enable file compression
  }
};
```

### Framework Support

#### Next.js (Primary Support)
- **App Router**: Scans `app/` directory for route segments
- **Pages Router**: Scans `pages/` directory for page files
- **Dynamic Routes**: Detects `[param]` and `[...slug]` patterns
- **Route Groups**: Handles `(group)` folder structures
- **API Routes**: Automatically excluded from screenshots

#### Future Framework Support
- React Router applications
- Vue Router applications  
- Static site generators

---

## 🤖 MCP Server Integration

VizRepoAssist includes a Model Context Protocol (MCP) server for integration with Claude Code and other AI development tools.

### Starting the MCP Server
```bash
npm run mcp-server
# or
node dist/index.js
```

### MCP Tools Available

#### `capture_screenshots`
```json
{
  "name": "capture_screenshots",
  "description": "Capture screenshots of your web application",
  "inputSchema": {
    "type": "object",
    "properties": {
      "baseUrl": {
        "type": "string",
        "description": "Base URL of development server",
        "default": "http://localhost:3000"
      },
      "routes": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Specific routes to capture"
      },
      "skipServerCheck": {
        "type": "boolean", 
        "description": "Skip checking if server is running",
        "default": false
      }
    }
  }
}
```

#### `get_project_status`
Get comprehensive project status including git info and VizRepoAssist state.

#### `initialize_project`
Initialize VizRepoAssist with optional hook installation.

#### `install_git_hook` / `uninstall_git_hook`
Manage pre-commit git hooks programmatically.

#### `list_capture_sessions`
List recent screenshot sessions with metadata.

#### `manage_configuration`
View, set, or reset configuration programmatically.

#### `cleanup_old_sessions`
Clean up old screenshot sessions.

### Claude Code Integration
Add VizRepoAssist to your Claude Code configuration:

```json
{
  "mcpServers": {
    "vizrepo-assist": {
      "command": "vizrepo",
      "args": ["mcp-server"]
    }
  }
}
```

---

## 🔧 Git Integration

### Pre-commit Hook
VizRepoAssist installs a pre-commit hook that automatically captures screenshots before each commit:

```bash
#!/bin/sh
# VizRepoAssist Pre-commit Hook

# Check if VizRepoAssist is available
if ! command -v vizrepo >/dev/null 2>&1; then
    echo "⚠️  VizRepoAssist not found, skipping screenshot capture"
    exit 0
fi

# Check if development server is running
if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "⚠️  Development server not running, skipping screenshot capture"
    exit 0
fi

echo "📸 Capturing screenshots..."
vizrepo capture --no-server-check

exit 0
```

### Git Workflow Integration
1. Make your code changes
2. Start development server (`npm run dev`)
3. Commit changes (`git commit -m "Add feature"`)
4. Hook automatically captures screenshots
5. Screenshots are stored in `.vizrepo/` directory
6. Continue development with visual history preserved

---

## 🎯 Use Cases

### 1. Design System Evolution
Track how your design system components evolve over time:
```bash
# Before making design changes
git checkout -b design-system-update
vizrepo capture --routes="/components,/design-system"

# Make your changes
# ...

# Commit triggers automatic capture
git commit -m "Update button component design"
```

### 2. Feature Development
Document the visual progression of new features:
```bash
# Feature branch with regular commits
git checkout -b user-dashboard
vizrepo init

# Each commit automatically captures current state
git commit -m "Add dashboard layout"        # Screenshots captured
git commit -m "Implement user widgets"      # Screenshots captured  
git commit -m "Add responsive breakpoints"  # Screenshots captured
```

### 3. Bug Fix Documentation
Capture before/after states for bug fixes:
```bash
# Before fixing the bug
vizrepo capture --routes="/problematic-page"

# Fix the bug
# ...

# After fixing (automatic capture on commit)
git commit -m "Fix layout issue on mobile"
```

### 4. A/B Test Variants
Compare different design approaches:
```bash
# Capture baseline
git checkout main
vizrepo capture

# Create variant A
git checkout -b variant-a
# Implement changes...
git commit -m "Implement variant A"

# Create variant B  
git checkout -b variant-b
# Implement changes...
git commit -m "Implement variant B"
```

---

## 📋 Best Practices

### 1. Development Workflow
- **Start server first**: Always run `npm run dev` before capturing
- **Use meaningful commits**: Screenshot sessions are organized by commit
- **Regular captures**: Don't rely only on commit hooks - capture manually during development
- **Branch strategy**: Each feature branch gets its own screenshot history

### 2. Configuration
- **Exclude unnecessary routes**: Use `routes.exclude` for admin/API routes
- **Optimize viewport sizes**: Match your target devices
- **Adjust quality**: Balance file size vs. image quality
- **Set reasonable limits**: Use `storage.maxCommits` to control disk usage

### 3. Team Collaboration  
- **Commit screenshots**: Include `.vizrepo/` in your repository
- **Document changes**: Reference screenshot sessions in pull requests
- **Review visually**: Use screenshots to review visual changes
- **Consistent setup**: Ensure all team members use same configuration

---

## 🔍 Troubleshooting

### Common Issues

#### "Development server not available"
```bash
# Solution 1: Start your development server
npm run dev

# Solution 2: Use correct URL
vizrepo capture --url http://localhost:4000

# Solution 3: Skip server check
vizrepo capture --no-server-check
```

#### "No routes discovered"
```bash
# Check your Next.js setup
ls pages/          # Pages Router
ls app/            # App Router

# Add routes manually
vizrepo capture --routes="/,/about,/contact"

# Check configuration
vizrepo config show
```

#### "Hook installation failed"
```bash
# Check git repository
git status

# Force installation
vizrepo hook install --force

# Manual hook management
vizrepo hook uninstall
vizrepo hook install
```

#### "Screenshots not capturing"
```bash
# Check hook status
vizrepo hook status

# Test manual capture
vizrepo capture

# Check git hooks directory
ls .git/hooks/
cat .git/hooks/pre-commit
```

### Debug Mode
Enable verbose logging:
```bash
DEBUG=vizrepo* vizrepo capture
```

---

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run specific test suites
npm test tests/cli.test.ts
npm test tests/git.test.ts
npm test tests/storage.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: Cross-component interactions
- **CLI Tests**: Command-line interface validation
- **Git Tests**: Repository operations and hook management

---

## 🚀 Development

### Project Structure
```
VizRepoAssist/
├── src/
│   ├── capture.ts          # Screenshot capture engine
│   ├── discovery.ts        # Route auto-discovery
│   ├── storage.ts          # File management system
│   ├── git.ts             # Git integration utilities
│   ├── hook-installer.ts   # Pre-commit hook management
│   ├── orchestrator.ts     # Main coordination component
│   ├── mcp-server.ts      # MCP server implementation
│   ├── cli.ts             # Command-line interface
│   └── index.ts           # Main entry points
├── tests/                 # Test files
├── hooks/                 # Git hook templates
├── examples/              # Example configurations
└── docs/                  # Additional documentation
```

### Development Commands
```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Lint and format code  
npm run lint
npm run lint:fix
npm run format

# Type checking
npm run typecheck

# Run all quality checks
npm run validate
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run quality checks: `npm run validate`
5. Commit changes: `git commit -m "Add amazing feature"`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📚 Advanced Usage

### Custom Route Discovery
Implement custom route discovery for unsupported frameworks:

```javascript
// vizrepo.config.js
module.exports = {
  routes: {
    autodiscover: false,
    include: [
      '/home',
      '/products',
      '/about',
      '/contact'
    ]
  }
};
```

### Multiple Environment Support
Configure different settings for different environments:

```javascript
// vizrepo.config.js
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  routes: {
    baseUrl: isDev ? 'http://localhost:3000' : 'https://staging.example.com'
  },
  capture: {
    quality: isDev ? 60 : 80  // Lower quality in development
  }
};
```

### CI/CD Integration
Use VizRepoAssist in continuous integration:

```yaml
# .github/workflows/screenshots.yml
name: Visual Testing
on: [push, pull_request]

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Install VizRepoAssist
        run: npm install -g vizrepo-assist
        
      - name: Start development server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
        
      - name: Capture screenshots
        run: vizrepo capture
        
      - name: Upload screenshots
        uses: actions/upload-artifact@v2
        with:
          name: screenshots
          path: .vizrepo/screenshots
```

---

## 🤝 Support & Community

### Getting Help
- **GitHub Issues**: [Report bugs and request features](https://github.com/Prompt-Yield/VizRepoAssist/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/Prompt-Yield/VizRepoAssist/discussions)
- **Documentation**: [Comprehensive guides and API reference](https://github.com/Prompt-Yield/VizRepoAssist/docs)

### Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code of Conduct
- Development setup
- Pull request process
- Issue templates

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Puppeteer Team](https://pptr.dev/)** - For the excellent browser automation library
- **[Next.js Team](https://nextjs.org/)** - For the inspiring framework architecture
- **[MCP Protocol](https://modelcontextprotocol.io/)** - For the standardized AI tool integration
- **Open Source Community** - For the tools and libraries that make this possible

---

## 🔮 Roadmap

### Near Term (v0.2.0)
- [ ] Support for React Router applications
- [ ] Visual diffing between screenshot sessions
- [ ] GitHub PR integration with screenshot previews
- [ ] Cloud storage options (S3, Cloudinary)

### Medium Term (v0.3.0)
- [ ] Vue.js and Angular framework support
- [ ] Authentication flow handling
- [ ] Performance metrics integration
- [ ] Screenshot comparison tools

### Long Term (v1.0.0)
- [ ] Visual regression testing
- [ ] Team collaboration features
- [ ] Integration with design tools (Figma, Sketch)
- [ ] Advanced analytics and insights

---

<div align="center">

**📸 Capture your development journey, one commit at a time.**

[Get Started](https://github.com/Prompt-Yield/VizRepoAssist#-quick-start) • 
[Documentation](https://github.com/Prompt-Yield/VizRepoAssist/docs) • 
[Examples](https://github.com/Prompt-Yield/VizRepoAssist/examples) • 
[Contributing](https://github.com/Prompt-Yield/VizRepoAssist#-development)

Made with ❤️ by the [Prompt Yield](https://promptyield.com) team

</div>