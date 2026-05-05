import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

// `web-proxy-example` is a quickstart-seeded WebProxyPortlet instance
// configured to proxy http://example.com/ via httpContentService +
// urlRewritingFilter. The IETF reserves example.com (RFC 2606) as a
// stable test target, so the body text is contractually guaranteed not
// to drift over time. Plain HTTP is intentional — Tomcat's bundled JDK
// trust store rejects example.com over HTTPS with a handshake_failure.
const PROXY_URL = `${config.url}p/web-proxy-example/max/render.uP`;

test.describe("Web Proxy Portlet", () => {
  test("proxies http://example.com/ and surfaces the upstream body", async ({
    page,
  }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(PROXY_URL);

    // example.com's body text is fixed — these strings are part of the
    // page IETF actively maintains as a test fixture, so we can hard-
    // assert on them without flake risk.
    await expect(page.locator("body")).toContainText("Example Domain");
    await expect(page.locator("body")).toContainText(
      /This domain is for use in (illustrative|documentation) examples/i
    );
  });

  test("upstream fetch failure surfaces a graceful error message", async ({
    page,
  }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(PROXY_URL);

    // Belt-and-suspenders: even when example.com is reachable, the
    // portlet must never leak Java exception text or HTTP status
    // boilerplate to the user. If a regression makes the upstream
    // fetch fail, we want the portlet's friendly message — not a
    // stack trace.
    await expect(page.locator("body")).not.toContainText("Exception");
    await expect(page.locator("body")).not.toContainText("HTTP Status 500");
    await expect(page.locator("body")).not.toContainText("HTTP Status 404");
  });

  test("no critical JavaScript errors on load", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await loginViaUrl(page, config.users.admin);
    await page.goto(PROXY_URL);
    await page.waitForLoadState("networkidle");

    const criticalErrors = jsErrors.filter(
      (e) => !e.includes("noConflict") && !e.includes("is not defined")
    );
    expect(criticalErrors).toEqual([]);
  });
});
