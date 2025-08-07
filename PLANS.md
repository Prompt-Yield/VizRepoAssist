# VizRepoAssist Development Plan

## Project Status: 🚀 In Development
**Current Branch:** `feature/project-setup`  
**Last Updated:** August 6, 2025

---

## 📋 Phase 1: Foundation & Setup

### ✅ Completed Tasks
- [x] Create comprehensive project documentation (CLAUDE.md)
- [x] Define architecture and technical requirements
- [x] Set up Git repository and initial commit
- [x] Create development branch (`feature/project-setup`)

### 🔄 In Progress
- [ ] **Create PLANS.md file** ← *Currently working on this*

### ⏳ Pending Tasks
- [ ] **Basic Project Setup**
  - [ ] Create minimal directory structure (`src/`, `tests/`)
  - [ ] Set up `package.json` with core dependencies only
  - [ ] Configure TypeScript (`tsconfig.json`)
  - [ ] Add basic ESLint + Prettier
  - [ ] Set up essential npm scripts

---

## 📋 Phase 2: Core Screenshot Engine

### ⏳ Pending Tasks
- [ ] **Screenshot Capture**
  - [ ] Set up Puppeteer with basic browser management
  - [ ] Implement simple viewport switching (desktop/mobile)
  - [ ] Create JPEG screenshot capture function
  - [ ] Add basic error handling

- [ ] **Simple Route Discovery**
  - [ ] Scan Next.js pages directory for routes
  - [ ] Basic route list generation
  - [ ] Simple include/exclude filtering

---

## 📋 Phase 3: File Management

### ⏳ Pending Tasks
- [ ] **Simple Storage System**
  - [ ] Create `.vizrepo/screenshots/` directory structure
  - [ ] Implement `{commit-hash}_{timestamp}` naming
  - [ ] Basic file organization (desktop/mobile folders)
  - [ ] Simple cleanup (keep last N commits)

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

**Overall Progress:** 4/25 tasks completed (~16%)

### Phase Status
- **Phase 1:** 4/6 tasks (67% complete) 🟡
- **Phase 2:** 0/6 tasks (0% complete) ⚪
- **Phase 3:** 0/4 tasks (0% complete) ⚪
- **Phase 4:** 0/5 tasks (0% complete) ⚪
- **Phase 5:** 0/3 tasks (0% complete) ⚪
- **Phase 6:** 0/4 tasks (0% complete) ⚪
- **Phase 7:** 0/4 tasks (0% complete) ⚪

---

## 📝 Immediate Next Steps

1. [ ] Complete PLANS.md
2. [ ] Create minimal project structure
3. [ ] Set up package.json with only essential deps
4. [ ] Get basic screenshot capture working
5. [ ] Test with a simple Next.js app

---

*Keep it simple. Make it work. Ship it fast.*