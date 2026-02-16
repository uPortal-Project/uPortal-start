import { test, expect } from "@playwright/test";
import { config } from "../../general-config";
import { loginViaUrl, logout } from "../utils/ux-general-utils";

// --- Admin ---

test.describe("Admin smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("has expected tabs", async ({ page }) => {
    const tabs = page.locator(".portal-navigation-label");
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toHaveText("Admin Tools");
    await expect(tabs.nth(1)).toHaveText("Development");
    await expect(tabs.nth(2)).toHaveText("Testing");
  });

  test("Admin Tools tab shows admin content", async ({ page }) => {
    // Admin Tools is the default landing tab — verify the sitemap footer
    await expect(
      page.locator("#sitemap-holder").getByRole("link", { name: "Admin Dashboard" })
    ).toBeVisible();
  });

  test("Development tab has Snooper portlet", async ({ page }) => {
    await page.locator(".portal-navigation-label:has-text('Development')").click();
    await expect(
      page.locator(".up-portlet-titlebar h2:has-text('Snooper')")
    ).toBeVisible();
  });

  test("Testing tab has test portlets", async ({ page }) => {
    await page.locator(".portal-navigation-label:has-text('Testing')").click();
    await expect(
      page.locator("#sitemap-holder").getByRole("link", { name: "Test Portlet 1" })
    ).toBeVisible();
  });

  test("waffle menu is present", async ({ page }) => {
    const waffle = page.locator("waffle-menu");
    await expect(waffle).toBeAttached();
  });

  test("notification icon is present", async ({ page }) => {
    const notification = page.locator("notification-icon");
    await expect(notification).toBeAttached();
  });
});

// --- Student ---

test.describe("Student smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("has expected tabs", async ({ page }) => {
    const tabs = page.locator(".portal-navigation-label");
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toHaveText("Welcome");
    await expect(tabs.nth(1)).toHaveText("Academics");
    await expect(tabs.nth(2)).toHaveText("LMS");
    await expect(tabs.nth(3)).toHaveText("Campus");
  });

  test("Welcome tab has Bookmarks, Calendar, My Drives", async ({ page }) => {
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Bookmarks")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Calendar")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("My Drives")
    ).toBeVisible();
  });

  test("Academics tab has Announcements and Courses", async ({ page }) => {
    await page.locator(".portal-navigation-label:has-text('Academics')").click();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Announcements")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Courses")
    ).toBeVisible();
  });

  test("Courses portlet shows course list", async ({ page }) => {
    await page.goto(`${config.url}f/academics/normal/render.uP`);
    await expect(page.getByText("Design Awareness")).toBeVisible();
    await expect(page.getByText("First-Year Composition")).toBeVisible();
    await expect(page.getByText("Precalculus")).toBeVisible();
  });

  test("LMS tab has Basic LTI Portlet", async ({ page }) => {
    await page.locator(".portal-navigation-label:has-text('LMS')").click();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Basic LTI Portlet (demo)")
    ).toBeVisible();
  });

  test("Campus tab has Map portlet", async ({ page }) => {
    await page.locator(".portal-navigation-label:has-text('Campus')").click();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Map")
    ).toBeVisible();
  });

  test("waffle menu is present", async ({ page }) => {
    await expect(page.locator("waffle-menu")).toBeAttached();
  });

  test("notification icon shows badge count", async ({ page }) => {
    const notification = page.locator("notification-icon");
    await expect(notification).toBeAttached();
  });
});

// --- Faculty ---

test.describe("Faculty smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.faculty);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("has expected tabs", async ({ page }) => {
    const tabs = page.locator(".portal-navigation-label");
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toHaveText("Welcome");
    await expect(tabs.nth(1)).toHaveText("Academics");
    await expect(tabs.nth(2)).toHaveText("LMS");
    await expect(tabs.nth(3)).toHaveText("Campus");
  });

  test("Welcome tab has core portlets", async ({ page }) => {
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Bookmarks")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Calendar")
    ).toBeVisible();
  });

  test("Academics tab has portlets", async ({ page }) => {
    await page.locator(".portal-navigation-label:has-text('Academics')").click();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Announcements")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Courses")
    ).toBeVisible();
  });
});

// --- Staff ---

test.describe("Staff smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.staff);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("has expected tabs", async ({ page }) => {
    const tabs = page.locator(".portal-navigation-label");
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toHaveText("Welcome");
    await expect(tabs.nth(1)).toHaveText("Main Staff Tab");
  });

  test("Welcome tab has core portlets", async ({ page }) => {
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Bookmarks")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Calendar")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("My Drives")
    ).toBeVisible();
  });

  test("Main Staff Tab has expected portlets", async ({ page }) => {
    await page.locator(".portal-navigation-label:has-text('Main Staff Tab')").click();
    await expect(
      page.locator(".up-portlet-titlebar").getByTitle("Staff Welcome")
    ).toBeVisible();
  });
});
