"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotCapture = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
class ScreenshotCapture {
    constructor() {
        this.browser = null;
    }
    /**
     * Initialize browser instance
     */
    async init() {
        if (this.browser) {
            return;
        }
        try {
            this.browser = await puppeteer_1.default.launch({
                headless: 'new', // Use new headless mode
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-renderer-backgrounding',
                    '--disable-backgrounding-occluded-windows',
                ],
                timeout: 30000, // 30 second timeout
            });
        }
        catch (error) {
            throw new Error(`Failed to launch browser: ${error}`);
        }
    }
    /**
     * Close browser instance
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    /**
     * Capture screenshot with specified options
     */
    async capture(options) {
        if (!this.browser) {
            await this.init();
        }
        let page = null;
        try {
            page = await this.browser.newPage();
            // Set viewport
            await page.setViewport({
                width: options.viewport.width,
                height: options.viewport.height,
                deviceScaleFactor: options.viewport.name === 'mobile' ? 2 : 1,
            });
            // Navigate to URL with timeout
            await page.goto(options.url, {
                waitUntil: 'networkidle2',
                timeout: options.timeout || 30000,
            });
            // Take screenshot
            await page.screenshot({
                path: options.outputPath,
                type: 'jpeg',
                quality: options.quality || 80,
                fullPage: options.fullPage !== false,
            });
            return {
                success: true,
                path: options.outputPath,
                viewport: options.viewport,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Screenshot capture failed: ${errorMessage}`,
                viewport: options.viewport,
            };
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
    /**
     * Capture screenshots for both desktop and mobile viewports
     */
    async captureMultiViewport(url, outputPaths, options) {
        const results = [];
        // Capture desktop
        const desktopResult = await this.capture({
            url,
            outputPath: outputPaths.desktop,
            viewport: ScreenshotCapture.VIEWPORTS.desktop,
            ...options,
        });
        results.push(desktopResult);
        // Capture mobile
        const mobileResult = await this.capture({
            url,
            outputPath: outputPaths.mobile,
            viewport: ScreenshotCapture.VIEWPORTS.mobile,
            ...options,
        });
        results.push(mobileResult);
        return results;
    }
    /**
     * Check if browser is initialized
     */
    isInitialized() {
        return this.browser !== null;
    }
}
exports.ScreenshotCapture = ScreenshotCapture;
// Default viewport configurations
ScreenshotCapture.VIEWPORTS = {
    desktop: { width: 1920, height: 1200, name: 'desktop' },
    mobile: { width: 390, height: 844, name: 'mobile' },
};
//# sourceMappingURL=capture.js.map