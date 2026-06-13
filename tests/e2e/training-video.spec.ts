/**
 * training-video.spec.ts
 * ─────────────────────
 * Comprehensive app walkthrough for training video production.
 * Run with: npx playwright test --project=training-video --headed
 *
 * Credentials supplied via env: TRAINING_EMAIL / TRAINING_PASSWORD
 * Falls back to the demo admin account if env vars are not set.
 *
 * Findings (bugs / UX issues) are collected in the `findings` array
 * and logged to the console at the end of the test.
 */

import { test, expect, type Page } from '@playwright/test'

// ─── helpers ───────────────────────────────────────────────────────────────

const EMAIL    = process.env.TRAINING_EMAIL    ?? 'admin@grcnexus.gov.zw'
const PASSWORD = process.env.TRAINING_PASSWORD ?? 'Admin@GRC2026!'

const findings: string[] = []

function log(msg: string) {
  console.log(`  ▶ ${msg}`)
}

function finding(msg: string) {
  findings.push(msg)
  console.warn(`  ⚠ FINDING: ${msg}`)
}

/** Navigate and wait for the network to be idle. Resilient to ERR_ABORTED. */
async function go(page: Page, path: string) {
  try {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 45_000 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('ERR_ABORTED') || msg.includes('net::')) {
      // ERR_ABORTED can occur when Next.js does a server-side redirect during compile.
      // Wait for the page to settle then continue.
      finding(`Navigation to ${path} was aborted (${msg.slice(0, 80)}) — page may have redirected`)
      await page.waitForLoadState('domcontentloaded').catch(() => {})
    } else {
      throw err
    }
  }
  await page.waitForTimeout(800)
}

/** Click a detail link and return whether we landed on a new URL (not redirected back). */
async function clickDetail(page: Page, link: import('@playwright/test').Locator, listPattern: RegExp): Promise<boolean> {
  const href = await link.getAttribute('href').catch(() => '')
  log(`Detail link href: ${href}`)
  await link.click()
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1_200)
  const finalUrl = page.url()
  log(`Detail URL after click: ${finalUrl}`)
  if (listPattern.test(finalUrl)) {
    finding(`Detail page for ${href} redirected back to list (${finalUrl}) — possible RLS blocking single-row query`)
    return false
  }
  return true
}

/** Click the first matching element if it exists; return true if clicked. */
async function clickIfExists(page: Page, selector: string): Promise<boolean> {
  const el = page.locator(selector)
  if (await el.count() > 0) {
    await el.first().click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    return true
  }
  return false
}

/** Hover over an element to reveal tooltips / hover states. */
async function hover(page: Page, selector: string) {
  const el = page.locator(selector)
  if (await el.count() > 0) await el.first().hover()
  await page.waitForTimeout(400)
}

// ─── test ──────────────────────────────────────────────────────────────────

