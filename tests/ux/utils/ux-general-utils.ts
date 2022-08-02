import { expect, Page, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

// async function sleep(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

/*
 * Log into uPortal
 */
export async function login_via_api(
  request: APIRequestContext,
  username: string,
  password: string,
  displayname: string,
): Promise<string> {
  const url = `${config.url}Login?userName=${username}&password=${password}`;
  const response = await request.get(url);
  expect(response.status()).toEqual(200);
  const text = await response.text();
  console.log("login_via_api - url [" + url + "] - response url [%s] - headers [%o]", response.url(), response.headers());
  return text;
  //await sleep(2000);
}

export async function login_via_page(
  page: Page,
  username: string,
  password: string,
  displayname: string,
): Promise<void> {
  const url = `${config.url}Login?userName=${username}&password=${password}`;
  await page.goto(url);
  //await sleep(2000);
  //console.log("login_via_api - url [%s], - headers [%o]", url, page.headers());
  const uportalLogo = page.locator('h1.portal-logo > a');
  await expect(uportalLogo).toHaveText('uPortal');
  const loggedInUserDisplay = page.locator('div.user-name');
  await expect(loggedInUserDisplay).toHaveText(`You are signed in as ${displayname}`);
  //await sleep(2000);
}
