import { expect, Page, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
 * Log into uPortal
 */
export async function login_via_api(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<void> {
  const response = await request.get(
    `${config.url}Login?userName=${username}&password=${password}`
  );
  expect(response.status()).toEqual(200);
  await sleep(1000);
}

export async function login_via_page(
  page: Page,
  username: string,
  password: string,
  displayname: string,
): Promise<void> {
  await page.goto(`${config.url}Login?userName=${username}&password=${password}`);
  const uportalLogo = page.locator('h1.portal-logo > a');
  await expect(uportalLogo).toHaveText('uPortal');
  const loggedInUserDisplay = page.locator('div.user-name');
  await expect(loggedInUserDisplay).toHaveText(`You are signed in as ${displayname}`);
  await sleep(1000);
}
