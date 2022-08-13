import { test, expect } from "@playwright/test";
import { loginViaPage } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const SEL_UPORTAL_LOGOUT = ".portal-logout";

test("login, logout, login as different user", async ({ page }) => {
  // Login as admin
  await loginViaPage(page, config.users.admin);

  // Logout via UX
  const uportalSignout = page.locator(SEL_UPORTAL_LOGOUT);
  await expect(uportalSignout).toHaveText("Sign Out");
  await expect(uportalSignout).toHaveAttribute("href", "/uPortal/Logout");
  await page.click(SEL_UPORTAL_LOGOUT);

  // Confirm default CAS logout page
  const casLogoutSuccessful = page.locator("div > h2");
  await expect(casLogoutSuccessful).toHaveText("Logout successful");

  // Login as student
  await loginViaPage(page, config.users.student);
});
