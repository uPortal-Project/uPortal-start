import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

// JasigWidgetPortlets deploys several mini-portlets. These are the
// ones with quickstart portlet-definitions that are likely to render
// without external API keys or services.
const DICTIONARY_URL = `${config.url}p/dictionary-portlet/max/render.uP`;
const LINKS_URL = `${config.url}p/uportal-links/max/render.uP`;

test.describe("Jasig Widget Portlets", () => {
  test("dictionary widget renders search form", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(DICTIONARY_URL);

    // Dictionary widget has a word input and a Go button
    await expect(page.locator("input[name='word']")).toBeVisible();
    await expect(
      page.locator("input[type='submit'][value='Go!']")
    ).toBeVisible();
  });

  test("dictionary widget returns definition", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(DICTIONARY_URL);

    // Search for a common word
    await page.fill("input[name='word']", "test");
    await page.locator("input[type='submit'][value='Go!']").click();

    // Should show a definition (or "No definition found")
    await expect(
      page.locator(".defContainer, .defs, #defs, [id$='defs']").first()
    ).toBeAttached({ timeout: 10000 });
  });

  test("links widget renders", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(LINKS_URL);

    // Links widget should render its container
    await expect(page.locator("body")).not.toContainText("HTTP Status 500");
  });

  test("no critical JavaScript errors on dictionary load", async ({
    page,
  }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await loginViaUrl(page, config.users.admin);
    await page.goto(DICTIONARY_URL);
    await page.waitForLoadState("networkidle");

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes("noConflict") && !e.includes("is not defined")
    );
    expect(criticalErrors).toEqual([]);
  });
});
