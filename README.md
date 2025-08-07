# VizRepoAssist

Visual development artifacts MCP server that captures screenshots during development and stores them in your Git repository.

## 🎯 Purpose

VizRepoAssist preserves the visual journey of your product development by automatically capturing screenshots at logical breakpoints (like commits) and storing them alongside your code. Never lose sight of your UI/UX evolution again.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Initialize in your Next.js project
npx vizrepo init

# Take manual screenshots
npx vizrepo capture

# Install pre-commit hook
npx vizrepo hook
```

## 📁 Project Structure

```
VizRepoAssist/
├── src/
│   ├── capture.ts       # Screenshot logic
│   ├── discovery.ts     # Route finding  
│   ├── storage.ts       # File management
│   ├── git.ts          # Git utilities
│   ├── mcp-server.ts   # MCP implementation
│   └── cli.ts          # Command line
├── tests/               # Test files
├── CLAUDE.md           # Full project documentation
├── PLANS.md            # Development progress tracking
└── package.json
```

## 🛠 Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Run tests
npm run test

# Lint and format
npm run lint
npm run format

# Type checking
npm run typecheck
```

## 📊 Current Status

**Phase 1 Complete** ✅ - Foundation & Setup
- Project structure and configuration
- TypeScript, ESLint, Prettier setup
- Basic testing framework

**Phase 2 Next** 🔄 - Core Screenshot Engine
- Puppeteer integration
- Screenshot capture functionality
- Route discovery system

See [PLANS.md](./PLANS.md) for detailed progress tracking.

## 🎯 Core Features (Planned)

- **Automated Screenshots**: Capture on git commits via pre-commit hooks
- **Multi-Viewport**: Desktop and mobile screenshots
- **Next.js Integration**: Auto-discover routes and pages
- **MCP Server**: Integration with Claude Code
- **Simple CLI**: Essential commands only
- **Git Integration**: Organized by commit hash and branch

## 📋 Requirements

- Node.js 18+
- Next.js application (for route discovery)
- Git repository

---

*Keep it simple. Make it work. Ship it fast.*