import { expect, Page, APIRequestContext, Locator } from "@playwright/test";
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
 * Force-unhide the .portlet-options-menu wrappers on the current page.
 *
 * The XSL renders these with class="hidden" and a jQuery document.ready
 * handler removes the class on portlets that have menu items. In headless
 * Playwright runs the timing is variable enough that the click target may
 * still be hidden when a test interacts with it. Real users hit it because
 * jQuery does eventually run; smoke tests need a deterministic unhide.
 *
 * Call after every page.goto(...) / page.reload() that lands on a view with
 * portlet options to interact with.
 */
export async function unhidePortletOptionsMenus(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const element of document.querySelectorAll(
      ".portlet-options-menu.hidden"
    )) {
      element.classList.remove("hidden");
    }
  });
}

/*
 * Open the BS5 dropdown for a portlet's Options menu via the Bootstrap API.
 *
 * Why not just call .click() on the .dropdown-toggle?  In headless Chromium
 * the event sequence Playwright dispatches doesn't always trigger Bootstrap
 * 5's dropdown handler that's bound at document load.  Calling
 * `bootstrap.Dropdown(toggle).show()` is what the click handler does anyway
 * and is reliable across browsers and timing.  Real users still get their
 * dropdowns through the click path.
 *
 * Also unhides the parent .portlet-options-menu in case
 * unhidePortletOptionsMenus hasn't been called for this page state yet.
 */
export async function openPortletOptions(wrapper: Locator): Promise<void> {
  await wrapper.evaluate((wrapperElement) => {
    interface BootstrapDropdownInstance {
      show(): void;
    }
    type WithBootstrap = typeof window & {
      bootstrap?: {
        Dropdown?: new (element: Element) => BootstrapDropdownInstance;
      };
    };
    const optionsMenu = wrapperElement.querySelector(".portlet-options-menu");
    if (!optionsMenu) return;
    optionsMenu.classList.remove("hidden");
    const toggle = optionsMenu.querySelector(".dropdown-toggle");
    const Dropdown = (window as WithBootstrap).bootstrap?.Dropdown;
    if (toggle && Dropdown) {
      new Dropdown(toggle).show();
    }
  });
}
