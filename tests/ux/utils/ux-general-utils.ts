import { expect, Page, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

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
}
