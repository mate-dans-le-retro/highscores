import { expect, test } from '@playwright/test'

test.describe('mock smoke', () => {
  test('public screen shows the demo watermark and a seeded game', async ({
    page,
  }) => {
    await page.goto('/?mock=1')

    await expect(page.getByText('Données de démo')).toBeVisible()
    await expect(
      page
        .getByRole('heading', {
          name: /TETRIS|DUCK HUNT|PAC-MAN|GUITAR HERO/i,
        })
        .first(),
    ).toBeVisible({ timeout: 20_000 })
  })

  test('player form opens in mock mode', async ({ page }) => {
    await page.goto('/score?mock=1')

    await expect(page.getByText('Données de démo')).toBeVisible()
    await expect(
      page.getByText(/Prends ton score en photo/i),
    ).toBeVisible({ timeout: 15_000 })
  })
})
