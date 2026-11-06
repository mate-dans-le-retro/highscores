/**
 * Open /dev?mock=1, call window.__exportQrPosterGames(), write files to outDir.
 *
 * Requires playwright-core (or playwright) and a local Chrome:
 *   pnpm add -D playwright-core
 *   node scripts/export-qr-poster-games.mjs http://127.0.0.1:3006 <outDir>
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright-core')

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3006'
const outDir = process.argv[3]
const chromePath =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

if (!outDir) {
  console.error(
    'Usage: node scripts/export-qr-poster-games.mjs <baseUrl> <outDir>',
  )
  process.exit(1)
}

await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
})
const page = await browser.newPage()
page.setDefaultTimeout(180_000)
await page.goto(`${baseUrl}/dev?mock=1`, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(
  () => typeof window.__exportQrPosterGames === 'function',
  null,
  { timeout: 60_000 },
)

const files = await page.evaluate(async () => window.__exportQrPosterGames())

for (const file of files) {
  const target = path.join(outDir, file.name)
  await fs.writeFile(target, Buffer.from(file.base64, 'base64'))
  console.log('wrote', target)
}

await browser.close()
console.log('done', files.length, 'files')
