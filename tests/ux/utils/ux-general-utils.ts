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
export async function logoutViaApi(
  request: APIRequestContext
): Promise<void> {
  const url = `${config.url}Logout`;
  const response = await request.get(url);
  expect(response.status()).toEqual(200);
  const responseText = await response.text();
  expect(responseText).toContain("Logout successful");
  // confirm known endpoint is unavailable for guest user
  const responseCheck = await request.get(`${config.url}api/portlet-list/`);
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

  // Confirm uPortal logo
  const uportalLogo = page.locator("h1.portal-logo > a");
  await expect(uportalLogo).toHaveText("uPortal");

  // Confirm user is logged in
  const loggedInUserDisplay = page.locator("div.user-name");
  await expect(loggedInUserDisplay).toHaveText(
    `You are signed in as ${user.displayName}`
  );
}
