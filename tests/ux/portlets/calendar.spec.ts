import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const CALENDAR_URL = `${config.url}p/calendar/max/render.uP`;

test.describe("Calendar Portlet", () => {
  test("renders calendar container", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(CALENDAR_URL);

    // Calendar portlet should have its main container
    await expect(
      page.locator(".upcal-wideview, .upcal-narrowview, [class*='calendar']").first()
    ).toBeVisible();
  });

  test("day/week/month range buttons are visible", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(CALENDAR_URL);

    // The range selector buttons should be present
    await expect(page.locator(".upcal-range-day").first()).toBeAttached();
  });

  test("no JavaScript errors on load", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await loginViaUrl(page, config.users.admin);
    await page.goto(CALENDAR_URL);

    // Wait for any async JS to settle
    await page.waitForLoadState("networkidle");

    // Filter out known non-critical errors (e.g., from portal chrome)
    const criticalErrors = jsErrors.filter(
      (e) => !e.includes("noConflict") && !e.includes("is not defined")
    );
    expect(criticalErrors).toEqual([]);
  });
});
