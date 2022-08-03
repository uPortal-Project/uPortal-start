import { expect, Page, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

const SEL_UPORTAL_LOGIN = '#portalCASLoginLink';
const SEL_UPORTAL_LOGIN_USERNAME = '#username';
const SEL_UPORTAL_LOGIN_PASSWORD = '#password';
const SEL_UPORTAL_LOGIN_SUBMIT = '.btn-submit';

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
 * Log into uPortal
 */
export async function login_via_api(
  request: APIRequestContext,
  username: string,
  password: string,
  displayname: string,
): Promise<void> {
  const url = `${config.url}Login?userName=${username}&password=${password}`;

  // uPortal in CI consistently does not log the user in. The data is there,
  //   so this loop gives a bit of cushion for uPortal to respond.
  // Future TODO - make the /Login endpoint more effective.
  let responseText = "";
  for(let i = 0 ; i < 20 ; i++ ) {
    const response = await request.get(url);
    expect(response.status()).toEqual(200);
    responseText = await response.text();
    if(responseText.includes(displayname)) {
      console.log("login_via_api for user %s - on the [%s]th try, SUCCEEDED to log in!", username, i);
      i = 20;
    } else {
      console.log("login_via_api for user %s - on the [%s]th try, FAILED to log in. Sleeping for 500 ms", username, i);
      await sleep(500);
    }
  }
  expect(responseText).toContain(displayname);
}

export async function login_via_page(
  page: Page,
  username: string,
  password: string,
  displayname: string,
): Promise<void> {
  //const url = `${config.url}Login?userName=${username}&password=${password}`;
  const landingPageUrl = `${config.url}f/welcome/normal/render.uP`;
  await page.goto(landingPageUrl);

  // Launch CAS Login via UX
  const uportalSignin = page.locator(SEL_UPORTAL_LOGIN);
  await expect(uportalSignin).toHaveText('Sign In');
  await page.click(SEL_UPORTAL_LOGIN);

  // Fill in username and password, and submit
  await page.waitForSelector(SEL_UPORTAL_LOGIN_USERNAME);
  await page.fill(SEL_UPORTAL_LOGIN_USERNAME, username);
  await page.waitForSelector(SEL_UPORTAL_LOGIN_PASSWORD);
  await page.fill(SEL_UPORTAL_LOGIN_PASSWORD, password);
  await page.waitForSelector(SEL_UPORTAL_LOGIN_SUBMIT);
  await page.click(SEL_UPORTAL_LOGIN_SUBMIT);

  // Confirm uPortal logo
  const uportalLogo = page.locator('h1.portal-logo > a');
  await expect(uportalLogo).toHaveText('uPortal');

  // Confirm user is logged in
  const loggedInUserDisplay = page.locator('div.user-name');
  await expect(loggedInUserDisplay).toHaveText(`You are signed in as ${displayname}`);
}
