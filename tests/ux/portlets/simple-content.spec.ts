import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

// "what-is-uportal" and "logging-in" are SimpleContentPortlet instances
// deployed in the quickstart data
const WHAT_IS_UPORTAL_URL = `${config.url}p/what-is-uportal/max/render.uP`;
const LOGGING_IN_URL = `${config.url}p/logging-in/max/render.uP`;

test.describe("Simple Content Portlet", () => {
  test("renders static content (what-is-uportal)", async ({ page }) => {
    // This portlet instance doesn't require auth — it's on the welcome page
    await page.goto(WHAT_IS_UPORTAL_URL);

    // Should render the content body with portal description text
    await expect(page.locator("body")).toContainText("uPortal");
  });

  test("renders static content (logging-in)", async ({ page }) => {
    await page.goto(LOGGING_IN_URL);

    await expect(page.locator("body")).toContainText(/log/i);
  });

  test("config mode loads CKEditor for admin", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);

    // Config mode uses CKEditor for rich-text editing
    const configUrl = `${config.url}p/what-is-uportal/max/render.uP?pCm=config`;
    await page.goto(configUrl);

    // CKEditor should be present (loaded via resource-server)
    // or at minimum the config form should be visible
    await expect(
      page.locator("textarea, .cke, iframe[class*='cke']").first()
    ).toBeAttached({ timeout: 10000 });
  });
});
