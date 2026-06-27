// יוצר את אייקוני ה-PWA מתוך קובצי ה-SVG, באמצעות Chromium.
// האייקונים כבר נוצרו ונשמרו ב-public/icons. כדי ליצור מחדש:
//   npm i -D playwright && node scripts/gen-icons.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const iconsDir = path.join(root, 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

const standard = readFileSync(path.join(root, 'public', 'favicon.svg'), 'utf8')
const maskable = readFileSync(path.join(root, 'scripts', 'icon-maskable.svg'), 'utf8')

const targets = [
  { svg: standard, size: 192, out: path.join(iconsDir, 'icon-192.png') },
  { svg: standard, size: 512, out: path.join(iconsDir, 'icon-512.png') },
  { svg: maskable, size: 512, out: path.join(iconsDir, 'icon-maskable-512.png') },
  { svg: standard, size: 180, out: path.join(root, 'public', 'apple-touch-icon.png') },
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size }, deviceScaleFactor: 1 })
  const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(t.svg).toString('base64')
  await page.setContent(
    `<html><body style="margin:0"><img src="${dataUrl}" width="${t.size}" height="${t.size}"/></body></html>`,
  )
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: t.out, omitBackground: true })
  await page.close()
  console.log('✓', path.relative(root, t.out))
}
await browser.close()
console.log('האייקונים נוצרו בהצלחה')