test('GRC-Nexus full application walkthrough', async ({ page }) => {
  // Allow 8 minutes — slowMo:250 + many pages + networkidle waits add up
  test.setTimeout(480_000)

  // ══════════════════════════════════════════════════════════════════════════
  // 0. COLLECT CONSOLE ERRORS for findings report
  // ══════════════════════════════════════════════════════════════════════════
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => finding(`Uncaught JS error: ${err.message}`))

  // ══════════════════════════════════════════════════════════════════════════
  // 1. LOGIN
  // ══════════════════════════════════════════════════════════════════════════
  log('Navigating to login page')
  await go(page, '/login')

  // Verify login page rendered — heading says "GRC-Nexus", not "Sign in"
  await expect(page.getByRole('heading', { name: /grc-nexus/i })).toBeVisible({ timeout: 15_000 })
  log('Login page loaded')

  // Fill email — label text is "Email address"
  await page.getByLabel('Email address').fill(EMAIL)
  await page.waitForTimeout(500)
  // Fill password by placeholder — avoids matching the "Show password" aria-label button
  await page.getByPlaceholder('Enter your password').fill(PASSWORD)
  await page.waitForTimeout(500)

  log('Submitting login form')
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Wait for redirect to dashboard
  try {
    await page.waitForURL(/\/(dashboard|api\/auth\/refresh)/, { timeout: 30_000 })
    // If redirected to refresh route, wait for second redirect
    if (page.url().includes('/api/auth/refresh')) {
      log('JWT refresh triggered — waiting for dashboard redirect')
      await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
    }
  } catch {
    finding(`Login redirect failed — still on: ${page.url()}`)
    const errorText = await page.locator('[role=alert]').first().textContent().catch(() => 'no alert')
    finding(`Login error text: ${errorText}`)
  }

  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1_500)
  log(`Landed on: ${page.url()}`)

  // ══════════════════════════════════════════════════════════════════════════
  // 2. DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  log('=== DASHBOARD ===')
  await go(page, '/dashboard')
  await page.waitForTimeout(1_200)

  // Check for stat cards / summary widgets
  const statCards = page.locator('[class*="shadow-card"], [class*="rounded"]')
  const cardCount = await statCards.count()
  log(`Dashboard: ${cardCount} card-style elements visible`)

  if (cardCount === 0) finding('Dashboard appears empty — no stat cards found')

  // Scroll through the dashboard
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(600)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(600)
  await page.mouse.wheel(0, -800)
  await page.waitForTimeout(800)

  // ══════════════════════════════════════════════════════════════════════════
  // 3. STRATEGIC — OBJECTIVES
  // ══════════════════════════════════════════════════════════════════════════
  log('=== STRATEGIC — OBJECTIVES ===')
  await go(page, '/strategic/objectives')
  await page.waitForTimeout(1_000)

  // Check for table rows
  const objRows = page.locator('tbody tr')
  const objCount = await objRows.count()
  log(`Strategic objectives: ${objCount} rows in table`)

  if (objCount === 0) {
    log('No objectives — showing empty state.')
  } else {
    log('Clicking first objective to view detail')
    const viewLink = page.locator('tbody tr').first().getByRole('link', { name: 'View' })
    const titleLink = page.locator('tbody tr').first().locator('a').first()
    const detailLink = (await viewLink.count()) ? viewLink : titleLink
    if (await detailLink.count()) {
      const onDetail = await clickDetail(page, detailLink, /\/strategic\/objectives($|\?|\/$)/)
      if (onDetail) {
        await page.mouse.wheel(0, 300)
        await page.waitForTimeout(600)
        await page.goBack()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(800)
      }
    }
  }

  // View New Objective form
  log('Opening New Objective form')
  await go(page, '/strategic/objectives/new')
  await page.waitForTimeout(1_000)
  const objFormHeading = await page.locator('h1, h2').first().textContent().catch(() => '')
  log(`New Objective form heading: "${objFormHeading?.trim()}"`)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(600)

  // ══════════════════════════════════════════════════════════════════════════
  // 4. STRATEGIC — KPIs
  // ══════════════════════════════════════════════════════════════════════════
  log('=== STRATEGIC — KPIs ===')
  await go(page, '/strategic')   // strategic landing / KPI grid
  await page.waitForTimeout(1_000)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(600)

  // Look for a KPI card to click
  const kpiCards = page.locator('a[href*="/strategic/kpis/"]')
  const kpiCount = await kpiCards.count()
  log(`KPI cards visible: ${kpiCount}`)
  if (kpiCount > 0) {
    log('Clicking first KPI card')
    const onKpi = await clickDetail(page, kpiCards.first(), /\/strategic($|\?|\/$)/)
    if (onKpi) {
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(600)
      await page.goBack()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
    }
  }

  // New KPI form
  log('Opening New KPI form')
  await go(page, '/strategic/kpis/new')
  await page.waitForTimeout(1_000)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(600)

  // ══════════════════════════════════════════════════════════════════════════
  // 5. RISK — REGISTER
  // ══════════════════════════════════════════════════════════════════════════
  log('=== RISK — REGISTER ===')
  await go(page, '/risk/register')
  await page.waitForTimeout(1_000)

  const riskRows = page.locator('tbody tr')
  const riskCount = await riskRows.count()
  log(`Risk register: ${riskCount} rows`)

  if (riskCount > 0) {
    log('Clicking first risk for detail view')
    const riskLink = riskRows.first().locator('a').first()
    if (await riskLink.count()) {
      const onRisk = await clickDetail(page, riskLink, /\/risk\/(register|$)/)
      if (onRisk) {
        await page.mouse.wheel(0, 400)
        await page.waitForTimeout(600)
        const treatmentBtn = page.getByRole('link', { name: /add treatment|new treatment/i })
        if (await treatmentBtn.count()) log('Treatment button visible')
        await page.goBack()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(800)
      }
    }
  }

  // New Risk form
  log('Opening New Risk form')
  await go(page, '/risk/new')
  await page.waitForTimeout(1_000)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(600)

  // ══════════════════════════════════════════════════════════════════════════
  // 6. RISK — HEATMAP
  // ══════════════════════════════════════════════════════════════════════════
  log('=== RISK — HEATMAP ===')
  await go(page, '/risk/heatmap')
  await page.waitForTimeout(1_500)
  const heatmapEl = page.locator('[class*="heatmap"], [data-testid="heatmap"], canvas, svg').first()
  if (await heatmapEl.count()) {
    log('Risk heatmap element found')
  } else {
    finding('Risk heatmap: no heatmap SVG/canvas element detected')
  }
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(800)

  // ══════════════════════════════════════════════════════════════════════════
  // 7. COMPLIANCE — OBLIGATIONS
  // ══════════════════════════════════════════════════════════════════════════
  log('=== COMPLIANCE — OBLIGATIONS ===')
  await go(page, '/compliance/obligations')
  await page.waitForTimeout(1_000)

  const oblRows = page.locator('tbody tr')
  const oblCount = await oblRows.count()
  log(`Compliance obligations: ${oblCount} rows`)

  if (oblCount > 0) {
    log('Clicking first obligation')
    const oblLink = oblRows.first().locator('a').first()
    if (await oblLink.count()) {
      const onObl = await clickDetail(page, oblLink, /\/compliance\/obligations($|\?|\/$)/)
      if (onObl) {
        if (await page.getByRole('heading', { name: /attestation/i }).count()) log('Attestation section visible')
        if (await page.getByRole('heading', { name: /evidence/i }).count()) log('Evidence section visible')
        await page.mouse.wheel(0, 400)
        await page.waitForTimeout(600)
        await page.goBack()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(800)
      }
    }
  }

  // New Obligation form
  log('Opening New Obligation form')
  await go(page, '/compliance/obligations/new')
  await page.waitForTimeout(1_000)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(600)

  // Compliance overview / posture
  log('Compliance overview page')
  await go(page, '/compliance')
  await page.waitForTimeout(1_000)

  // ══════════════════════════════════════════════════════════════════════════
  // 8. AUDIT — FINDINGS
  // ══════════════════════════════════════════════════════════════════════════
  log('=== AUDIT — FINDINGS ===')
  await go(page, '/audit/findings')
  await page.waitForTimeout(1_000)

  const findingRows = page.locator('tbody tr')
  const findingCount = await findingRows.count()
  log(`Audit findings: ${findingCount} rows`)

  if (findingCount > 0) {
    log('Clicking first audit finding')
    const findingLink = findingRows.first().locator('a').first()
    if (await findingLink.count()) {
      const onFinding = await clickDetail(page, findingLink, /\/audit\/findings($|\?|\/$)/)
      if (onFinding) {
        await page.mouse.wheel(0, 400)
        await page.waitForTimeout(600)
        await page.goBack()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(800)
      }
    }
  }

  // New Finding form
  log('Opening New Audit Finding form')
  await go(page, '/audit/findings/new')
  await page.waitForTimeout(1_000)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(600)

  // Audit overview
  log('Audit overview page')
  await go(page, '/audit')
  await page.waitForTimeout(1_000)

  // ══════════════════════════════════════════════════════════════════════════
  // 9. BOARD — MEETINGS
  // ══════════════════════════════════════════════════════════════════════════
  log('=== BOARD — MEETINGS ===')
  await go(page, '/board/meetings')
  await page.waitForTimeout(1_000)

  const meetingRows = page.locator('tbody tr')
  const meetingCount = await meetingRows.count()
  log(`Board meetings: ${meetingCount} rows`)

  if (meetingCount > 0) {
    log('Clicking first board meeting')
    const meetingLink = meetingRows.first().locator('a').first()
    if (await meetingLink.count()) {
      const onMeeting = await clickDetail(page, meetingLink, /\/board\/meetings($|\?|\/$)/)
      if (onMeeting) {
        const tabs = page.getByRole('tab')
        const tabCount = await tabs.count()
        log(`Meeting tabs: ${tabCount} tabs found`)
        if (tabCount > 0) {
          const tabLabels: string[] = []
          for (let i = 0; i < tabCount; i++) tabLabels.push(await tabs.nth(i).textContent() ?? '')
          log(`Tab labels: ${tabLabels.join(', ')}`)
          for (let i = 1; i < tabCount; i++) { await tabs.nth(i).click(); await page.waitForTimeout(700) }
          await tabs.first().click()
          await page.waitForTimeout(500)
        }
        await page.goBack()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(800)
      }
    }
  }

  // New Meeting form
  log('Opening New Meeting form')
  await go(page, '/board/meetings/new')
  await page.waitForTimeout(1_000)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(600)

  // Board Action Items
  log('=== BOARD — ACTION ITEMS ===')
  await go(page, '/board/actions')
  await page.waitForTimeout(1_000)
  const actionRows = page.locator('tbody tr')
  const actionCount = await actionRows.count()
  log(`Board action items: ${actionCount} rows`)

  // Board overview
  log('Board overview page')
  await go(page, '/board')
  await page.waitForTimeout(1_000)

  // ══════════════════════════════════════════════════════════════════════════
  // 10. INCIDENTS — CASES
  // ══════════════════════════════════════════════════════════════════════════
  log('=== INCIDENTS — CASES ===')
  await go(page, '/incidents/cases')
  await page.waitForTimeout(1_000)

  const caseRows = page.locator('tbody tr')
  const caseCount = await caseRows.count()
  log(`Incident cases: ${caseCount} rows`)

  if (caseCount > 0) {
    log('Clicking first incident case')
    const caseLink = caseRows.first().locator('a').first()
    if (await caseLink.count()) {
      const onCase = await clickDetail(page, caseLink, /\/incidents\/cases($|\?|\/$)/)
      if (onCase) {
        await page.mouse.wheel(0, 400)
        await page.waitForTimeout(600)
        await page.goBack()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(800)
      }
    }
  }

  // Report incident form
  log('Opening Report Incident form')
  await go(page, '/incidents/report')
  await page.waitForTimeout(1_000)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(600)

  // Incidents overview
  log('Incidents overview page')
  await go(page, '/incidents')
  await page.waitForTimeout(1_000)

  // ══════════════════════════════════════════════════════════════════════════
  // 11. ADMIN — USER MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  log('=== ADMIN — USER MANAGEMENT ===')
  await go(page, '/admin/users')
  await page.waitForTimeout(1_000)

  const userRows = page.locator('tbody tr')
  const userCount = await userRows.count()
  log(`Admin user table: ${userCount} user rows`)
  if (userCount === 0) finding('Admin users table appears empty — expected at least the admin seed user')

  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(600)

  // ══════════════════════════════════════════════════════════════════════════
  // 12. ADMIN — AUDIT LOG
  // ══════════════════════════════════════════════════════════════════════════
  log('=== ADMIN — AUDIT LOG ===')
  await go(page, '/admin/audit-log')
  await page.waitForTimeout(1_000)

  const auditLogRows = page.locator('tbody tr')
  const auditLogCount = await auditLogRows.count()
  log(`Audit log: ${auditLogCount} rows visible`)
  if (auditLogCount === 0) finding('Audit log appears empty — expected entries from login + navigation')

  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(600)

  // Check for DiffViewer / expand row
  const expandButtons = page.locator('button[aria-label*="diff"], button[aria-label*="expand"], button:has-text("{")')
  if (await expandButtons.count() > 0) {
    log('Expanding first audit log diff')
    await expandButtons.first().click()
    await page.waitForTimeout(800)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 13. RETURN TO DASHBOARD — FINAL SHOT
  // ══════════════════════════════════════════════════════════════════════════
  log('=== FINAL — BACK TO DASHBOARD ===')
  await go(page, '/dashboard')
  await page.waitForTimeout(2_000)

  // ══════════════════════════════════════════════════════════════════════════
  // 14. FINDINGS REPORT
  // ══════════════════════════════════════════════════════════════════════════

  // Attach console errors as findings — deduplicated
  if (consoleErrors.length) {
    const seen = new Map<string, number>()
    for (const err of consoleErrors) {
      const key = err.slice(0, 120)
      seen.set(key, (seen.get(key) ?? 0) + 1)
    }
    for (const [msg, count] of seen) {
      finding(`Browser console error (×${count}): ${msg}`)
    }
  }

  log('\n══ FINDINGS REPORT ══')
  if (findings.length === 0) {
    log('No issues found — walkthrough completed cleanly.')
  } else {
    findings.forEach((f, i) => log(`${i + 1}. ${f}`))
  }

  // Soft-assert no findings with CRITICAL keyword
  const criticalFindings = findings.filter(
    (f) => /error|404|crash|failed/i.test(f)
  )
  if (criticalFindings.length) {
    console.warn('\n⛔ CRITICAL FINDINGS:')
    criticalFindings.forEach((f) => console.warn(`  • ${f}`))
  }

  // Always pass — this is a walkthrough, not a pass/fail test
  expect(true).toBe(true)
})
