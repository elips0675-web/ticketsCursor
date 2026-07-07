import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText(/вход|login/i)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows error on invalid login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@test.com')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=ошибка|error|неверный')).toBeVisible({ timeout: 5000 })
  })

  test('navigates to tickets after valid login', async ({ page }) => {
    await page.goto('/login')
    // Using dev-login: Post request to get token then store
    const token = await page.evaluate(async () => {
      const r = await fetch('http://localhost:4000/api/auth/dev-login', { method: 'POST' })
      const d = await r.json()
      return d.token
    })
    await page.evaluate((t) => localStorage.setItem('token', t), token)
    await page.goto('/tickets')
    await expect(page).toHaveURL(/\/tickets/)
  })
})
