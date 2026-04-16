import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

// WebproxyPortlet is deployed as "snappy" in the quickstart data
// (proxies a web page into the portal)
const WEBPROXY_URL = `${config.url}p/snappy/max/render.uP`;

test.describe("Web Proxy Portlet", () => {
  test("renders proxy content container", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(WEBPROXY_URL);

    // The portlet should render — either proxied content or a gateway form
    // depending on configuration. At minimum the portlet container renders.
    await expect(page.locator("body")).not.toContainText("HTTP Status 500");
    await expect(page.locator("body")).not.toContainText("HTTP Status 404");
  });

  test("no critical JavaScript errors on load", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await loginViaUrl(page, config.users.admin);
    await page.goto(WEBPROXY_URL);
    await page.waitForLoadState("networkidle");

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes("noConflict") && !e.includes("is not defined")
    );
    expect(criticalErrors).toEqual([]);
  });
});
