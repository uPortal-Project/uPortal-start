import { test, expect, Page } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

interface CKEditorInstance {
  getData(): string;
  setData(html: string, callback?: () => void): void;
  updateElement(): void;
  destroy(updateElement: boolean): void;
  element: { $: HTMLTextAreaElement };
}

interface CKEditorGlobal {
  instances: Record<string, CKEditorInstance>;
}

declare global {
  interface Window {
    CKEDITOR?: CKEditorGlobal;
  }
}

// "what-is-uportal" and "logging-in" are SimpleContentPortlet instances
// deployed in the quickstart data. The same `cms` portlet hosts every
// web-component snippet in the portal (notification-list, customize,
// favorites-carousel, waffle-menu, etc.), so round-tripping content
// through this portlet exercises the foundation those components ride on.
const WHAT_IS_UPORTAL_URL = `${config.url}p/what-is-uportal/max/render.uP`;
const LOGGING_IN_URL = `${config.url}p/logging-in/max/render.uP`;
const WHAT_IS_UPORTAL_CONFIG_URL = `${WHAT_IS_UPORTAL_URL}?pCm=config`;
const LOGGING_IN_CONFIG_URL = `${LOGGING_IN_URL}?pCm=config`;

/**
 * Wait for CKEditor to mount and return the id of the (first) instance.
 * Config mode initializes CKEDITOR.replace() asynchronously after DOMReady.
 */
async function waitForCkeditor(page: Page): Promise<string> {
  await page.waitForFunction(() => {
    const ck = window.CKEDITOR;
    return !!ck && Object.keys(ck.instances ?? {}).length > 0;
  });
  return page.evaluate(() => {
    const ck = window.CKEDITOR;
    if (!ck) throw new Error("CKEDITOR global missing");
    return Object.keys(ck.instances)[0];
  });
}

async function getCkeditorContent(page: Page): Promise<string> {
  return page.evaluate(() => {
    const ck = window.CKEDITOR;
    if (!ck) throw new Error("CKEDITOR global missing");
    const id = Object.keys(ck.instances)[0];
    return ck.instances[id].getData();
  });
}

/**
 * Save new content by destroying CKEditor, overwriting the underlying
 * <textarea> directly, and submitting the form.
 *
 * Why not setData()? CKEditor 4's setData is asynchronous and races with
 * its own dataReady → updateElement bookkeeping. Even with the callback
 * form, the editor's submit-time hook can re-sync from a stale internal
 * model and silently send the old content to the server. Tearing down
 * the editor before we touch the textarea removes every CKEditor
 * surface that could re-sync, so the form posts exactly what we set.
 */
async function saveContent(page: Page, html: string): Promise<void> {
  await Promise.all([
    page.waitForURL(/pCm=view/),
    page.evaluate((newContent) => {
      const ck = window.CKEDITOR;
      if (!ck) throw new Error("CKEDITOR global missing");
      const id = Object.keys(ck.instances)[0];
      ck.instances[id].destroy(true);

      const textarea = document.querySelector<HTMLTextAreaElement>(
        "textarea[id$='content']"
      );
      if (!textarea) throw new Error("content textarea not found");
      textarea.value = newContent;

      const form = textarea.form;
      if (!form) throw new Error("content textarea has no form");
      form.submit();
    }, html),
  ]);
  // Wait for the post-action render to settle by checking the URL
  // landed in view mode (the controller calls setPortletMode(VIEW)).
  await page.waitForURL(/render\.uP/);
}

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
    await page.goto(WHAT_IS_UPORTAL_CONFIG_URL);

    // CKEditor should mount on the textarea
    await expect(
      page.locator("textarea, .cke, iframe[class*='cke']").first()
    ).toBeAttached({ timeout: 10_000 });
  });

  test("admin can save edited content via the CKEditor Save button", async ({
    page,
  }) => {
    const stamp = Date.now();
    const marker = `Playwright save round-trip ${stamp}`;
    const newContent = `<p>${marker}</p>`;

    await loginViaUrl(page, config.users.admin);

    // --- Capture the existing content so we can restore it ---
    await page.goto(WHAT_IS_UPORTAL_CONFIG_URL);
    await waitForCkeditor(page);
    const originalContent = await getCkeditorContent(page);

    // --- Replace content and save ---
    await saveContent(page, newContent);

    // After save the controller switches the portlet back to VIEW mode
    // and re-renders on the same response, so the new content should be
    // visible right here.
    await expect(page.locator("body")).toContainText(marker);

    // --- Restore the original content ---
    await page.goto(WHAT_IS_UPORTAL_CONFIG_URL);
    await waitForCkeditor(page);
    await saveContent(page, originalContent);

    await expect(page.locator("body")).not.toContainText(marker);
  });

  test("cancel discards unsaved changes", async ({ page }) => {
    const stamp = Date.now();
    const marker = `Playwright cancel-discard ${stamp}`;

    await loginViaUrl(page, config.users.admin);
    await page.goto(LOGGING_IN_CONFIG_URL);
    await waitForCkeditor(page);

    // Stage a change in the editor (no need to commit it perfectly —
    // we're testing that cancel discards whatever is staged). Fire-
    // and-forget setData; we only need *something* in there before we
    // click cancel, and the visible textarea state is enough.
    await page.evaluate((newContent) => {
      const ck = window.CKEDITOR;
      if (!ck) throw new Error("CKEDITOR global missing");
      const id = Object.keys(ck.instances)[0];
      ck.instances[id].setData(newContent);
    }, `<p>${marker}</p>`);

    // The cancel form has its own submit button labeled "Return without saving"
    await page.locator("form#command button[name='cancel']").click();

    // Re-fetch the view URL and confirm the marker never landed
    await page.goto(LOGGING_IN_URL);
    await expect(page.locator("body")).not.toContainText(marker);
  });
});
