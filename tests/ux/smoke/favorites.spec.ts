import { test, expect, Page } from "@playwright/test";
import { config } from "../../general-config";
import { loginViaUrl, logout } from "../utils/ux-general-utils";

/**
 * Ensure Calendar is in the expected favorites state before a test runs.
 * Opens the Options menu, checks the current favorite link text, and toggles
 * if it doesn't match the desired state.
 */
async function ensureCalendarFavoriteState(
  page: Page,
  shouldBeFavorite: boolean
): Promise<void> {
  const calendarWrapper = page.locator(
    ".up-portlet-wrapper:has(.portlet-title a[title='Calendar'])"
  );
  await calendarWrapper
    .locator(".portlet-options-menu .dropdown-toggle")
    .click();

  const favLink = calendarWrapper.locator(
    ".up-portlet-options-item.favorite a"
  );
  const linkText = await favLink.textContent();
  const isFavorite = linkText?.includes("Remove") ?? false;

  if (isFavorite === shouldBeFavorite) {
    // Close the dropdown without changing state
    await page.keyboard.press("Escape");
  } else {
    await favLink.click();
    // Wait for the notification confirming the toggle before reloading
    await expect(page.locator("#up-notification")).toBeVisible();
    await page.reload();
  }
}

test.describe("Favorites", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("add a portlet to favorites via Options menu", async ({ page }) => {
    // Ensure Calendar is NOT a favorite before we start
    await ensureCalendarFavoriteState(page, false);

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
    // Ensure Calendar IS a favorite before we start
    await ensureCalendarFavoriteState(page, true);

    const calendarWrapper = page.locator(
      ".up-portlet-wrapper:has(.portlet-title a[title='Calendar'])"
    );

    // Open Options dropdown
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
    // Ensure Calendar is NOT a favorite
    await ensureCalendarFavoriteState(page, false);

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
