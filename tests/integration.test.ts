import { ScreenshotCapture } from '../src/capture';
import { RouteDiscovery } from '../src/discovery';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Integration Tests', () => {
  let tempDir: string;
  let capture: ScreenshotCapture;
  let outputDir: string;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vizrepo-integration-test-'));
    outputDir = path.join(tempDir, 'screenshots');
    fs.mkdirSync(outputDir, { recursive: true });
    
    capture = new ScreenshotCapture();
  });

  afterAll(async () => {
    await capture.close();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Full Screenshot Workflow', () => {
    beforeEach(() => {
      // Clean up any existing app structure first
      const appDir = path.join(tempDir, 'app');
      if (fs.existsSync(appDir)) {
        fs.rmSync(appDir, { recursive: true });
      }
      
      // Create mock Next.js app structure
      fs.mkdirSync(appDir, { recursive: true });
      
      // Root page
      fs.writeFileSync(path.join(appDir, 'page.tsx'), 'export default function Home() {}');
      
      // About page
      const aboutDir = path.join(appDir, 'about');
      fs.mkdirSync(aboutDir);
      fs.writeFileSync(path.join(aboutDir, 'page.tsx'), 'export default function About() {}');
    });

    test('should discover routes and capture screenshots', async () => {
      // Step 1: Discover routes
      const discovery = new RouteDiscovery({
        projectRoot: tempDir,
        baseUrl: 'https://example.com'
      });

      const routes = await discovery.discoverRoutes();
      expect(routes.length).toBeGreaterThan(0);

      // Step 2: Capture screenshots for each route
      const results = [];
      
      for (const route of routes) {
        const routeName = route.path === '/' ? 'home' : route.path.replace(/\//g, '_');
        
        const screenshotResults = await capture.captureMultiViewport(
          route.fullUrl,
          {
            desktop: path.join(outputDir, `${routeName}_desktop.jpg`),
            mobile: path.join(outputDir, `${routeName}_mobile.jpg`)
          },
          { timeout: 10000 }
        );

        results.push({
          route: route.path,
          results: screenshotResults
        });
      }

      // Step 3: Verify results
      expect(results.length).toBe(routes.length);
      
      for (const routeResult of results) {
        expect(routeResult.results).toHaveLength(2);
        
        // Desktop screenshot
        expect(routeResult.results[0]?.success).toBe(true);
        expect(routeResult.results[0]?.viewport.name).toBe('desktop');
        expect(fs.existsSync(routeResult.results[0]?.path!)).toBe(true);
        
        // Mobile screenshot  
        expect(routeResult.results[1]?.success).toBe(true);
        expect(routeResult.results[1]?.viewport.name).toBe('mobile');
        expect(fs.existsSync(routeResult.results[1]?.path!)).toBe(true);
      }
    });

    test('should handle filtered routes correctly', async () => {
      // Discover routes with filtering
      const discovery = new RouteDiscovery({
        projectRoot: tempDir,
        baseUrl: 'https://example.com',
        include: ['/'] // Only capture home page
      });

      const routes = await discovery.discoverRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe('/');

      // Capture screenshots
      const route = routes[0]!;
      const screenshotResults = await capture.captureMultiViewport(
        route.fullUrl,
        {
          desktop: path.join(outputDir, 'filtered_desktop.jpg'),
          mobile: path.join(outputDir, 'filtered_mobile.jpg')
        }
      );

      expect(screenshotResults).toHaveLength(2);
      expect(screenshotResults[0]?.success).toBe(true);
      expect(screenshotResults[1]?.success).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle discovery with no routes gracefully', async () => {
      // Empty project directory
      const emptyDir = path.join(tempDir, 'empty-project');
      fs.mkdirSync(emptyDir, { recursive: true });

      const discovery = new RouteDiscovery({
        projectRoot: emptyDir,
        baseUrl: 'https://example.com'
      });

      const routes = await discovery.discoverRoutes();
      expect(routes).toHaveLength(0);

      // Should handle empty routes array without issues
      const results = [];
      for (const route of routes) {
        // This loop shouldn't execute
        results.push(route);
      }
      
      expect(results).toHaveLength(0);
    });

    test('should handle mixed success/failure scenarios', async () => {
      // Create single route
      const appDir = path.join(tempDir, 'mixed-test');
      fs.mkdirSync(appDir, { recursive: true });
      fs.writeFileSync(path.join(appDir, 'page.tsx'), 'export default function Home() {}');

      const discovery = new RouteDiscovery({
        projectRoot: path.dirname(appDir),
        baseUrl: 'https://this-definitely-does-not-exist-12345.com'
      });

      const routes = await discovery.discoverRoutes();
      expect(routes.length).toBeGreaterThan(0);

      // Try to capture (should fail due to invalid domain)
      const route = routes[0]!;
      const screenshotResults = await capture.captureMultiViewport(
        route.fullUrl,
        {
          desktop: path.join(outputDir, 'mixed_desktop.jpg'),
          mobile: path.join(outputDir, 'mixed_mobile.jpg')
        },
        { timeout: 5000 }
      );

      expect(screenshotResults).toHaveLength(2);
      expect(screenshotResults[0]?.success).toBe(false);
      expect(screenshotResults[1]?.success).toBe(false);
      expect(screenshotResults[0]?.error).toBeDefined();
      expect(screenshotResults[1]?.error).toBeDefined();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should handle multiple sequential captures', async () => {
      // Create multiple routes
      const multiDir = path.join(tempDir, 'multi-app');
      const appDir = path.join(multiDir, 'app');
      fs.mkdirSync(appDir, { recursive: true });
      
      // Create several pages
      fs.writeFileSync(path.join(appDir, 'page.tsx'), 'export default function Home() {}');
      
      for (let i = 1; i <= 3; i++) {
        const pageDir = path.join(appDir, `page${i}`);
        fs.mkdirSync(pageDir);
        fs.writeFileSync(path.join(pageDir, 'page.tsx'), `export default function Page${i}() {}`);
      }

      const discovery = new RouteDiscovery({
        projectRoot: multiDir,
        baseUrl: 'https://example.com'
      });

      const routes = await discovery.discoverRoutes();
      expect(routes.length).toBe(4); // Home + 3 pages

      // Capture all routes sequentially
      let successCount = 0;
      
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i]!;
        const routeName = `multi_${i}`;
        
        const results = await capture.captureMultiViewport(
          route.fullUrl,
          {
            desktop: path.join(outputDir, `${routeName}_desktop.jpg`),
            mobile: path.join(outputDir, `${routeName}_mobile.jpg`)
          }
        );

        if (results[0]?.success && results[1]?.success) {
          successCount++;
        }
      }

      expect(successCount).toBe(routes.length);
      
      // Verify browser is still working
      expect(capture.isInitialized()).toBe(true);
    });
  });
});