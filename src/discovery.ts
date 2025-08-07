import * as fs from 'fs';
import * as path from 'path';

export interface RouteDiscoveryOptions {
  projectRoot: string;
  baseUrl: string;
  include?: string[];
  exclude?: string[];
}

export interface DiscoveredRoute {
  path: string;
  fullUrl: string;
  filePath: string;
}

export class RouteDiscovery {
  private options: RouteDiscoveryOptions;

  constructor(options: RouteDiscoveryOptions) {
    this.options = options;
  }

  /**
   * Discover all available routes in a Next.js project
   */
  public async discoverRoutes(): Promise<DiscoveredRoute[]> {
    const routes: DiscoveredRoute[] = [];

    // Try App Router first (Next.js 13+)
    const appRoutes = await this.scanAppDirectory();
    if (appRoutes.length > 0) {
      routes.push(...appRoutes);
    } else {
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
  private async scanAppDirectory(): Promise<DiscoveredRoute[]> {
    const appDir = path.join(this.options.projectRoot, 'app');
    
    if (!this.directoryExists(appDir)) {
      return [];
    }

    const routes: DiscoveredRoute[] = [];
    
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
  private async scanPagesDirectory(): Promise<DiscoveredRoute[]> {
    const pagesDir = path.join(this.options.projectRoot, 'pages');
    
    if (!this.directoryExists(pagesDir)) {
      return [];
    }

    const routes: DiscoveredRoute[] = [];

    // Scan all files in pages directory
    await this.scanDirectoryRecursive(pagesDir, '', routes, 'pages');

    return routes;
  }

  /**
   * Recursively scan directory for route files
   */
  private async scanDirectoryRecursive(
    dir: string, 
    routePrefix: string, 
    routes: DiscoveredRoute[],
    routerType: 'app' | 'pages' = 'app'
  ): Promise<void> {
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
          } else {
            // Pages router - continue scanning
            await this.scanDirectoryRecursive(subPath, newRoutePrefix, routes, routerType);
          }
        } else if (entry.isFile() && routerType === 'pages') {
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
    } catch (error) {
      // Silently skip directories we can't read
    }
  }

  /**
   * Convert page file name to route path
   */
  private getRouteFromPageFile(fileName: string, routePrefix: string): string | null {
    // Skip non-page files
    if (!fileName.match(/\.(tsx?|jsx?)$/)) {
      return null;
    }

    // Skip special files
    if (['_app', '_document', '_error', '404', '500'].some(special => 
      fileName.startsWith(special))) {
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
  private shouldSkipDirectory(dirName: string): boolean {
    // Skip Next.js special directories and route groups
    const skipPatterns = [
      'api',           // API routes
      '_',             // Private folders (start with underscore)
      '(',             // Route groups (start with parenthesis)
      'node_modules',
      '.next',
      '.git',
    ];

    return skipPatterns.some(pattern => dirName.startsWith(pattern));
  }

  /**
   * Apply include/exclude filtering to routes
   */
  private filterRoutes(routes: DiscoveredRoute[]): DiscoveredRoute[] {
    let filtered = [...routes];

    // Apply exclusions first
    if (this.options.exclude?.length) {
      filtered = filtered.filter(route => {
        return !this.options.exclude!.some(pattern => 
          this.matchesPattern(route.path, pattern)
        );
      });
    }

    // Apply inclusions (if specified, only include matching routes)
    if (this.options.include?.length) {
      filtered = filtered.filter(route => {
        return this.options.include!.some(pattern => 
          this.matchesPattern(route.path, pattern)
        );
      });
    }

    return filtered;
  }

  /**
   * Simple pattern matching (supports basic wildcards)
   */
  private matchesPattern(path: string, pattern: string): boolean {
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
  private buildUrl(routePath: string): string {
    const baseUrl = this.options.baseUrl.replace(/\/$/, '');
    return baseUrl + routePath;
  }

  /**
   * Check if directory exists
   */
  private directoryExists(dirPath: string): boolean {
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if file exists
   */
  private fileExists(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }
}