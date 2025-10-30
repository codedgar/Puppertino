#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DOCS_DIR = path.join(__dirname, 'docs');

// MIME types for common file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

const server = http.createServer((req, res) => {
  // Parse URL and remove query parameters
  let filePath = req.url.split('?')[0];

  // Decode URI to handle special characters
  filePath = decodeURIComponent(filePath);

  // Default to index.html for root path
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Construct full file path
  const fullPath = path.join(DOCS_DIR, filePath);

  // Security check: ensure the path is within docs directory
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(DOCS_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Check if path is a directory and append index.html if needed
  fs.stat(fullPath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        console.error('Error checking path:', err);
      }
      return;
    }

    // If it's a directory, redirect to add trailing slash if missing
    if (stats.isDirectory()) {
      if (!filePath.endsWith('/')) {
        res.writeHead(301, { 'Location': filePath + '/' });
        res.end();
        return;
      }
      finalPath = path.join(fullPath, 'index.html');
    } else {
      finalPath = fullPath;
    }

    // Get file extension for MIME type
    const ext = path.extname(finalPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Read and serve the file
    fs.readFile(finalPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
      } else {
        // Server error
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        console.error('Error reading file:', err);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
  });
});

server.listen(PORT, () => {
  console.log(`\n Puppertino Docs Server`);
  console.log(`=========================`);
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${DOCS_DIR}`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
