import { test, expect, APIRequestContext } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const NOTIFICATION_LIST_URL = `${config.url}p/notification-list/max/render.uP`;
const NOTIFICATION_API_URL = `${config.url.replace(
  /\/uPortal\/$/,
  ""
)}/NotificationPortlet/api/v2/notifications`;

/**
 * Demo notifications shipped via DemoNotificationService.locations in
 * etc/portal/notification.properties (loaded at runtime from the
 * NotificationPortlet WAR's classpath: demo/demoNotificationResponse.json
 * and demoNotificationResponse2.json). The titles we assert below come
 * straight from those fixtures, so they're only flaky if someone edits
 * the demo fixtures or disables the demo source.
 */
const EXPECTED_NOTIFICATIONS = [
  "Room Available",
  "Bike License Ticket Was Issued",
  "Past Due Book",
  "Math 101",
];

test.describe("Notification API + portlets", () => {
  /*
   * Regression guard for the JJWT runtime-classpath bug: until
   * NotificationPortlet declared jjwt-impl + jjwt-jackson as
   * runtimeOnly deps, Jwts.parser() failed with UnknownClassException
   * at first call and every /api/v2 request came back 403. The
   * notification-icon and notification-list portlets silently
   * rendered empty as a result. The render tests below catch that
   * regression end-to-end (no notifications would surface in the DOM
   * if the API is broken).
   */
  test("notification-list portlet renders demo entries", async ({ page }) => {
    await loginViaUrl(page, config.users.student);
    await page.goto(NOTIFICATION_LIST_URL);

    // The Vue web component renders the entries' titles in the DOM. We
    // don't care about the exact markup; just that the demo data made
    // it through the API → component → render path.
    for (const title of EXPECTED_NOTIFICATIONS) {
      await expect(page.locator("body")).toContainText(title);
    }
  });

  test("notification-icon web component shows a badge with a count", async ({
    page,
  }) => {
    await loginViaUrl(page, config.users.student);
    await page.goto(`${config.url}f/welcome/normal/render.uP`);

    const icon = page.locator("notification-icon");
    await expect(icon).toBeAttached();

    // The component renders a button with the unread count visible to
    // logged-in users. The count is non-zero whenever the demo source
    // is wired up (which is always, in this test environment).
    const button = icon.locator("button").first();
    await expect(button).toBeVisible();
    await expect(button).toContainText(/\d+/);
  });

  test(
    "API rejects requests with a missing or malformed bearer token",
    async ({ request }: { request: APIRequestContext }) => {
      // No Authorization header at all → 403. This is the negative
      // half of the regression guard: confirms Spring Security is
      // still in front of the API even when the happy path works.
      const noAuth = await request.get(NOTIFICATION_API_URL);
      expect(noAuth.status()).toBe(403);

      // Garbage bearer token → 403 (token unparseable).
      const badAuth = await request.get(NOTIFICATION_API_URL, {
        headers: { Authorization: "Bearer not.a.valid.jwt" },
      });
      expect(badAuth.status()).toBe(403);
    }
  );
});
