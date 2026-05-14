import { test, expect, Page } from "@playwright/test";
import { config } from "../../general-config";
import { loginViaUrl } from "../utils/ux-general-utils";

/*
 * Visual smoke for the resource-server consolidation:
 *   1. Hit each key page.
 *   2. Capture a screenshot.
 *   3. Fail if any /ResourceServingWebapp/ URL is requested (catches stale
 *      legacy paths in HTML/skin output).
 *   4. Fail if any request 4xx/5xxs (catches broken paths).
 *   5. Fail if the page logs a console error.
 *
 * This is intentionally not part of the regular Playwright run — it's
 * designed for one-off verification after changes that move resource
 * paths around. Drop into ux/smoke/ so it runs alongside the other smoke
 * specs when invoked.
 */

interface NetIssue {
  url: string;
  status?: number;
  reason: string;
}

function attachListeners(page: Page): {
  consoleErrors: string[];
  netIssues: NetIssue[];
  legacyHits: string[];
} {
  const consoleErrors: string[] = [];
  const netIssues: NetIssue[] = [];
  const legacyHits: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  page.on("response", (resp) => {
    const url = resp.url();
    const status = resp.status();
    if (url.includes("/ResourceServingWebapp/")) {
      legacyHits.push(url);
    }
    if (status >= 400) {
      // Ignore favicon and tracking pixels that often 404 on dev installs.
      if (/favicon\.ico|google-analytics|gtag/.test(url)) return;
      netIssues.push({ url, status, reason: `HTTP ${status}` });
    }
  });

  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "request failed";
    // ERR_ABORTED is fired when an in-flight request is cancelled by
    // navigation/teardown — not a server issue. Ignore.
    if (reason === "net::ERR_ABORTED") return;
    netIssues.push({ url: request.url(), reason });
  });

  return { consoleErrors, netIssues, legacyHits };
}

async function smokePage(
  page: Page,
  url: string,
  screenshot: string
): Promise<void> {
  const listeners = attachListeners(page);

  await page.goto(url, { waitUntil: "load" });
  // Wait for the portal page body to be present so we know the skin
  // descriptors have been parsed and resource-tag URLs have fired.
  await expect(page.locator("body")).toBeVisible();
  // Allow trailing portlet AJAX to start before snapshotting.
  await page.waitForLoadState("domcontentloaded");

  await page.screenshot({
    path: `test-results/visual-smoke/${screenshot}.png`,
    fullPage: true,
  });

  expect(listeners.legacyHits, `legacy /ResourceServingWebapp/ URLs requested at ${url}`).toEqual([]);
  expect(listeners.netIssues, `network failures at ${url}`).toEqual([]);
  // CKEditor 4.22.1 emits one console error nagging about LTS upgrade on every
  // page where it's instantiated (configLinks.jsp, SimpleContentPortlet config).
  // It's marketing pressure, not a runtime defect — filter it out.
  const realErrors = listeners.consoleErrors.filter(
    (error) => !/CKEditor.*version is not secure/.test(error)
  );
  expect(realErrors, `console errors at ${url}`).toEqual([]);
}

test.describe("Visual resource-server smoke", () => {
  test("guest welcome", async ({ page }) => {
    await smokePage(page, config.url, "guest-welcome");
  });

  test("admin home", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await smokePage(page, config.url, "admin-home");
  });

  test("student home (with portlet thumbnails)", async ({ page }) => {
    await loginViaUrl(page, config.users.student);
    await smokePage(page, config.url, "student-home");
  });

  // SimpleContentPortlet's config page loads CKEditor 4 from the modern
  // webjar path (org.webjars.npm:ckeditor4 4.22.1). If the upgrade broke
  // anything, CKEditor.replace() throws or window.CKEDITOR is undefined.
  test("CKEditor 4 webjar instantiates in SimpleContentPortlet config", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    const listeners = attachListeners(page);
    await page.goto(config.url + "p/please-register/normal/render.uP?pCm=config", {
      waitUntil: "load",
    });
    // CKEditor (~684 KB) async-loads its plugins/skin/lang after the bare
    // ckeditor.js arrives. Wait for the toolbar chrome to appear.
    await expect(page.locator(".cke").first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({
      path: "test-results/visual-smoke/ckeditor-config.png",
      fullPage: true,
    });
    // CKEditor 4.22.1 emits one console error nagging about LTS upgrade
    // (4.23+ are LTS-only requiring a paid license). It's marketing
    // pressure, not a runtime defect — the editor works fine.
    const realErrors = listeners.consoleErrors.filter(
      (error) => !/CKEditor.*version is not secure/.test(error)
    );
    expect(listeners.legacyHits, "legacy /ResourceServingWebapp/ URLs requested").toEqual([]);
    expect(realErrors, "real console errors (excluding CKEditor LTS nag)").toEqual([]);
  });

  // NewsReader exercises the custom mini-template engine added to news.js
  // when Handlebars 3.0.3 was removed. If the renderer is broken, raw
  // {{...}} placeholders leak through OR the JS throws a console error.
  test("news portlet renders without Handlebars", async ({ page }) => {
    await loginViaUrl(page, config.users.student);
    const listeners = attachListeners(page);
    await page.goto(config.url + "p/chronicle-wired/max/render.uP", {
      waitUntil: "load",
    });
    // Allow the news-feeds AJAX to settle.
    await page.waitForTimeout(3000);
    // innerText excludes <script type="text/template"> bodies; textContent would
    // include the template source (which legitimately contains {{var}} syntax)
    // and trigger a false positive in the assertion below.
    // eslint-disable-next-line unicorn/prefer-dom-node-text-content
    const bodyText = await page.locator("body").innerText();
    await page.screenshot({
      path: "test-results/visual-smoke/news-portlet.png",
      fullPage: true,
    });
    expect(bodyText, "raw {{...}} placeholders visible in rendered DOM").not.toMatch(
      /{{[#/]?[A-Za-z]/
    );
    expect(listeners.legacyHits, "legacy /ResourceServingWebapp/ URLs requested").toEqual([]);
    expect(listeners.consoleErrors, "console errors").toEqual([]);
  });

  // configLinks.jsp (uportal-links portlet config view) used to load
  // /ResourceServingWebapp/rs/lodash/4.17.4/lodash.min.js and rs/template
  // via the legacy context. JasigWidgetPortlets 2.4.3-SNAPSHOT drops lodash
  // and switches the template tag to /resource-server/. The page only
  // renders for admins.
  test("uportal-links config loads no /ResourceServingWebapp/ resources", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await smokePage(
      page,
      config.url + "p/uportal-links/max/render.uP?pCm=config",
      "uportal-links-config"
    );
  });
});
