# VizRepoAssist - Visual Development Artifacts MCP Server

## Project Overview
VizRepoAssist is an MCP (Model Context Protocol) server that automatically captures visual artifacts of web applications during development. It preserves the visual journey of your product development by taking screenshots at logical breakpoints and storing them in your Git repository alongside your code.

## Core Problem
During rapid development cycles, teams often lose visual context when refactoring or switching between branches. While Git tracks code changes, it doesn't preserve the visual elements, UI design, branding, and layout decisions that developers want to reference later.

## Solution
An automated system that:
- Captures screenshots of web application interfaces at commit time
- Stores visual artifacts organized by commit hash, timestamp, and branch
- Integrates seamlessly with Git workflow via pre-commit hooks
- Provides manual capture capabilities through MCP tools and CLI

## Key Features

### 1. Automated Screenshot Capture
- **Pre-commit hook integration**: Automatically captures screenshots before each commit
- **Route auto-discovery**: Detects available endpoints in Next.js applications
- **Multi-viewport support**: Captures both desktop (MacBook Pro dimensions) and mobile views
- **Unauthenticated routes**: Focuses on publicly accessible pages initially

### 2. Intelligent File Organization
```
.vizrepo/
├── screenshots/
│   ├── {commit-hash}_{timestamp}_{branch}/
│   │   ├── desktop/
│   │   │   ├── home_1920x1200.jpg
│   │   │   ├── about_1920x1200.jpg
│   │   │   └── settings_1920x1200.jpg
│   │   └── mobile/
│   │       ├── home_390x844.jpg
│   │       ├── about_390x844.jpg
│   │       └── settings_390x844.jpg
│   └── index.json
└── config/
    └── vizrepo.config.js
```

### 3. MCP Server Integration
- Exposes tools for manual screenshot capture during development
- Integrates with Claude Code for visual development assistance
- Provides context about visual changes across commits

### 4. Framework Support
- **Primary**: Next.js applications with automatic route discovery
- **Future**: React Router, Vue Router, and other SPA frameworks
- **Detection**: Automatic framework detection and optimization

## Technical Architecture

### Development Standards & Best Practices
This project follows enterprise-grade development standards consistent with modern Next.js applications:

- **Type Safety**: Full TypeScript implementation with strict configuration
- **Code Quality**: ESLint with Next.js recommended rules + Prettier formatting
- **Testing**: Comprehensive test coverage with Jest and React Testing Library
- **Git Hooks**: Pre-commit hooks for linting, type checking, and tests
- **Documentation**: JSDoc comments for all public APIs and complex logic
- **Error Handling**: Robust error boundaries and graceful failure modes
- **Performance**: Bundle analysis, tree shaking, and optimization best practices
- **Security**: Input validation, sanitization, and secure defaults

### Dependencies
- **Puppeteer**: Headless browser automation for screenshot capture
- **@modelcontextprotocol/sdk**: MCP server implementation
- **Git hooks**: Pre-commit integration
- **fs-extra**: File system operations
- **sharp**: Image processing and optimization
- **TypeScript**: Full type safety and development experience
- **ESLint + Prettier**: Code quality and formatting
- **Jest**: Testing framework with coverage reporting
- **Husky**: Git hooks management
- **lint-staged**: Pre-commit linting optimization

### Core Components

1. **Route Discovery Engine** (`src/discovery/`)
   - Next.js pages/app directory scanning
   - Dynamic route detection
   - Sitemap parsing fallback

2. **Screenshot Capture Engine** (`src/capture/`)
   - Puppeteer browser management
   - Viewport configuration (desktop/mobile)
   - JPEG compression and optimization
   - Error handling and retries

3. **File Management System** (`src/storage/`)
   - Commit hash generation
   - Directory structure creation
   - Metadata tracking (index.json)
   - Cleanup and maintenance

4. **MCP Server Interface** (`src/mcp/`)
   - Tool definitions for manual capture
   - Configuration management
   - Status reporting

5. **Git Integration** (`src/git/`)
   - Pre-commit hook installation
   - Branch and commit detection
   - Repository state management

## Configuration System

```javascript
// vizrepo.config.js
module.exports = {
  // Framework detection
  framework: 'auto', // 'nextjs', 'react', 'vue', 'auto'
  
  // Viewport configurations
  viewports: {
    desktop: { width: 1920, height: 1200 },
    mobile: { width: 390, height: 844 }
  },
  
  // Route discovery
  routes: {
    autodiscover: true,
    include: ['/custom-page'],
    exclude: ['/admin/*', '/api/*'],
    baseUrl: 'http://localhost:3000'
  },
  
  // Screenshot settings
  capture: {
    format: 'jpeg',
    quality: 80,
    fullPage: true,
    timeout: 30000
  },
  
  // Storage options
  storage: {
    directory: '.vizrepo/screenshots',
    maxCommits: 50, // Keep last 50 commits
    compression: true
  }
};
```

## Installation & Usage

### As MCP Server
```bash
npm install -g vizrepo-assist
vizrepo init
```

### Manual CLI Usage
```bash
# Capture current state
vizrepo capture

# Capture specific routes
vizrepo capture --routes="/,/about,/contact"

# Setup pre-commit hook
vizrepo install-hook
```

### MCP Tools Available
- `capture_screenshots`: Manual screenshot capture
- `list_captures`: View capture history
- `compare_captures`: Visual diff between commits
- `configure_vizrepo`: Update configuration

## Development Workflow

1. **Initial Setup**: Run `vizrepo init` in project root
2. **Configuration**: Customize `vizrepo.config.js` as needed
3. **Hook Installation**: Pre-commit hook auto-captures on commits
4. **Manual Captures**: Use MCP tools or CLI for ad-hoc screenshots
5. **Visual History**: Review captures in `.vizrepo/` directory

## Commands to Run

### Development
```bash
npm run dev          # Start development mode
npm run build        # Build for production
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint code style check
npm run lint:fix     # Auto-fix linting issues
npm run format       # Prettier code formatting
npm run typecheck    # TypeScript strict validation
npm run validate     # Run all checks (lint + typecheck + test)
```

### Testing
```bash
npm run test:unit    # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:mcp     # MCP server tests
```

## Future Enhancements

1. **Authentication Support**: Handle login flows and protected routes
2. **Framework Expansion**: Support for Vue, Angular, and other frameworks  
3. **Visual Diffing**: Compare screenshots across commits
4. **Performance Optimization**: Parallel captures and caching
5. **Cloud Storage**: Optional cloud backup of visual artifacts
6. **Integration APIs**: GitHub PR comments with screenshot previews

## File Structure
```
VizRepoAssist/
├── src/
│   ├── capture/          # Screenshot capture logic
│   ├── discovery/        # Route auto-discovery
│   ├── storage/          # File management
│   ├── mcp/             # MCP server implementation
│   ├── git/             # Git integration
│   ├── cli/             # Command line interface
│   └── config/          # Configuration management
├── tests/               # Test files
├── hooks/               # Git hook templates
├── examples/            # Example configurations
└── docs/               # Additional documentation
```

This project bridges the gap between rapid development and visual documentation, ensuring teams never lose sight of their UI/UX evolution.