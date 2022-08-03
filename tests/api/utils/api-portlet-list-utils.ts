import { expect, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

/*
 * Creates a portlet-list with a given name, and returns the portlet-list id.
 */
export async function createPortletList(
  request: APIRequestContext,
  portletListName: string
): Promise<string> {
  const response = await request.post(`${config.url}api/portlet-list/`, {
    data: {
      name: portletListName,
    },
  });
  const locationHeader: string = response.headers().location;
  expect(locationHeader).not.toEqual(undefined);
  expect(locationHeader.length).not.toEqual(0);
  expect(response.status()).toEqual(201);
  return locationHeader;
}

/*
 * Returns all portlet-lists for the logged in user
 */
export async function getAllPortletLists(
  request: APIRequestContext
): Promise<Array<Record<string, unknown>>> {
  const response = await request.get(`${config.url}api/portlet-list/`);
  expect(response.status()).toEqual(200);
  // Future improvement - instead of 'unknown', leverage interfaces with a tool like https://zod.dev/
  const json = (await response.json()) as Array<Record<string, unknown>>;
  return json;
}

/*
 * Returns the specific portlet-list for the logged in user
 */
export async function getPortletList(
  request: APIRequestContext,
  id: string
): Promise<Record<string, unknown>> {
  const response = await request.get(`${config.url}api/portlet-list/${id}`);
  expect(response.status()).toEqual(200);
  // Future improvement - instead of 'unknown', leverage interfaces with a tool like https://zod.dev/
  const json = (await response.json()) as Record<string, unknown>;
  return json;
}
