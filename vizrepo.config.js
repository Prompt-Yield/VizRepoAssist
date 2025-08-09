module.exports = {
  "framework": "auto",
  "viewports": {
    "desktop": {
      "width": 1920,
      "height": 1200
    },
    "mobile": {
      "width": 390,
      "height": 844
    }
  },
  "routes": {
    "autodiscover": true,
    "include": [],
    "exclude": [
      "/api/*",
      "/admin/*"
    ],
    "baseUrl": "http://localhost:3000"
  },
  "capture": {
    "format": "jpeg",
    "quality": 80,
    "fullPage": true,
    "timeout": 30000
  },
  "storage": {
    "directory": ".vizrepo/screenshots",
    "maxCommits": 50,
    "compression": true
  }
};