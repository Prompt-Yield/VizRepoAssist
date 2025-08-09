export interface Viewport {
    width: number;
    height: number;
    name: 'desktop' | 'mobile';
}
export interface CaptureOptions {
    url: string;
    outputPath: string;
    viewport: Viewport;
    quality?: number;
    fullPage?: boolean;
    timeout?: number;
}
export interface CaptureResult {
    success: boolean;
    path?: string;
    error?: string;
    viewport: Viewport;
}
export declare class ScreenshotCapture {
    private browser;
    static readonly VIEWPORTS: Record<'desktop' | 'mobile', Viewport>;
    /**
     * Initialize browser instance
     */
    init(): Promise<void>;
    /**
     * Close browser instance
     */
    close(): Promise<void>;
    /**
     * Capture screenshot with specified options
     */
    capture(options: CaptureOptions): Promise<CaptureResult>;
    /**
     * Capture screenshots for both desktop and mobile viewports
     */
    captureMultiViewport(url: string, outputPaths: {
        desktop: string;
        mobile: string;
    }, options?: Partial<CaptureOptions>): Promise<CaptureResult[]>;
    /**
     * Check if browser is initialized
     */
    isInitialized(): boolean;
}
//# sourceMappingURL=capture.d.ts.map