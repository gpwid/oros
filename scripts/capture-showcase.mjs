import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import pngjsPkg from 'pngjs';
import gifencPkg from 'gifenc';

const { PNG } = pngjsPkg;
const { GIFEncoder, quantize, applyPalette } = gifencPkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outputDir = path.join(rootDir, 'showcase-assets');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Helper to encode PNG buffer frames into a GIF
function createGifFromPngBuffers(pngBuffers, { delay = 100, width = null, height = null } = {}) {
  if (pngBuffers.length === 0) return null;

  const firstPng = PNG.sync.read(pngBuffers[0]);
  const w = width || firstPng.width;
  const h = height || firstPng.height;

  const gif = GIFEncoder();

  for (const buf of pngBuffers) {
    const png = PNG.sync.read(buf);
    // If exact dimensions match
    let rgbaData = png.data;
    if (png.width !== w || png.height !== h) {
      // Crop or scale if needed
      rgbaData = png.data;
    }
    const palette = quantize(rgbaData, 256);
    const index = applyPalette(rgbaData, palette);
    gif.writeFrame(index, png.width, png.height, { palette, delay });
  }

  gif.finish();
  return Buffer.from(gif.bytes());
}

// 2. MIME type mapper for static server
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

async function main() {
  console.log('=== Oros Phase 2: High-Res Showcase Asset & GIF Generator ===\n');

  // Start static file server
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(distDir, reqPath.replace(/^\//, ''));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  const PORT = 5188;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[1/8] Showcase static server online at http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1600,1050',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 950, deviceScaleFactor: 2 });

  // Inject vault data from desktop %APPDATA%/Oros/vault/oros_vault.json if available
  const vaultPath = path.join(process.env.APPDATA, 'Oros', 'vault', 'oros_vault.json');
  if (fs.existsSync(vaultPath)) {
    const vaultData = fs.readFileSync(vaultPath, 'utf8');
    await page.evaluateOnNewDocument((data) => {
      localStorage.setItem('oros_vault', data);
    }, vaultData);
  }

  await page.goto(`http://localhost:${PORT}`);
  await page.waitForSelector('#root', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));

  console.log('[2/8] Application loaded in Chrome headless (Retina 2x resolution)');

  // Enter workspace
  await page.evaluate(() => {
    const store = window.__orosWorldStore;
    if (store) {
      store.getState().setAppView('workspace');
    }
  });
  await new Promise((r) => setTimeout(r, 1500));

  // --- SCREENSHOT 1: Hero Canvas (War Table) ---
  console.log('[3/8] Capturing Screenshot 1: Hero Canvas (War Table)...');
  await page.evaluate(() => {
    const store = window.__orosWorldStore;
    if (store) {
      const worldId = store.getState().activeWorldId;
      const canvases = store.getState().canvases[worldId] || [];
      const canvas = canvases[0];
      if (canvas) {
        store.getState().openTab({
          id: 'tab-canvas-war-table',
          type: 'canvas',
          title: canvas.name || canvas.title || 'Canvas',
          targetId: canvas.id
        });
      }
    }
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(outputDir, 'hero-canvas-war-table.png')
  });
  console.log('      -> Saved showcase-assets/hero-canvas-war-table.png');

  // --- SCREENSHOT 2: Heraldic Relations Network Graph ---
  console.log('[4/8] Capturing Screenshot 2: Heraldic Relations Network Graph...');
  await page.evaluate(() => {
    const store = window.__orosWorldStore;
    if (store) {
      store.getState().openTab({
        id: 'tab-relations-heraldic',
        type: 'relations',
        title: 'Relations Graph'
      });
    }
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(outputDir, 'heraldic-relations-graph.png')
  });
  console.log('      -> Saved showcase-assets/heraldic-relations-graph.png');

  // --- SCREENSHOT 3: Studio Writer Manuscript ---
  console.log('[5/8] Capturing Screenshot 3: Studio Writer Manuscript...');
  await page.evaluate(() => {
    const store = window.__orosWorldStore;
    if (store) {
      const worldId = store.getState().activeWorldId;
      const chapters = store.getState().manuscripts[worldId] || [];
      const ch = chapters[0];
      store.getState().openTab({
        id: 'tab-studio-writer',
        type: 'writer',
        title: ch ? ch.title : 'Studio Writer',
        targetId: ch?.id
      });
    }
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(outputDir, 'studio-writer-manuscript.png')
  });
  console.log('      -> Saved showcase-assets/studio-writer-manuscript.png');

  // --- SCREENSHOT 4: Codex / Lore Wiki Article ---
  console.log('[6/8] Capturing Screenshot 4: Codex / Lore Wiki Article...');
  await page.evaluate(() => {
    const store = window.__orosWorldStore;
    if (store) {
      store.getState().setSelectedEntityId('char-corvus');
      store.getState().openTab({
        id: 'tab-codex-corvus',
        type: 'wiki',
        title: 'Lord Corvus Ostergard',
        targetId: 'char-corvus'
      });
    }
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(outputDir, 'codex-wiki-article.png')
  });
  console.log('      -> Saved showcase-assets/codex-wiki-article.png');

  // --- SCREENSHOT 5: Tactical Battlemap ---
  console.log('[7/8] Capturing Screenshot 5: Tactical Battlemap...');
  await page.evaluate(() => {
    const store = window.__orosWorldStore;
    if (store) {
      const worldId = store.getState().activeWorldId;
      const maps = store.getState().maps[worldId] || [];
      const map = maps[0];
      if (map) {
        store.getState().setSelectedMapId(map.id);
        store.getState().openTab({
          id: 'tab-tactical-map',
          type: 'map',
          title: map.name || map.title || 'Map',
          targetId: map.id
        });
      }
    }
  });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({
    path: path.join(outputDir, 'tactical-battlemap.png')
  });
  console.log('      -> Saved showcase-assets/tactical-battlemap.png');

  // --- SCREENSHOT 6 & GIF 1: Spotlight Search (Ctrl+K) ---
  console.log('[8/8] Capturing Spotlight Search & Micro-Interaction GIFs...');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await new Promise((r) => setTimeout(r, 500));

  const spotlightFrames = [];
  const searchChars = ['C', 'o', 'r', 'v', 'u', 's'];
  for (const char of searchChars) {
    await page.keyboard.type(char, { delay: 100 });
    await new Promise((r) => setTimeout(r, 120));
    const frame = await page.screenshot({ encoding: 'binary' });
    spotlightFrames.push(frame);
  }
  // Hold final search frame
  for (let i = 0; i < 5; i++) {
    spotlightFrames.push(spotlightFrames[spotlightFrames.length - 1]);
  }

  await page.screenshot({
    path: path.join(outputDir, 'spotlight-search.png')
  });
  console.log('      -> Saved showcase-assets/spotlight-search.png');

  const spotlightGifBuf = createGifFromPngBuffers(spotlightFrames, { delay: 180 });
  if (spotlightGifBuf) {
    fs.writeFileSync(path.join(outputDir, 'spotlight-search-interaction.gif'), spotlightGifBuf);
    console.log(`      -> Saved showcase-assets/spotlight-search-interaction.gif (${(spotlightGifBuf.length / 1024).toFixed(1)} KB)`);
  }

  // Close command palette with Escape
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // --- GIF 2: Canvas Drag & Real-Time Orthogonal Wire Recalculation ---
  console.log('      Recording GIF 2: Canvas Drag & Orthogonal Routing...');
  await page.evaluate(() => {
    const store = window.__orosWorldStore;
    if (store) {
      store.getState().setActiveTab('tab-canvas-war-table');
    }
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Find an interactive node on the canvas
  const nodeBounding = await page.evaluate(() => {
    const nodeEl = document.querySelector('.react-flow__node');
    if (nodeEl) {
      const rect = nodeEl.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    return { x: 500, y: 350 };
  });

  const canvasDragFrames = [];
  await page.mouse.move(nodeBounding.x, nodeBounding.y);
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 100));

  // Drag in an arc across 12 frames
  for (let i = 0; i <= 14; i++) {
    const dx = Math.sin((i / 14) * Math.PI) * 120;
    const dy = (i / 14) * 80;
    await page.mouse.move(nodeBounding.x + dx, nodeBounding.y + dy);
    await new Promise((r) => setTimeout(r, 60));
    const frame = await page.screenshot({ encoding: 'binary' });
    canvasDragFrames.push(frame);
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 100));

  const canvasDragGifBuf = createGifFromPngBuffers(canvasDragFrames, { delay: 90 });
  if (canvasDragGifBuf) {
    fs.writeFileSync(path.join(outputDir, 'canvas-drag-orthogonal-routing.gif'), canvasDragGifBuf);
    console.log(`      -> Saved showcase-assets/canvas-drag-orthogonal-routing.gif (${(canvasDragGifBuf.length / 1024).toFixed(1)} KB)`);
  }

  // --- GIF 3: Studio Writer Wiki-Link Reference Peek Drawer ---
  console.log('      Recording GIF 3: Studio Writer Wiki-Link Peek Drawer...');
  await page.evaluate(() => {
    const store = window.__orosWorldStore;
    if (store) {
      store.getState().setActiveTab('tab-studio-writer');
    }
  });
  await new Promise((r) => setTimeout(r, 1000));

  const wikiLinkRect = await page.evaluate(() => {
    const link = document.querySelector('.oros-wiki-link, .oros-mention, a[data-entity-id]');
    if (link) {
      const rect = link.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    return null;
  });

  const writerFrames = [];
  if (wikiLinkRect) {
    // Hover
    await page.mouse.move(wikiLinkRect.x, wikiLinkRect.y);
    await new Promise((r) => setTimeout(r, 150));
    writerFrames.push(await page.screenshot({ encoding: 'binary' }));

    // Click
    await page.mouse.click(wikiLinkRect.x, wikiLinkRect.y);
    for (let f = 0; f < 8; f++) {
      await new Promise((r) => setTimeout(r, 70));
      writerFrames.push(await page.screenshot({ encoding: 'binary' }));
    }
    // Pause on open drawer
    for (let f = 0; f < 4; f++) {
      writerFrames.push(writerFrames[writerFrames.length - 1]);
    }

    const writerGifBuf = createGifFromPngBuffers(writerFrames, { delay: 100 });
    if (writerGifBuf) {
      fs.writeFileSync(path.join(outputDir, 'writer-wiki-transclusion-peek.gif'), writerGifBuf);
      console.log(`      -> Saved showcase-assets/writer-wiki-transclusion-peek.gif (${(writerGifBuf.length / 1024).toFixed(1)} KB)`);
    }
  }

  await browser.close();
  server.close();

  console.log('\n[SUCCESS] Phase 2 asset captures completed successfully!');
  console.log(`Outputs located in: ${outputDir}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[ERROR] Phase 2 capture failed:', err);
  process.exit(1);
});
