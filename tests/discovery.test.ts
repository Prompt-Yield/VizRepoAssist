import { RouteDiscovery, RouteDiscoveryOptions, DiscoveredRoute } from '../src/discovery';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('RouteDiscovery', () => {
  let tempDir: string;
  let discovery: RouteDiscovery;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vizrepo-discovery-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('App Router Discovery', () => {
    beforeEach(() => {
      // Create mock App Router structure
      const appDir = path.join(tempDir, 'app');
      fs.mkdirSync(appDir, { recursive: true });
      
      // Root page
      fs.writeFileSync(path.join(appDir, 'page.tsx'), 'export default function Home() {}');
      
      // About page
      const aboutDir = path.join(appDir, 'about');
      fs.mkdirSync(aboutDir);
      fs.writeFileSync(path.join(aboutDir, 'page.tsx'), 'export default function About() {}');
      
      // Nested page
      const blogDir = path.join(appDir, 'blog');
      fs.mkdirSync(blogDir);
      const postDir = path.join(blogDir, 'posts');
      fs.mkdirSync(postDir);
      fs.writeFileSync(path.join(postDir, 'page.js'), 'export default function Posts() {}');
      
      // API route (should be ignored)
      const apiDir = path.join(appDir, 'api');
      fs.mkdirSync(apiDir);
      fs.writeFileSync(path.join(apiDir, 'route.ts'), 'export function GET() {}');

      const options: RouteDiscoveryOptions = {
        projectRoot: tempDir,
        baseUrl: 'http://localhost:3000'
      };
      
      discovery = new RouteDiscovery(options);
    });

    test('should discover App Router routes', async () => {
      const routes = await discovery.discoverRoutes();
      
      expect(routes).toHaveLength(3);
      
      const paths = routes.map(r => r.path).sort();
      expect(paths).toEqual(['/', '/about', '/blog/posts']);
      
      // Check full URLs
      const urls = routes.map(r => r.fullUrl).sort();
      expect(urls).toEqual([
        'http://localhost:3000/',
        'http://localhost:3000/about',
        'http://localhost:3000/blog/posts'
      ]);
    });

    test('should provide file paths', async () => {
      const routes = await discovery.discoverRoutes();
      
      const rootRoute = routes.find(r => r.path === '/');
      expect(rootRoute?.filePath).toBe(path.join(tempDir, 'app'));
      
      const aboutRoute = routes.find(r => r.path === '/about');
      expect(aboutRoute?.filePath).toBe(path.join(tempDir, 'app', 'about'));
    });
  });

  describe('Pages Router Discovery', () => {
    beforeEach(() => {
      // Create mock Pages Router structure
      const pagesDir = path.join(tempDir, 'pages');
      fs.mkdirSync(pagesDir, { recursive: true });
      
      // Root page
      fs.writeFileSync(path.join(pagesDir, 'index.tsx'), 'export default function Home() {}');
      
      // About page
      fs.writeFileSync(path.join(pagesDir, 'about.tsx'), 'export default function About() {}');
      
      // Nested pages
      const blogDir = path.join(pagesDir, 'blog');
      fs.mkdirSync(blogDir);
      fs.writeFileSync(path.join(blogDir, 'index.js'), 'export default function Blog() {}');
      fs.writeFileSync(path.join(blogDir, 'posts.js'), 'export default function Posts() {}');
      
      // Special files (should be ignored)
      fs.writeFileSync(path.join(pagesDir, '_app.tsx'), 'export default function App() {}');
      fs.writeFileSync(path.join(pagesDir, '_document.tsx'), 'export default function Document() {}');
      fs.writeFileSync(path.join(pagesDir, '404.tsx'), 'export default function Custom404() {}');
      
      // API routes (should be ignored)
      const apiDir = path.join(pagesDir, 'api');
      fs.mkdirSync(apiDir);
      fs.writeFileSync(path.join(apiDir, 'users.ts'), 'export default function handler() {}');

      const options: RouteDiscoveryOptions = {
        projectRoot: tempDir,
        baseUrl: 'http://localhost:3000'
      };
      
      discovery = new RouteDiscovery(options);
    });

    test('should discover Pages Router routes', async () => {
      const routes = await discovery.discoverRoutes();
      
      expect(routes).toHaveLength(4);
      
      const paths = routes.map(r => r.path).sort();
      expect(paths).toEqual(['/', '/about', '/blog', '/blog/posts']);
    });

    test('should handle index files correctly', async () => {
      const routes = await discovery.discoverRoutes();
      
      const rootRoute = routes.find(r => r.path === '/');
      expect(rootRoute).toBeDefined();
      
      const blogRoute = routes.find(r => r.path === '/blog');
      expect(blogRoute).toBeDefined();
    });
  });

  describe('Route Filtering', () => {
    beforeEach(() => {
      // Create test structure
      const appDir = path.join(tempDir, 'app');
      fs.mkdirSync(appDir, { recursive: true });
      
      fs.writeFileSync(path.join(appDir, 'page.tsx'), 'export default function Home() {}');
      
      const aboutDir = path.join(appDir, 'about');
      fs.mkdirSync(aboutDir);
      fs.writeFileSync(path.join(aboutDir, 'page.tsx'), 'export default function About() {}');
      
      const adminDir = path.join(appDir, 'admin');
      fs.mkdirSync(adminDir);
      fs.writeFileSync(path.join(adminDir, 'page.tsx'), 'export default function Admin() {}');
      
      const blogDir = path.join(appDir, 'blog');
      fs.mkdirSync(blogDir);
      fs.writeFileSync(path.join(blogDir, 'page.tsx'), 'export default function Blog() {}');
    });

    test('should apply exclude filters', async () => {
      const options: RouteDiscoveryOptions = {
        projectRoot: tempDir,
        baseUrl: 'http://localhost:3000',
        exclude: ['/admin*']
      };
      
      discovery = new RouteDiscovery(options);
      const routes = await discovery.discoverRoutes();
      
      const paths = routes.map(r => r.path);
      expect(paths).not.toContain('/admin');
      expect(paths).toContain('/');
      expect(paths).toContain('/about');
    });

    test('should apply include filters', async () => {
      const options: RouteDiscoveryOptions = {
        projectRoot: tempDir,
        baseUrl: 'http://localhost:3000',
        include: ['/', '/about']
      };
      
      discovery = new RouteDiscovery(options);
      const routes = await discovery.discoverRoutes();
      
      const paths = routes.map(r => r.path).sort();
      expect(paths).toEqual(['/', '/about']);
    });

    test('should handle wildcard patterns', async () => {
      const options: RouteDiscoveryOptions = {
        projectRoot: tempDir,
        baseUrl: 'http://localhost:3000',
        exclude: ['/blog*', '/admin*']
      };
      
      discovery = new RouteDiscovery(options);
      const routes = await discovery.discoverRoutes();
      
      const paths = routes.map(r => r.path);
      expect(paths).not.toContain('/blog');
      expect(paths).not.toContain('/admin');
      expect(paths).toContain('/');
      expect(paths).toContain('/about');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing directories gracefully', async () => {
      const options: RouteDiscoveryOptions = {
        projectRoot: tempDir, // Empty directory
        baseUrl: 'http://localhost:3000'
      };
      
      discovery = new RouteDiscovery(options);
      const routes = await discovery.discoverRoutes();
      
      expect(routes).toHaveLength(0);
    });

    test('should handle non-existent project root', async () => {
      const options: RouteDiscoveryOptions = {
        projectRoot: '/this/path/does/not/exist',
        baseUrl: 'http://localhost:3000'
      };
      
      discovery = new RouteDiscovery(options);
      const routes = await discovery.discoverRoutes();
      
      expect(routes).toHaveLength(0);
    });

    test('should build URLs correctly with different base URLs', async () => {
      // Create simple structure
      const appDir = path.join(tempDir, 'app');
      fs.mkdirSync(appDir, { recursive: true });
      fs.writeFileSync(path.join(appDir, 'page.tsx'), 'export default function Home() {}');

      const options: RouteDiscoveryOptions = {
        projectRoot: tempDir,
        baseUrl: 'https://example.com:8080/'
      };
      
      discovery = new RouteDiscovery(options);
      const routes = await discovery.discoverRoutes();
      
      expect(routes[0]?.fullUrl).toBe('https://example.com:8080/');
    });
  });
});