import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const NEWS_URL = `${config.url}p/campus-news/max/render.uP`;
const CHRONICLE_URL = `${config.url}p/chronicle-wired/max/render.uP`;
// `news-fav-collection` is a favorites-collection fragment that the
// quickstart seeds with both campus-news and chronicle-wired side by
// side. It's the only place where two NewsReader instances render on
// the same page in normal (non-maxed) mode.
const NEWS_FAV_COLLECTION_URL = `${config.url}f/news-fav-collection/normal/render.uP`;

/**
 * The quickstart deploys 13 NewsReaderPortlet instances (campus-news,
 * chronicle-wired, ny-times, ny-times-education, motley-fool, e-online,
 * salon, sports-illustrated, about-college-life, movie-news, phd-comics,
 * word-of-the-day, xkcd). They all hit external RSS endpoints, so feed
 * *content* is unstable for testing — but the structural surface
 * (instance container, tab/feed selector, graceful "currently
 * unavailable" message when a feed is offline) is stable and is what
 * we lean on here.
 */
test.describe("News Reader Portlet", () => {
  test("campus-news renders feed selector with expected feed names", async ({
    page,
  }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(NEWS_URL);

    const portlet = page.locator(".newsreader-container").first();
    await expect(portlet).toBeVisible();

    // The campus-news instance is configured with two feeds. The labels
    // are emitted into the feed-selector container regardless of whether
    // the feeds themselves resolve.
    const feedSelector = portlet.locator(".news-feeds-container");
    await expect(feedSelector).toContainText("Apereo News");
    await expect(feedSelector).toContainText("Unicon News");
  });

  test("chronicle-wired renders independently as a second instance", async ({
    page,
  }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(CHRONICLE_URL);

    // The max URL lands at `/f/news-fav-collection/p/chronicle-wired/max`
    // which renders the parent fragment with this portlet maxed.
    // Other NewsReader containers in the fragment are still in the DOM
    // (hidden), so we have to scope to the one whose feed selector
    // mentions the Chronicle feed.
    const chroniclePortlet = page
      .locator(".newsreader-container")
      .filter({ hasText: "The Chronicle: Wired Campus" });
    await expect(chroniclePortlet).toBeVisible();
  });

  test("offline feeds degrade gracefully with the 'currently unavailable' message", async ({
    page,
  }) => {
    // The test environment has no public-internet RSS access, so every
    // RomeAdapter call fails. The portlet must surface that as a
    // user-readable message rather than a stack trace or a blank panel.
    await loginViaUrl(page, config.users.admin);
    await page.goto(NEWS_URL);

    const portlet = page.locator(".newsreader-container").first();
    await expect(portlet).toContainText(/currently unavailable/i);
    // Hard-fail if the failure leaks Java exception text instead of the
    // graceful message.
    await expect(portlet).not.toContainText("Exception");
    await expect(portlet).not.toContainText("HTTP Status 500");
  });

  test("multiple News instances coexist on the news favorites collection", async ({
    page,
  }) => {
    // The seeded news-fav-collection fragment puts campus-news and
    // chronicle-wired side by side. A regression in the per-instance
    // namespace plumbing (e.g. a JS callback bound to a global
    // selector instead of one scoped by ${n}) would normally surface
    // here as one instance erasing or freezing the other.
    await loginViaUrl(page, config.users.admin);
    await page.goto(NEWS_FAV_COLLECTION_URL);

    const containers = page.locator(".newsreader-container");
    await expect(containers).toHaveCount(2);
    await expect(containers.nth(0)).toBeVisible();
    await expect(containers.nth(1)).toBeVisible();
  });

  test("edit mode shows feed preferences", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);

    const editUrl = `${config.url}p/campus-news/max/render.uP?pCm=edit`;
    await page.goto(editUrl);

    // Edit mode should show feed management options
    await expect(
      page
        .locator("select, .news-feeds-container, input[type='checkbox']")
        .first()
    ).toBeAttached();
  });
});
