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
export declare class RouteDiscovery {
    private options;
    constructor(options: RouteDiscoveryOptions);
    /**
     * Discover all available routes in a Next.js project
     */
    discoverRoutes(): Promise<DiscoveredRoute[]>;
    /**
     * Scan App Router directory structure (app/)
     */
    private scanAppDirectory;
    /**
     * Scan Pages Router directory structure (pages/)
     */
    private scanPagesDirectory;
    /**
     * Recursively scan directory for route files
     */
    private scanDirectoryRecursive;
    /**
     * Convert page file name to route path
     */
    private getRouteFromPageFile;
    /**
     * Check if directory should be skipped
     */
    private shouldSkipDirectory;
    /**
     * Apply include/exclude filtering to routes
     */
    private filterRoutes;
    /**
     * Simple pattern matching (supports basic wildcards)
     */
    private matchesPattern;
    /**
     * Build full URL from route path
     */
    private buildUrl;
    /**
     * Check if directory exists
     */
    private directoryExists;
    /**
     * Check if file exists
     */
    private fileExists;
}
//# sourceMappingURL=discovery.d.ts.map