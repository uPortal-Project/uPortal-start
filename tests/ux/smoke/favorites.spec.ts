import { test, expect, Page, Locator } from "@playwright/test";
import { config } from "../../general-config";
import { loginViaUrl, logout, openDropdown } from "../utils/ux-general-utils";

async function openCalendarOptionsMenu(page: Page): Promise<Locator> {
  const calendarWrapper = page.locator(
    ".up-portlet-wrapper:has(.portlet-title a[title='Calendar'])"
  );
  const toggle = calendarWrapper
    .locator(".portlet-options-menu .dropdown-toggle")
    .first();
  await openDropdown(toggle);
  return calendarWrapper;
}

/**
 * After toggling Calendar's favorite state via the Options menu, reload
 * the page and assert the favorite link text matches the expected state.
 * The remove/add API call returns 200 before uPortal has invalidated the
 * server-side layout cache, so a reload that fires immediately after
 * the notification can re-render the *previous* state. Reload + reopen
 * + assert is wrapped in a poll so a second pass picks up the cache
 * invalidation if the first one was too early.
 */
async function expectFavoriteLinkText(
  page: Page,
  expected: "Add to my Favorites" | "Remove from my favorites"
): Promise<void> {
  await expect(async () => {
    await page.reload();
    const calendarWrapper = await openCalendarOptionsMenu(page);
    await expect(
      calendarWrapper.locator(".up-portlet-options-item.favorite a")
    ).toContainText(expected, { timeout: 1500 });
  }).toPass({ timeout: 10000 });
}

/**
 * Ensure Calendar is in the expected favorites state before a test runs.
 * Self-clean across sessions: student's persisted layout accumulates
 * favorites over time, so we can't assume any starting state.
 */
async function ensureCalendarFavoriteState(
  page: Page,
  shouldBeFavorite: boolean
): Promise<void> {
  const calendarWrapper = await openCalendarOptionsMenu(page);

  const favLink = calendarWrapper.locator(
    ".up-portlet-options-item.favorite a"
  );
  const linkText = (await favLink.textContent()) ?? "";
  const isFavorite = linkText.includes("Remove");

  if (isFavorite === shouldBeFavorite) {
    await page.keyboard.press("Escape");
    return;
  }

  await favLink.click();
  await expect(page.locator(".modern-notification")).toBeVisible();
  await page.reload();
}

test.describe("Favorites", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("add a portlet to favorites via Options menu", async ({ page }) => {
    await ensureCalendarFavoriteState(page, false);

    const calendarWrapper = await openCalendarOptionsMenu(page);

    const favLink = calendarWrapper.locator(
      ".up-portlet-options-item.favorite a"
    );
    await expect(favLink).toContainText("Add to my Favorites");
    await favLink.click();

    await expect(page.locator(".modern-notification")).toContainText(
      "You have added Calendar as a favorite"
    );

    await expectFavoriteLinkText(page, "Remove from my favorites");

    // Clean up — restore Calendar to NOT-favorite so the next test
    // starts from the same state we found.
    const reopened = await openCalendarOptionsMenu(page);
    await reopened.locator(".up-portlet-options-item.favorite a").click();
    await expect(page.locator(".modern-notification")).toContainText(
      "Removed from Favorites successfully"
    );
  });

  test("remove a portlet from favorites via Options menu", async ({
    page,
  }) => {
    await ensureCalendarFavoriteState(page, true);

    const calendarWrapper = await openCalendarOptionsMenu(page);

    const removeLink = calendarWrapper.locator(
      ".up-portlet-options-item.favorite a"
    );
    await expect(removeLink).toContainText("Remove from my favorites");
    await removeLink.click();

    await expect(page.locator(".modern-notification")).toContainText(
      "Removed from Favorites successfully"
    );

    await expectFavoriteLinkText(page, "Add to my Favorites");
  });

  test("Options menu shows Add to my Favorites link", async ({ page }) => {
    await ensureCalendarFavoriteState(page, false);

    const calendarWrapper = await openCalendarOptionsMenu(page);

    const favOption = calendarWrapper.locator(
      ".up-portlet-options-item.favorite a"
    );
    await expect(favOption).toBeVisible();
    await expect(favOption).toHaveAttribute(
      "title",
      "Add this portlet to my favorites"
    );
  });

  test("every portlet with an options menu has a favorite item", async ({
    page,
  }) => {
    /*
     * Earlier this assertion hard-coded `toHaveCount(3)` against the
     * three portlets in the seeded Welcome layout (Bookmarks, Calendar,
     * My Drives). uPortal persists per-user customizations to the DB,
     * so once a student has favorited additional portlets in the
     * session their layout grows (E! Online, NY Times, Campus News
     * are common). The semantically interesting invariant isn't "3
     * favorites items" — it's "every portlet with an Options menu has
     * a favorite item underneath it". Count those dynamically.
     */
    const wrappersWithMenu = page.locator(
      ".up-portlet-wrapper:has(.portlet-options-menu .dropdown-toggle)"
    );
    const favItems = page.locator(".up-portlet-options-item.favorite");

    const expected = await wrappersWithMenu.count();
    expect(expected).toBeGreaterThanOrEqual(3);
    await expect(favItems).toHaveCount(expected);
  });
});
