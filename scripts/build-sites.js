const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const client = path.join(root, 'dist', 'client');
const server = path.join(root, 'dist', 'server');
const publicFiles = [
  'index.html',
  'styles.css',
  'game-core.js',
  'levels.js',
  'layout.js',
  'app.js',
  'profile-icon-v1.png',
  'cover.svg',
];

fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
fs.mkdirSync(client, { recursive: true });
fs.mkdirSync(server, { recursive: true });

for (const file of publicFiles) {
  fs.copyFileSync(path.join(root, file), path.join(client, file));
}

fs.writeFileSync(path.join(server, 'index.js'), `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    const url = new URL(request.url);
    url.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(url, request));
  },
};
`);

console.log(`Built ${publicFiles.length} static files for Sites.`);
