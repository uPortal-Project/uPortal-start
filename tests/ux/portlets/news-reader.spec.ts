import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const NEWS_URL = `${config.url}p/campus-news/max/render.uP`;

test.describe("News Reader Portlet", () => {
  test("renders news container with feed tabs or selector", async ({
    page,
  }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(NEWS_URL);

    // News reader container
    await expect(
      page.locator(".org-jasig-portlet-newsreader, .newsreader-container").first()
    ).toBeVisible();

    // Should have either tabs (wide view) or a select dropdown (narrow view)
    // for switching between feeds
    const tabs = page.locator(".news-feeds-container");
    await expect(tabs.first()).toBeAttached();
  });

  test("news stories area is present", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(NEWS_URL);

    // The news stories container should exist (may be empty if feeds fail)
    await expect(
      page.locator(".news-stories-container, .view-news").first()
    ).toBeAttached();
  });

  test("edit mode shows feed preferences", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);

    const editUrl = `${config.url}p/campus-news/max/render.uP?pCm=edit`;
    await page.goto(editUrl);

    // Edit mode should show feed management options
    await expect(
      page.locator("select, .news-feeds-container, input[type='checkbox']").first()
    ).toBeAttached();
  });
});
