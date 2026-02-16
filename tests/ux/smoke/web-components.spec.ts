import { test, expect } from "@playwright/test";
import { config } from "../../general-config";
import { loginViaUrl, logout } from "../utils/ux-general-utils";

test.describe("Waffle menu", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("waffle menu opens and shows quicklinks", async ({ page }) => {
    // The waffle-menu is a web component with shadow DOM
    const waffle = page.locator("waffle-menu");
    await expect(waffle).toBeAttached();

    // Click the waffle button inside shadow DOM
    const waffleButton = waffle.locator("button");
    await waffleButton.click();

    // After clicking, quicklink items should appear
    // The links are rendered inside the shadow DOM
    const links = waffle.locator("a");
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test("waffle menu contains expected quicklinks for student", async ({
    page,
  }) => {
    const waffle = page.locator("waffle-menu");
    const waffleButton = waffle.locator("button");
    await waffleButton.click();

    // Check for known quicklinks
    await expect(waffle.locator("text=Courses")).toBeVisible();
    await expect(waffle.locator("text=Favorites")).toBeVisible();
    await expect(waffle.locator("text=uPortal Links")).toBeVisible();
  });
});

test.describe("Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("notification icon is present with badge", async ({ page }) => {
    const notification = page.locator("notification-icon");
    await expect(notification).toBeAttached();

    // The badge shows a count (rendered in shadow DOM)
    const badge = notification.locator("button");
    await expect(badge).toBeVisible();
  });

  test("notification dropdown opens and shows items", async ({ page }) => {
    const notification = page.locator("notification-icon");
    const badge = notification.locator("button");
    await badge.click();

    // Notifications dropdown should show items
    const items = notification.locator("a, li, [class*='notification']");
    const itemCount = await items.count();
    expect(itemCount).toBeGreaterThan(0);
  });
});

test.describe("Customize", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("customize button is visible for logged-in users", async ({
    page,
  }) => {
    const customizeBtn = page.locator(
      "button:has-text('Customize'), a:has-text('Customize')"
    );
    await expect(customizeBtn).toBeVisible();
  });
});

test.describe("Feedback link", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("feedback link is visible for logged-in users", async ({ page }) => {
    await expect(
      page.locator("text=Your feedback is important to us!")
    ).toBeVisible();
  });
});
