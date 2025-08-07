import { ScreenshotCapture, CaptureOptions, Viewport } from '../src/capture';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ScreenshotCapture', () => {
  let capture: ScreenshotCapture;
  let tempDir: string;

  beforeAll(async () => {
    capture = new ScreenshotCapture();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vizrepo-test-'));
  });

  afterAll(async () => {
    await capture.close();
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Browser Management', () => {
    test('should initialize browser', async () => {
      await capture.init();
      expect(capture.isInitialized()).toBe(true);
    });

    test('should close browser', async () => {
      await capture.close();
      expect(capture.isInitialized()).toBe(false);
    });
  });

  describe('Viewport Configuration', () => {
    test('should have correct default viewports', () => {
      expect(ScreenshotCapture.VIEWPORTS.desktop).toEqual({
        width: 1920,
        height: 1200,
        name: 'desktop'
      });

      expect(ScreenshotCapture.VIEWPORTS.mobile).toEqual({
        width: 390,
        height: 844,
        name: 'mobile'
      });
    });
  });

  describe('Screenshot Capture', () => {
    beforeEach(async () => {
      await capture.init();
    });

    afterEach(async () => {
      await capture.close();
    });

    test('should capture screenshot successfully', async () => {
      const outputPath = path.join(tempDir, 'test-screenshot.jpg');
      const options: CaptureOptions = {
        url: 'https://example.com',
        outputPath,
        viewport: ScreenshotCapture.VIEWPORTS.desktop,
        timeout: 10000
      };

      const result = await capture.capture(options);

      expect(result.success).toBe(true);
      expect(result.path).toBe(outputPath);
      expect(result.viewport).toEqual(ScreenshotCapture.VIEWPORTS.desktop);
      expect(fs.existsSync(outputPath)).toBe(true);

      // Clean up
      fs.unlinkSync(outputPath);
    });

    test('should handle invalid URL gracefully', async () => {
      const outputPath = path.join(tempDir, 'failed-screenshot.jpg');
      const options: CaptureOptions = {
        url: 'https://this-url-does-not-exist-12345.com',
        outputPath,
        viewport: ScreenshotCapture.VIEWPORTS.desktop,
        timeout: 5000
      };

      const result = await capture.capture(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Screenshot capture failed');
      expect(result.viewport).toEqual(ScreenshotCapture.VIEWPORTS.desktop);
      expect(fs.existsSync(outputPath)).toBe(false);
    });

    test('should capture multi-viewport screenshots', async () => {
      const outputPaths = {
        desktop: path.join(tempDir, 'desktop-screenshot.jpg'),
        mobile: path.join(tempDir, 'mobile-screenshot.jpg')
      };

      const results = await capture.captureMultiViewport(
        'https://example.com',
        outputPaths,
        { timeout: 10000 }
      );

      expect(results).toHaveLength(2);
      
      // Desktop result
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.viewport.name).toBe('desktop');
      expect(fs.existsSync(outputPaths.desktop)).toBe(true);

      // Mobile result  
      expect(results[1]?.success).toBe(true);
      expect(results[1]?.viewport.name).toBe('mobile');
      expect(fs.existsSync(outputPaths.mobile)).toBe(true);

      // Clean up
      fs.unlinkSync(outputPaths.desktop);
      fs.unlinkSync(outputPaths.mobile);
    });

    test('should handle timeout correctly', async () => {
      const outputPath = path.join(tempDir, 'timeout-screenshot.jpg');
      const options: CaptureOptions = {
        url: 'https://httpstat.us/200?sleep=10000', // Slow response
        outputPath,
        viewport: ScreenshotCapture.VIEWPORTS.desktop,
        timeout: 1000 // Very short timeout
      };

      const result = await capture.capture(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('timeout');
    });
  });

  describe('Error Handling', () => {
    test('should handle capture without initialization', async () => {
      const newCapture = new ScreenshotCapture();
      const outputPath = path.join(tempDir, 'no-init-screenshot.jpg');
      
      const options: CaptureOptions = {
        url: 'https://example.com',
        outputPath,
        viewport: ScreenshotCapture.VIEWPORTS.desktop
      };

      // Should auto-initialize and work
      const result = await newCapture.capture(options);
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(outputPath)).toBe(true);

      // Clean up
      await newCapture.close();
      fs.unlinkSync(outputPath);
    });
  });
});