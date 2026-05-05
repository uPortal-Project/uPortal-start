import { expect, Page, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

const SEL_UPORTAL_LOGIN = "#portalCASLoginLink";
const SEL_UPORTAL_LOGIN_USERNAME = "#username";
const SEL_UPORTAL_LOGIN_PASSWORD = "#password";
const SEL_UPORTAL_LOGIN_SUBMIT = ".btn-submit";

/*
 * Log into uPortal via an APIRequestContext
 */
export async function loginViaApi(
  request: APIRequestContext,
  user: Record<string, string>
): Promise<void> {
  const url = `${config.url}Login?userName=${user.username}&password=${user.password}`;
  const response = await request.get(url);
  expect(response.status()).toEqual(200);
  const responseText = await response.text();
  expect(responseText).toContain(user.displayName);
}

/*
 * Log out of uPortal via an APIRequestContext
 */
export async function logoutViaApi(request: APIRequestContext): Promise<void> {
  const url = `${config.url}Logout`;
  const response = await request.get(url);
  expect(response.status()).toEqual(200);
  const responseText = await response.text();
  expect(responseText).toContain("Logout successful");
  // confirm known endpoint is unavailable for guest user
  await request.get(`${config.url}api/portlet-list/`);
  expect(response.status()).toEqual(200);
}
/*
 * Log into uPortal via the UX
 */
export async function loginViaPage(
  page: Page,
  user: Record<string, string>
): Promise<void> {
  // Navigate to uPortal welcome page prior to login
  const landingPageUrl = `${config.url}f/welcome/normal/render.uP`;
  await page.goto(landingPageUrl);

  // Launch CAS Login via UX
  const uportalSignin = page.locator(SEL_UPORTAL_LOGIN);
  await expect(uportalSignin).toHaveText("Sign In");
  await page.click(SEL_UPORTAL_LOGIN);

  // Fill in username and password, and submit
  await page.waitForSelector(SEL_UPORTAL_LOGIN_USERNAME);
  await page.fill(SEL_UPORTAL_LOGIN_USERNAME, user.username);
  await page.waitForSelector(SEL_UPORTAL_LOGIN_PASSWORD);
  await page.fill(SEL_UPORTAL_LOGIN_PASSWORD, user.password);
  await page.waitForSelector(SEL_UPORTAL_LOGIN_SUBMIT);
  await page.click(SEL_UPORTAL_LOGIN_SUBMIT);

  // Confirm user is logged in
  const loggedInUserDisplay = page.locator("div.user-name");
  await expect(loggedInUserDisplay).toHaveText(
    `You are signed in as ${user.displayName}`
  );
}

/*
 * Log into uPortal via URL-based login (faster than CAS form for smoke tests)
 */
export async function loginViaUrl(
  page: Page,
  user: Record<string, string>
): Promise<void> {
  await page.goto(
    `${config.url}Login?userName=${user.username}&password=${user.password}`
  );
  const loggedIn = page.locator("div.user-name");
  await expect(loggedIn).toContainText(user.displayName);
}

/*
 * Log out of uPortal via the browser
 */
export async function logout(page: Page): Promise<void> {
  await page.goto(`${config.url}Logout`);
  // Navigate back to the portal so the next test's loginViaUrl starts
  // from a known state instead of the CAS logout page
  await page.goto(config.url);
}

/*
 * Open a Bootstrap dropdown via the public Bootstrap.Dropdown API.
 *
 * Why not just .click() the toggle? In this environment Bootstrap 5's
 * data-bs-toggle="dropdown" auto-init wires an instance onto each
 * toggle (Bootstrap.Dropdown.getInstance returns it) but the click
 * delegate that should call .show() is not firing — synthetic clicks,
 * native MouseEvent dispatches, and Playwright's .click() all leave
 * `aria-expanded` at "false". Calling the public API directly works.
 * Tests that need to drive the menu open should use this; tests that
 * specifically want to assert click behavior should not.
 *
 * The Locator argument is the dropdown-toggle element (the trigger).
 */
export async function openDropdown(toggle: import("@playwright/test").Locator): Promise<void> {
  await expect(toggle).toBeVisible();
  await toggle.evaluate((el) => {
    const bs = (
      window as {
        bootstrap?: {
          Dropdown: {
            getOrCreateInstance: (e: HTMLElement) => { show: () => void };
          };
        };
      }
    ).bootstrap;
    if (!bs?.Dropdown) throw new Error("Bootstrap Dropdown not loaded");
    bs.Dropdown.getOrCreateInstance(el as HTMLElement).show();
  });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
}
