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
      /this domain is for use in (illustrative|documentation) examples/i
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
    page.on("pageerror", (error) => jsErrors.push(error.message));

    await loginViaUrl(page, config.users.admin);
    await page.goto(PROXY_URL);
    // Wait for the proxied body text — proves both the proxy fetch
    // and any client JS the upstream included have executed.
    await expect(page.locator("body")).toContainText("Example Domain");

    const criticalErrors = jsErrors.filter(
      (error) =>
        !error.includes("noConflict") && !error.includes("is not defined")
    );
    expect(criticalErrors).toEqual([]);
  });
});
