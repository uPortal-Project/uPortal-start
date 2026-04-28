import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const BOOKMARKS_URL = `${config.url}p/bookmarks/max/render.uP`;

test.describe("Bookmarks Portlet", () => {
  test("renders bookmark list for logged-in user", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(BOOKMARKS_URL);

    await expect(page.locator(".bookmarksPortlet")).toBeVisible();
  });

  test("edit mode loads with action buttons", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);

    // Navigate to edit mode via portlet mode URL
    const editUrl = `${config.url}p/bookmarks/max/render.uP?pCm=edit`;
    await page.goto(editUrl);

    // Should show Add Bookmark / Add Folder buttons
    await expect(
      page.getByRole("button", { name: /Add Bookmark/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Add Folder/i })
    ).toBeVisible();
  });
});
