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
exports.RouteDiscovery = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class RouteDiscovery {
    constructor(options) {
        this.options = options;
    }
    /**
     * Discover all available routes in a Next.js project
     */
    async discoverRoutes() {
        const routes = [];
        // Try App Router first (Next.js 13+)
        const appRoutes = await this.scanAppDirectory();
        if (appRoutes.length > 0) {
            routes.push(...appRoutes);
        }
        else {
            // Fallback to Pages Router
            const pageRoutes = await this.scanPagesDirectory();
            routes.push(...pageRoutes);
        }
        // Apply filtering
        return this.filterRoutes(routes);
    }
    /**
     * Scan App Router directory structure (app/)
     */
    async scanAppDirectory() {
        const appDir = path.join(this.options.projectRoot, 'app');
        if (!this.directoryExists(appDir)) {
            return [];
        }
        const routes = [];
        // Always add root route
        if (this.fileExists(path.join(appDir, 'page.tsx')) ||
            this.fileExists(path.join(appDir, 'page.js'))) {
            routes.push({
                path: '/',
                fullUrl: this.buildUrl('/'),
                filePath: appDir,
            });
        }
        // Scan subdirectories
        await this.scanDirectoryRecursive(appDir, '', routes);
        return routes;
    }
    /**
     * Scan Pages Router directory structure (pages/)
     */
    async scanPagesDirectory() {
        const pagesDir = path.join(this.options.projectRoot, 'pages');
        if (!this.directoryExists(pagesDir)) {
            return [];
        }
        const routes = [];
        // Scan all files in pages directory
        await this.scanDirectoryRecursive(pagesDir, '', routes, 'pages');
        return routes;
    }
    /**
     * Recursively scan directory for route files
     */
    async scanDirectoryRecursive(dir, routePrefix, routes, routerType = 'app') {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    // Skip special Next.js directories and route groups
                    if (this.shouldSkipDirectory(entry.name)) {
                        continue;
                    }
                    const subPath = path.join(dir, entry.name);
                    const newRoutePrefix = routePrefix + '/' + entry.name;
                    if (routerType === 'app') {
                        // Check for page.tsx/page.js in this directory
                        if (this.fileExists(path.join(subPath, 'page.tsx')) ||
                            this.fileExists(path.join(subPath, 'page.js'))) {
                            routes.push({
                                path: newRoutePrefix,
                                fullUrl: this.buildUrl(newRoutePrefix),
                                filePath: subPath,
                            });
                        }
                        // Continue scanning subdirectories
                        await this.scanDirectoryRecursive(subPath, newRoutePrefix, routes, routerType);
                    }
                    else {
                        // Pages router - continue scanning
                        await this.scanDirectoryRecursive(subPath, newRoutePrefix, routes, routerType);
                    }
                }
                else if (entry.isFile() && routerType === 'pages') {
                    // Handle pages router files
                    const routePath = this.getRouteFromPageFile(entry.name, routePrefix);
                    if (routePath) {
                        routes.push({
                            path: routePath,
                            fullUrl: this.buildUrl(routePath),
                            filePath: path.join(dir, entry.name),
                        });
                    }
                }
            }
        }
        catch (error) {
            // Silently skip directories we can't read
        }
    }
    /**
     * Convert page file name to route path
     */
    getRouteFromPageFile(fileName, routePrefix) {
        // Skip non-page files
        if (!fileName.match(/\.(tsx?|jsx?)$/)) {
            return null;
        }
        // Skip special files
        if (['_app', '_document', '_error', '404', '500'].some(special => fileName.startsWith(special))) {
            return null;
        }
        // Convert file name to route
        const baseName = fileName.replace(/\.(tsx?|jsx?)$/, '');
        if (baseName === 'index') {
            return routePrefix || '/';
        }
        return routePrefix + '/' + baseName;
    }
    /**
     * Check if directory should be skipped
     */
    shouldSkipDirectory(dirName) {
        // Skip Next.js special directories and route groups
        const skipPatterns = [
            'api', // API routes
            '_', // Private folders (start with underscore)
            '(', // Route groups (start with parenthesis)
            'node_modules',
            '.next',
            '.git',
        ];
        return skipPatterns.some(pattern => dirName.startsWith(pattern));
    }
    /**
     * Apply include/exclude filtering to routes
     */
    filterRoutes(routes) {
        let filtered = [...routes];
        // Apply exclusions first
        if (this.options.exclude?.length) {
            filtered = filtered.filter(route => {
                return !this.options.exclude.some(pattern => this.matchesPattern(route.path, pattern));
            });
        }
        // Apply inclusions (if specified, only include matching routes)
        if (this.options.include?.length) {
            filtered = filtered.filter(route => {
                return this.options.include.some(pattern => this.matchesPattern(route.path, pattern));
            });
        }
        return filtered;
    }
    /**
     * Simple pattern matching (supports basic wildcards)
     */
    matchesPattern(path, pattern) {
        // Convert glob-like pattern to regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
    }
    /**
     * Build full URL from route path
     */
    buildUrl(routePath) {
        const baseUrl = this.options.baseUrl.replace(/\/$/, '');
        return baseUrl + routePath;
    }
    /**
     * Check if directory exists
     */
    directoryExists(dirPath) {
        try {
            return fs.statSync(dirPath).isDirectory();
        }
        catch {
            return false;
        }
    }
    /**
     * Check if file exists
     */
    fileExists(filePath) {
        try {
            return fs.statSync(filePath).isFile();
        }
        catch {
            return false;
        }
    }
}
exports.RouteDiscovery = RouteDiscovery;
//# sourceMappingURL=discovery.js.map