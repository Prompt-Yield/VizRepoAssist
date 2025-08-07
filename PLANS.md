# VizRepoAssist Development Plan

## Project Status: 🚀 In Development
**Current Branch:** `feature/basic-project-setup`  
**Last Updated:** August 7, 2025

---

## 📋 Phase 1: Foundation & Setup

### ✅ Completed Tasks
- [x] Create comprehensive project documentation (CLAUDE.md)
- [x] Define architecture and technical requirements
- [x] Set up Git repository and initial commit
- [x] Create development branch (`feature/basic-project-setup`)
- [x] Create PLANS.md file with methodical task tracking
- [x] Create minimal directory structure (`src/`, `tests/`)
- [x] Set up `package.json` with core dependencies only
- [x] Configure TypeScript (`tsconfig.json`) with strict settings
- [x] Add basic ESLint + Prettier configurations
- [x] Set up essential npm scripts and Jest testing
- [x] Commit and push Phase 1 foundation to GitHub

---

## 📋 Phase 2: Core Screenshot Engine

### ✅ Completed Tasks
- [x] **Screenshot Capture**
  - [x] Set up Puppeteer with basic browser management
  - [x] Implement simple viewport switching (desktop/mobile)
  - [x] Create JPEG screenshot capture function
  - [x] Add basic error handling

- [x] **Simple Route Discovery**
  - [x] Scan Next.js pages directory for routes
  - [x] Basic route list generation
  - [x] Simple include/exclude filtering
  - [x] Support both App Router and Pages Router

---

## 📋 Phase 3: File Management

### ✅ Completed Tasks
- [x] **Simple Storage System**
  - [x] Create `.vizrepo/screenshots/` directory structure
  - [x] Implement `{commit-hash}_{timestamp}_{branch}` naming
  - [x] Basic file organization (desktop/mobile folders)
  - [x] Simple cleanup (keep last N commits)
  - [x] Git integration for commit hash and branch detection
  - [x] Metadata tracking with index.json

---

## 📋 Phase 4: Git Integration

### ⏳ Pending Tasks
- [ ] **Git Utilities**
  - [ ] Get current commit hash
  - [ ] Get current branch name
  - [ ] Basic git status check

- [ ] **Pre-commit Hook**
  - [ ] Simple hook template
  - [ ] Basic installation script
  - [ ] Trigger screenshot capture on commit

---

## 📋 Phase 5: MCP Server (Minimal)

### ⏳ Pending Tasks
- [ ] **Basic MCP Server**
  - [ ] Set up MCP server boilerplate
  - [ ] Single tool: `capture_screenshots`
  - [ ] Simple configuration via config file

---

## 📋 Phase 6: Simple CLI

### ⏳ Pending Tasks
- [ ] **Essential Commands Only**
  - [ ] `vizrepo init`: Create config file
  - [ ] `vizrepo capture`: Take screenshots now
  - [ ] `vizrepo hook`: Install pre-commit hook
  - [ ] Simple command parsing (no fancy CLI library)

---

## 📋 Phase 7: Basic Testing

### ⏳ Pending Tasks
- [ ] **Minimal Testing**
  - [ ] Test core screenshot function
  - [ ] Test route discovery
  - [ ] Test file creation
  - [ ] Basic integration test

---

## 🔧 Simplified Approach

### Core Dependencies Only
- **Essential:** `puppeteer`, `@modelcontextprotocol/sdk`
- **Development:** `typescript`, `@types/node`
- **Quality:** `eslint`, `prettier` (minimal configs)

### Key Simplifications
1. **No complex CLI library** - Use simple argument parsing
2. **No advanced configuration** - Single config file, sensible defaults
3. **No complex routing** - Just scan pages directory
4. **No authentication** - Keep it simple, unauthenticated only
5. **No visual diffing** - Just capture and store
6. **No cloud integration** - Local storage only
7. **No fancy progress bars** - Simple console logging

### Minimal File Structure
```
VizRepoAssist/
├── src/
│   ├── capture.ts       # Screenshot logic
│   ├── discovery.ts     # Route finding
│   ├── storage.ts       # File management
│   ├── git.ts          # Git utilities
│   ├── mcp-server.ts   # MCP implementation
│   └── cli.ts          # Command line
├── tests/
└── package.json
```

---

## 📊 Progress Tracking

**Overall Progress:** 22/25 tasks completed (~88%)

### Phase Status
- **Phase 1:** 10/10 tasks (100% complete) ✅
- **Phase 2:** 6/6 tasks (100% complete) ✅  
- **Phase 3:** 6/6 tasks (100% complete) ✅
- **Phase 4:** 0/5 tasks (0% complete) ⚪
- **Phase 5:** 0/3 tasks (0% complete) ⚪
- **Phase 6:** 0/4 tasks (0% complete) ⚪
- **Phase 7:** 0/4 tasks (0% complete) ⚪

---

## 📝 Immediate Next Steps

1. [x] ~~Complete PLANS.md~~ ✅
2. [x] ~~Create minimal project structure~~ ✅  
3. [x] ~~Set up package.json with only essential deps~~ ✅
4. [ ] **NEXT: Get basic screenshot capture working**
5. [ ] Test with a simple Next.js app

### Ready for Phase 4: Git Integration
- Implement git utilities for repository status
- Create pre-commit hook system
- Enable automatic screenshot capture on commits

---

*Keep it simple. Make it work. Ship it fast.*