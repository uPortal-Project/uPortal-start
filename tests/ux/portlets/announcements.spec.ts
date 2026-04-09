import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const ANNOUNCEMENTS_URL = `${config.url}p/announcements/max/render.uP`;
const ANNOUNCEMENTS_ADMIN_URL = `${config.url}p/announcementsAdmin/max/render.uP`;

test.describe("Announcements Display Portlet", () => {
  test("renders display portlet container", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(ANNOUNCEMENTS_URL);

    const container = page.locator(".announcements-container");
    await expect(container).toBeVisible();

    await expect(page.getByText("My Subscriptions")).toBeVisible();
    await expect(page.getByText("Archives")).toBeVisible();
  });
});

test.describe("Announcements Admin Portlet", () => {
  test("renders admin view with topics", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(ANNOUNCEMENTS_ADMIN_URL);

    const container = page.locator(".announcements-container");
    await expect(container).toBeVisible();

    await expect(page.getByRole("link", { name: "Campus Services" })).toBeVisible();
  });

  test("navigate to topic and view announcements", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(ANNOUNCEMENTS_ADMIN_URL);

    await page.getByRole("link", { name: "Campus Services" }).click();

    await expect(
      page.locator("a[href*='addAnnouncement']").first()
    ).toBeVisible();
  });

  test("add announcement form loads with TinyMCE", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(ANNOUNCEMENTS_ADMIN_URL);

    await page.getByRole("link", { name: "Campus Services" }).click();
    await page.locator("a[href*='addAnnouncement']").first().click();

    await expect(page.locator("input#title")).toBeVisible();
    await expect(page.locator("textarea[name='abstractText']")).toBeVisible();
    await expect(page.locator("input[name='startDisplay']")).toBeVisible();
    await expect(page.locator("input[name='endDisplay']")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Announcement" })
    ).toBeVisible();

    // TinyMCE editor should have initialized
    await page.waitForTimeout(2000);
    const mceState = await page.evaluate(() => {
      const t = (window as any).tinymce || (window as any).tinyMCE;
      return { editors: t?.editors?.length || 0 };
    });
    expect(mceState.editors).toBeGreaterThan(0);
  });

  test("create, verify, and delete announcement", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(ANNOUNCEMENTS_ADMIN_URL);

    await page.getByRole("link", { name: "Campus Services" }).click();
    await page.locator("a[href*='addAnnouncement']").first().click();

    // Fill in the form
    const title = `PW Test ${Date.now()}`;
    await page.fill("input#title", title);
    await page.fill("textarea[name='abstractText']", "Playwright test abstract");

    // Wait for TinyMCE to init, then set content via API
    await page.waitForFunction(
      () => !!(window as any).tinymce?.activeEditor,
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      (window as any).tinymce.activeEditor.setContent(
        "<p>Playwright test message body</p>"
      );
    });

    // Set dates
    const today = new Date();
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    // jQuery UI datepicker format is 'yy-mm-dd' which means YYYY-MM-DD
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    await page.fill("input[name='startDisplay']", formatDate(today));
    await page.fill("input[name='endDisplay']", formatDate(endDate));

    // Submit
    await page.getByRole("button", { name: "Save Announcement" }).click();

    // Verify announcement appears in topic view
    await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });

    // Delete it — delete is a form submit with a confirm dialog
    page.once("dialog", (dialog) => dialog.accept());
    const row = page.locator("tr", { hasText: title });
    await row.locator("button[type='submit']").click();

    // Verify it's gone
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(title)).not.toBeVisible({ timeout: 10000 });
  });
});
