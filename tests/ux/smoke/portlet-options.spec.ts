import { test, expect } from "@playwright/test";
import { config } from "../../general-config";
import { loginViaUrl, logout } from "../utils/ux-general-utils";

test.describe("Portlet Options menu", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("Options dropdown shows expected items for unlocked portlet", async ({
    page,
  }) => {
    // Calendar is an unlocked (movable) portlet
    const calendarWrapper = page.locator(
      ".up-portlet-wrapper:has(.portlet-title a[title='Calendar'])"
    );
    await calendarWrapper
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();

    const menu = calendarWrapper.locator(".portlet-options-menu .dropdown-menu");
    await expect(menu).toBeVisible();

    // Verify all expected menu items
    await expect(
      menu.locator(".up-portlet-options-item.rate")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.favorite")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.move")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.remove")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.maximize")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.minimize")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.edit")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.directUrl")
    ).toBeVisible();
  });

  test("Options dropdown shows expected items for locked portlet", async ({
    page,
  }) => {
    // Bookmarks is a locked portlet — should NOT have move/remove
    const bookmarksWrapper = page.locator(
      ".up-portlet-wrapper:has(.portlet-title a[title='Bookmarks'])"
    );
    await bookmarksWrapper
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();

    const menu = bookmarksWrapper.locator(
      ".portlet-options-menu .dropdown-menu"
    );
    await expect(menu).toBeVisible();

    // Locked portlets should have rate, favorite, maximize, minimize, edit, directUrl
    await expect(
      menu.locator(".up-portlet-options-item.rate")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.favorite")
    ).toBeVisible();
    await expect(
      menu.locator(".up-portlet-options-item.maximize")
    ).toBeVisible();

    // Locked portlets should NOT have move or remove
    await expect(
      menu.locator(".up-portlet-options-item.move")
    ).not.toBeAttached();
    await expect(
      menu.locator(".up-portlet-options-item.remove")
    ).not.toBeAttached();
  });
});

test.describe("Portlet maximized view", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("Bookmarks portlet opens in maximized mode", async ({ page }) => {
    // Navigate to maximized view via direct URL
    await page.goto(`${config.url}p/bookmarks`);

    // Portlet title should be visible
    await expect(
      page.locator(".up-portlet-titlebar .portlet-title")
    ).toContainText("Bookmarks");

    // Options dropdown should be available in maximized view
    await expect(
      page.locator(".portlet-options-menu .dropdown-toggle")
    ).toBeVisible();

    // Portlet content should be visible
    await expect(page.getByText("no bookmarks")).toBeVisible();
  });

  test("Calendar portlet opens in maximized mode with expanded content", async ({
    page,
  }) => {
    await page.goto(`${config.url}p/calendar`);

    await expect(
      page.locator(".up-portlet-titlebar .portlet-title")
    ).toContainText("Calendar");

    // Maximized Calendar shows "My Calendars" section
    await expect(page.getByText("My Calendars")).toBeVisible();
    // And a Preferences link
    await expect(page.getByText("Preferences")).toBeVisible();
  });

  test("maximized portlet Options has Return to dashboard", async ({
    page,
  }) => {
    await page.goto(`${config.url}p/calendar`);

    // Open Options in maximized mode
    await page
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();

    // Should have "Return to dashboard" instead of Maximize
    await expect(
      page.locator(".up-portlet-options-item.dashboard")
    ).toBeVisible();
    await expect(
      page.locator(".up-portlet-options-item.dashboard a")
    ).toContainText("Return to dashboard");
  });
});

test.describe("Portlet edit mode", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("Bookmarks edit mode shows action buttons", async ({ page }) => {
    // Navigate to Bookmarks in maximized + edit mode via Options menu
    await page.goto(`${config.url}p/bookmarks`);

    // Click Edit in Options
    await page.locator(".portlet-options-menu .dropdown-toggle").click();
    await page.locator(".up-portlet-options-item.edit a").click();

    // Wait for edit mode content to load
    await expect(
      page.getByRole("button", { name: "Add Bookmark" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Folder" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Stop editing" })
    ).toBeVisible();
  });

  test("Announcements portlet has My Subscriptions and Archives links", async ({
    page,
  }) => {
    await page.goto(`${config.url}p/announcements`);

    await expect(page.getByText("My Subscriptions")).toBeVisible();
    await expect(page.getByText("Archives")).toBeVisible();
  });
});

test.describe("Portlet direct URL", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("direct URL navigates to portlet in maximized view", async ({
    page,
  }) => {
    // /p/fname is the direct URL pattern
    await page.goto(`${config.url}p/bookmarks`);

    // Should render in maximized mode
    await expect(
      page.locator(".up-portlet-titlebar .portlet-title")
    ).toContainText("Bookmarks");

    // URL should contain the portlet path
    expect(page.url()).toContain("/p/bookmarks");
  });

  test("direct URL for calendar works", async ({ page }) => {
    await page.goto(`${config.url}p/calendar`);

    await expect(
      page.locator(".up-portlet-titlebar .portlet-title")
    ).toContainText("Calendar");
  });

  test("direct URL for courses works", async ({ page }) => {
    await page.goto(`${config.url}p/courses`);

    await expect(
      page.locator(".up-portlet-titlebar .portlet-title")
    ).toContainText("Courses");
    // Course content should be present
    await expect(page.getByText("Design Awareness")).toBeVisible();
  });
});
