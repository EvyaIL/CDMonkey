// Self-contained server for DigitalOcean deployment
const http = require('http');
const path = require('path');
const fs = require('fs');

// Define MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Determine build folder path - try multiple options
let buildPath = './build';
if (!fs.existsSync(buildPath)) {
  const alternatives = ['.', '../build', '../..', '../../build'];
  for (const alt of alternatives) {
    if (fs.existsSync(path.join(alt, 'index.html'))) {
      buildPath = alt;
      console.log(`Found build files in alternative path: ${alt}`);
      break;
    }
  }
}

// Create the server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Handle health check
  if (req.url === '/health.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }

  // Parse the URL to get the pathname
  let filePath = path.join(__dirname, 'build', req.url === '/' ? 'index.html' : req.url);
  
  // If the path doesn't point to a file, serve index.html (for SPA routing)
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'build', 'index.html');
    }
    
    serveFile(filePath, res);
  });
});

// Function to serve a file
function serveFile(filePath, res) {
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('File not found');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Successful response
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// Start the server
const port = process.env.PORT || 8080;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/health.json`);
});
