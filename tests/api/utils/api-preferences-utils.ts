import { expect, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

interface PreferenceFavoriteResponse {
  newNodeId: string;
  response: string;
}

/*
 * Favorite a portlet, indentified by portlet ID.  Return new node ID.
 */
export async function favoritePortlet(
  request: APIRequestContext,
  portletId: string
): Promise<string> {
  expect(portletId).not.toBeNull();
  const response = await request.post(
    `${config.url}api/layout?action=addFavorite&channelId=${portletId}`
  );
  expect(response.status()).toEqual(200);
  const responseBody: PreferenceFavoriteResponse = JSON.parse(await response.text()) as PreferenceFavoriteResponse;
  return responseBody.newNodeId;
}

/*
 * Unfavorite a portlet, indentified by portlet ID.  Returns boolean indicating whether or not operation was successful.
 */
export async function unfavoritePortlet(
  request: APIRequestContext,
  portletId: string
): Promise<boolean> {
  expect(portletId).not.toBeNull();
  const response = await request.post(`${config.url}api/layout?action=removeFavorite&channelId=${portletId}`);
  expect(response.status()).toEqual(200);
  const responseBody: PreferenceFavoriteResponse = JSON.parse(await response.text()) as PreferenceFavoriteResponse;
  return responseBody.response === "Removed from Favorites successfully";
}
