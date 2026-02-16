import { test, expect } from "@playwright/test";
import { config } from "../../general-config";
import { loginViaUrl, logout } from "../utils/ux-general-utils";

test.describe("Favorites", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("add a portlet to favorites via Options menu", async ({ page }) => {
    const calendarWrapper = page.locator(
      ".up-portlet-wrapper:has(.portlet-title a[title='Calendar'])"
    );

    // Open Options dropdown
    await calendarWrapper
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();

    // Click "Add to my Favorites"
    const favLink = calendarWrapper.locator(
      ".up-portlet-options-item.favorite a"
    );
    await expect(favLink).toContainText("Add to my Favorites");
    await favLink.click();

    // Verify success notification appears
    await expect(page.locator("#up-notification")).toContainText(
      "You have added Calendar as a favorite"
    );

    // Reload and verify the link now says "Remove from my favorites"
    await page.reload();
    await calendarWrapper
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();
    await expect(
      calendarWrapper.locator(".up-portlet-options-item.favorite a")
    ).toContainText("Remove from my favorites");

    // Clean up — remove the favorite
    await calendarWrapper
      .locator(".up-portlet-options-item.favorite a")
      .click();
    await expect(page.locator("#up-notification")).toContainText(
      "Removed from Favorites successfully"
    );
  });

  test("remove a portlet from favorites via Options menu", async ({
    page,
  }) => {
    const calendarWrapper = page.locator(
      ".up-portlet-wrapper:has(.portlet-title a[title='Calendar'])"
    );

    // First add Calendar to favorites
    await calendarWrapper
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();
    await calendarWrapper
      .locator(".up-portlet-options-item.favorite a")
      .click();
    await expect(page.locator("#up-notification")).toContainText(
      "You have added Calendar as a favorite"
    );

    // Reload so the link changes to "Remove"
    await page.reload();
    await calendarWrapper
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();

    // Click "Remove from my favorites"
    const removeLink = calendarWrapper.locator(
      ".up-portlet-options-item.favorite a"
    );
    await expect(removeLink).toContainText("Remove from my favorites");
    await removeLink.click();

    // Verify removal notification
    await expect(page.locator("#up-notification")).toContainText(
      "Removed from Favorites successfully"
    );

    // Reload and verify it switched back to "Add"
    await page.reload();
    await calendarWrapper
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();
    await expect(
      calendarWrapper.locator(".up-portlet-options-item.favorite a")
    ).toContainText("Add to my Favorites");
  });

  test("Options menu shows Add to my Favorites link", async ({ page }) => {
    // Open the Options dropdown on Calendar
    const calendarWrapper = page.locator(
      ".up-portlet-wrapper:has(.portlet-title a[title='Calendar'])"
    );
    await calendarWrapper
      .locator(".portlet-options-menu .dropdown-toggle")
      .click();

    // Verify the favorite option is visible
    const favOption = calendarWrapper.locator(
      ".up-portlet-options-item.favorite a"
    );
    await expect(favOption).toBeVisible();
    await expect(favOption).toHaveAttribute(
      "title",
      "Add this portlet to my favorites"
    );
  });

  test("favorite menu items exist for each portlet", async ({ page }) => {
    // Each portlet on Welcome tab should have a favorite option in its menu
    const favItems = page.locator(
      ".up-portlet-options-item.favorite"
    );
    // At least the 3 portlets on Welcome tab (Bookmarks, Calendar, My Drives)
    await expect(favItems).toHaveCount(3);
  });
});
