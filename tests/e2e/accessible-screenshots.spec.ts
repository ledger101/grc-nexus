import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve(process.cwd(), 'screenshots', 'public')

function safeName(p: string) {
  const cleaned = p.replace(/^\/+/, '').replace(/\/+$/, '') || 'root'
  return cleaned.replace(/[^a-zA-Z0-9_-]+/g, '_')
}

async function screenshotIfAccessible(page: any, targetPath: string) {
  const response = await page.goto(targetPath, { waitUntil: 'networkidle' })
  const finalUrl = new URL(page.url())

  const status = response?.status() ?? 0
  const redirectedToLogin = finalUrl.pathname.startsWith('/login') && !targetPath.startsWith('/login')

  if (!response || status >= 400 || redirectedToLogin) return { ok: false, status, finalPath: finalUrl.pathname }

  const fileName = `${safeName(finalUrl.pathname)}.png`
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.screenshot({ path: path.join(OUT_DIR, fileName), fullPage: true })
  return { ok: true, status, finalPath: finalUrl.pathname, fileName }
}

test('take screenshots of accessible (public) pages', async ({ page }) => {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // Seed with known public routes from middleware.ts
  const queue = ['/login', '/register', '/register/pending']
  const seen = new Set<string>()
  const okPages: string[] = []

  while (queue.length) {
    const p = queue.shift()!
    if (seen.has(p)) continue
    seen.add(p)

    const result = await screenshotIfAccessible(page, p)
    if (!result.ok) continue

    okPages.push(result.finalPath)

    // Discover additional internal links from the page
    const hrefs: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map(a => (a as HTMLAnchorElement).getAttribute('href') || '')
        .filter(Boolean)
    )

    for (const href of hrefs) {
      if (!href.startsWith('/')) continue
      if (href.startsWith('/_next')) continue
      if (href.includes('#')) continue
      if (!seen.has(href)) queue.push(href)
    }
  }

  // At least the login page should be accessible
  expect(okPages).toContain('/login')
})
