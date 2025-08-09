import puppeteer, { Browser, Page } from 'puppeteer';

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

export class ScreenshotCapture {
  private browser: Browser | null = null;

  // Default viewport configurations
  public static readonly VIEWPORTS: Record<'desktop' | 'mobile', Viewport> = {
    desktop: { width: 1920, height: 1200, name: 'desktop' },
    mobile: { width: 390, height: 844, name: 'mobile' },
  };

  /**
   * Initialize browser instance
   */
  public async init(): Promise<void> {
    if (this.browser) {
      return;
    }

    try {
      this.browser = await puppeteer.launch({
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
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error}`);
    }
  }

  /**
   * Close browser instance
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Capture screenshot with specified options
   */
  public async capture(options: CaptureOptions): Promise<CaptureResult> {
    if (!this.browser) {
      await this.init();
    }

    let page: Page | null = null;

    try {
      page = await this.browser!.newPage();

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: `Screenshot capture failed: ${errorMessage}`,
        viewport: options.viewport,
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Capture screenshots for both desktop and mobile viewports
   */
  public async captureMultiViewport(
    url: string,
    outputPaths: { desktop: string; mobile: string },
    options?: Partial<CaptureOptions>
  ): Promise<CaptureResult[]> {
    const results: CaptureResult[] = [];

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
  public isInitialized(): boolean {
    return this.browser !== null;
  }
}