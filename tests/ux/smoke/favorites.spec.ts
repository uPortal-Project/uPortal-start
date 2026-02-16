import { test, expect, Page } from "@playwright/test";
import { config } from "../../general-config";
import { loginViaUrl, logout } from "../utils/ux-general-utils";

/**
 * Get the portletId for a given portlet title on the current page.
 * The ID is embedded in inline scripts inside `.up-portlet-options-item.favorite`.
 */
async function getPortletId(
  page: Page,
  portletTitle: string
): Promise<string> {
  return page.evaluate((title) => {
    const wrappers = document.querySelectorAll(".up-portlet-wrapper");
    for (const wrapper of wrappers) {
      const link = wrapper.querySelector(".portlet-title a");
      if (link && link.getAttribute("title") === title) {
        const script = wrapper.querySelector(
          ".up-portlet-options-item.favorite script"
        );
        if (script) {
          const match = script.textContent!.match(
            /portletId\s*:\s*'(\d+)'/
          );
          if (match) return match[1];
        }
      }
    }
    throw new Error(`Portlet "${title}" not found on page`);
  }, portletTitle);
}

test.describe("Favorites", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUrl(page, config.users.student);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test("add a portlet to favorites via API", async ({ page }) => {
    const portletId = await getPortletId(page, "Calendar");

    // Add to favorites
    const addResponse = await page.evaluate(async (id) => {
      const res = await fetch(
        `/uPortal/api/layout?action=addFavorite&channelId=${id}`,
        { method: "POST", credentials: "same-origin" }
      );
      if (!res.ok) throw new Error(`addFavorite failed: ${res.status}`);
      return res.json();
    }, portletId);

    expect(addResponse.response).toContain("Calendar");
    expect(addResponse.response).toContain("favorite");

    // Verify via portlet registry API
    const favorites = await page.evaluate(async () => {
      const res = await fetch(
        "/uPortal/api/v4-3/dlm/portletRegistry.json?favorites=true",
        { credentials: "same-origin" }
      );
      if (!res.ok) throw new Error(`portletRegistry failed: ${res.status}`);
      const data = await res.json();
      return collectFavorites(data.registry);

      function collectFavorites(obj: any): string[] {
        const favs: string[] = [];
        (function walk(node: any) {
          if (node.portlets) {
            for (const p of node.portlets) {
              if (p.favorite) favs.push(p.title);
            }
          }
          if (node.subcategories) for (const s of node.subcategories) walk(s);
          if (node.categories) for (const c of node.categories) walk(c);
        })(obj);
        return favs;
      }
    });

    expect(favorites).toContain("Calendar");

    // Clean up — remove the favorite
    const removeResponse = await page.evaluate(async (id) => {
      const res = await fetch(
        `/uPortal/api/layout?action=removeFavorite&channelId=${id}`,
        { method: "POST", credentials: "same-origin" }
      );
      if (!res.ok) throw new Error(`removeFavorite failed: ${res.status}`);
      return res.json();
    }, portletId);

    expect(removeResponse.response).toContain("Removed");
  });

  test("remove a portlet from favorites via API", async ({ page }) => {
    const portletId = await getPortletId(page, "Bookmarks");

    // First add it and verify
    const addResponse = await page.evaluate(async (id) => {
      const res = await fetch(
        `/uPortal/api/layout?action=addFavorite&channelId=${id}`,
        { method: "POST", credentials: "same-origin" }
      );
      if (!res.ok) throw new Error(`addFavorite failed: ${res.status}`);
      return res.json();
    }, portletId);

    expect(addResponse.response).toContain("Bookmarks");

    // Then remove it
    const removeResponse = await page.evaluate(async (id) => {
      const res = await fetch(
        `/uPortal/api/layout?action=removeFavorite&channelId=${id}`,
        { method: "POST", credentials: "same-origin" }
      );
      if (!res.ok) throw new Error(`removeFavorite failed: ${res.status}`);
      return res.json();
    }, portletId);

    expect(removeResponse.response).toContain("Removed");

    // Verify it's gone
    const favorites = await page.evaluate(async () => {
      const res = await fetch(
        "/uPortal/api/v4-3/dlm/portletRegistry.json?favorites=true",
        { credentials: "same-origin" }
      );
      if (!res.ok) throw new Error(`portletRegistry failed: ${res.status}`);
      const data = await res.json();
      return collectFavorites(data.registry);

      function collectFavorites(obj: any): string[] {
        const favs: string[] = [];
        (function walk(node: any) {
          if (node.portlets) {
            for (const p of node.portlets) {
              if (p.favorite) favs.push(p.title);
            }
          }
          if (node.subcategories) for (const s of node.subcategories) walk(s);
          if (node.categories) for (const c of node.categories) walk(c);
        })(obj);
        return favs;
      }
    });

    expect(favorites).not.toContain("Bookmarks");
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
