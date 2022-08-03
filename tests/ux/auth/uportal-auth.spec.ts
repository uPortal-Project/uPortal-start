import { test, expect } from '@playwright/test';
import { login_via_page } from "../utils/ux-general-utils";

const SEL_UPORTAL_LOGOUT = '.portal-logout';

test.only('login, logout, login as different user', async ({ page }) => {
  // Login as admin
  await login_via_page(page, 'admin', 'admin', 'Amy Administrator');

  // Logout via UX
  const uportalSignout = page.locator(SEL_UPORTAL_LOGOUT);
  await expect(uportalSignout).toHaveText('Sign Out');
  await expect(uportalSignout).toHaveAttribute('href', '/uPortal/Logout');
  await page.click(SEL_UPORTAL_LOGOUT);

  // Confirm default CAS logout page
  const casLogoutSuccessful = page.locator('div > h2');
  await expect(casLogoutSuccessful).toHaveText('Logout successful');

  // Login as student
  await login_via_page(page, 'student', 'student', 'Steven Student');
});
