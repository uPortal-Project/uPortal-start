import { test, expect } from "@playwright/test";
import { config } from "../../general-config";

/*
 * Regression test for uPortal PR #2982 (https://github.com/uPortal-Project/uPortal/pull/2982).
 *
 * Pre-fix, common.less imported "../../../../webjars/bootstrap/less/bootstrap.less",
 * a path that no longer exists in the Bootstrap 5 webjar. Any custom skin
 * scaffolded via `./gradlew skinGenerate` therefore failed to compile,
 * producing no CSS file (or an empty one) under
 * /uPortal/media/skins/respondr/{skin}.css.
 *
 * The :overlays:uPortal:playwrightSkinFixture gradle task regenerates the
 * playwrightSkin scaffold from etc/skin/ on every playwrightRun, and
 * tomcatDeploy compiles its LESS into the deployed webapp. If common.less
 * regresses to a broken import path, this test fails before any browser
 * navigation happens.
 */
test("scaffolded custom skin compiles and is served", async ({ request }) => {
  const response = await request.get(
    `${config.url}media/skins/respondr/playwrightSkin.css`
  );
  expect(response.status(), "playwrightSkin.css must be served").toEqual(200);

  const body = await response.text();
  expect(body.length, "compiled CSS should not be empty").toBeGreaterThan(500);

  expect(
    body,
    "compiled CSS should reflect the common.less Bootstrap import (inlined selectors or pass-through @import)"
  ).toMatch(/--bs-|\.btn|@import\s+(?:url\()?["'][^"')]*bootstrap/);
});
