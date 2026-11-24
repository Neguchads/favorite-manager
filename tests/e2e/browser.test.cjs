// Chromium runs the production extension rather than a dev page or mocked DOM.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

test('unpacked MV3 extension loads popup and settings', { timeout: 65000 }, async () => {
  const dist = path.resolve('dist');
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.background.service_worker);
  assert.ok(manifest.action.default_popup);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'favorite-e2e-'));
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    });
    const worker = context.serviceWorkers()[0] ||
      await context.waitForEvent('serviceworker', { timeout: 20000 });
    const extensionId = new URL(worker.url()).host;
    assert.match(extensionId, /^[a-p]{32}$/);
    const page = await context.newPage();
    for (const relative of [manifest.action.default_popup, manifest.options_ui.page]) {
      await page.goto(`chrome-extension://${extensionId}/${relative}`, { waitUntil: 'domcontentloaded' });
      await page.locator('#root').waitFor({ state: 'attached', timeout: 15000 });
      assert.match(await page.title(), /Favorite Manager/i);
    }
  } finally {
    if (context) await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
});
