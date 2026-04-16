import { test, expect } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const FEEDBACK_URL = `${config.url}p/feedback/max/render.uP`;
const FEEDBACK_ADMIN_URL = `${config.url}p/feedback-admin/max/render.uP`;

test.describe("Feedback Portlet — User View", () => {
  test("renders feedback form", async ({ page }) => {
    await loginViaUrl(page, config.users.student);
    await page.goto(FEEDBACK_URL);

    // The feedback form should have the yes/no/maybe radio buttons
    await expect(page.locator("#yes, input[value='YES']").first()).toBeAttached();
    await expect(page.locator("#no, input[value='NO']").first()).toBeAttached();

    // Should have a feedback text area
    await expect(
      page.locator("textarea[name='feedback'], textarea[id*='feedback']").first()
    ).toBeVisible();

    // Submit button should exist but may be disabled until a radio is selected
    await expect(
      page.locator("button[type='submit'], input[type='submit']").first()
    ).toBeAttached();
  });

  test("selecting a rating enables submit button", async ({ page }) => {
    await loginViaUrl(page, config.users.student);
    await page.goto(FEEDBACK_URL);

    // Click the "yes" radio/label (IDs are portlet-namespaced)
    await page.locator("label[for$='yes']").first().click();

    // Submit button should now be enabled
    const submitBtn = page.locator(
      "button[type='submit']:not([disabled]), input[type='submit']:not([disabled])"
    ).first();
    await expect(submitBtn).toBeVisible();
  });
});

test.describe("Feedback Portlet — Admin View", () => {
  test("renders admin feedback list", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(FEEDBACK_ADMIN_URL);

    // Admin view should show feedback stats and the feedback table
    await expect(page.locator(".feedback-portlet, .feedback-list").first()).toBeVisible();
  });
});
