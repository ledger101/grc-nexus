import { test, expect } from '@playwright/test'

test('training walkthrough (records video)', async ({ page }) => {
  const email = process.env.TRAINING_EMAIL
  const password = process.env.TRAINING_PASSWORD

  expect(email, 'Set TRAINING_EMAIL env var').toBeTruthy()
  expect(password, 'Set TRAINING_PASSWORD env var').toBeTruthy()

  await page.goto('/login', { waitUntil: 'networkidle' })

  await page.getByLabel('Email address').fill(email!)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 30_000 })
  await page.waitForTimeout(1200)

  // Sidebar walkthrough
  const navClicks: Array<{ name: string; url: RegExp }> = [
    { name: 'Dashboard', url: /\/dashboard(\/|$)/ },
    { name: 'Strategic', url: /\/strategic(\/|$)/ },
    { name: 'Risk', url: /\/risk(\/|$)/ },
    { name: 'Compliance', url: /\/compliance(\/|$)/ },
    { name: 'Audit', url: /\/audit(\/|$)/ },
    { name: 'Board', url: /\/board(\/|$)/ },
    { name: 'Incidents', url: /\/incidents(\/|$)/ },
    { name: 'Admin', url: /\/admin(\/|$)/ },
  ]

  for (const item of navClicks) {
    const link = page.getByRole('link', { name: item.name })
    if (await link.count()) {
      await link.first().click()
      await page.waitForURL(item.url, { timeout: 30_000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1200)
    }
  }
})
