import { test, expect } from "@playwright/test";
import { config } from "../../general-config";

test.describe("Guest page rendering", () => {
  test("renders the welcome page with expected portlets", async ({ page }) => {
    await page.goto(`${config.url}f/welcome/normal/render.uP`);

    // Header elements
    const logo = page.locator("h1.portal-logo > a");
    await expect(logo).toHaveText("uPortal");
    await expect(page.locator("#portalCASLoginLink")).toBeVisible();

    // Welcome tab is active
    await expect(
      page.locator(".portal-navigation.active .portal-navigation-label")
    ).toHaveText("Welcome");

    // Expected portlet headings are present in title bars
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Welcome to uPortal")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Logging in")
    ).toBeVisible();
  });

  test("search box is visible", async ({ page }) => {
    await page.goto(`${config.url}f/welcome/normal/render.uP`);
    await expect(
      page.getByRole("searchbox", { name: "Search Terms" })
    ).toBeVisible();
  });

  test("guest has no waffle menu or notifications", async ({ page }) => {
    await page.goto(`${config.url}f/welcome/normal/render.uP`);
    await expect(page.locator("waffle-menu")).not.toBeAttached();
    await expect(page.locator("notification-icon")).not.toBeAttached();
  });

  test("footer contains Apereo attribution", async ({ page }) => {
    await page.goto(`${config.url}f/welcome/normal/render.uP`);
    await expect(
      page.locator("#region-footer-second")
    ).toContainText("Apereo");
  });
});
