import { expect, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

/*
 * Creates a portlet-list with a given name, and returns the portlet-list id.
 */
export async function createPortletList(
  request: APIRequestContext,
  portletListName: string,
  items: Array<Record<string, string>>
): Promise<string> {

  const response = await request.post(`${config.url}api/portlet-list/`, {
    data: {
      name: portletListName,
      items: items
    },
  });
  const locationHeader: string = response.headers().location;
  expect(locationHeader).not.toEqual(undefined);
  expect(locationHeader.length).not.toEqual(0);
  expect(response.status()).toEqual(201);
  return locationHeader;
}

/*
 * Creates a portlet-list with a given name, and returns the portlet-list id.
 */
export async function createPortletListWithOwner(
  request: APIRequestContext,
  portletListName: string,
  ownerUsername: string,
  items: Array<Record<string, string>>
): Promise<string> {

  const response = await request.post(`${config.url}api/portlet-list/`, {
    data: {
      name: portletListName,
      ownerUsername: ownerUsername,
      items: items
    },
  });
  const locationHeader: string = response.headers().location;
  expect(locationHeader).not.toEqual(undefined);
  expect(locationHeader.length).not.toEqual(0);
  expect(response.status()).toEqual(201);
  return locationHeader;
}

/*
 * Update a portlet-list with a given name, and optionally, a new array of items.
 */
export async function updatePortletList(
  request: APIRequestContext,
  portletListUuid: string,
  portletListName: string,
  items: Array<Record<string, string>>
): Promise<void> {

  const payload = (items === undefined) ? {
    name: portletListName,
  } :
  {
    name: portletListName,
    items: items
  }

  const response = await request.put(`${config.url}api/portlet-list/${portletListUuid}`, {
    data: payload,
  });
  expect(response.status()).toEqual(200);
}

/*
 * Remove a portlet-list
 */
export async function removePortletList(
  request: APIRequestContext,
  portletListUuid: string
): Promise<void> {
  const response = await request.delete(`${config.url}api/portlet-list/${portletListUuid}`);
  expect(response.status()).toEqual(200);
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

export async function createPortletListFailsWith409(
  request: APIRequestContext,
  inputTypeToFail: string,
  ownerUsername: string,
  portletListName: string,
  items: Array<Record<string, string>>
  ): Promise<void> {
  const responseCreation = await request.post(
    `${config.url}api/portlet-list/`,
    { data: {
        ownerUsername: ownerUsername,
        name: portletListName,
        items: items,
      },
    }
  );
  expect(responseCreation.status()).toEqual(409);
  expect(await responseCreation.json()).toEqual({
    message: `Specified ${inputTypeToFail} is not the correct length or has invalid characters.`,
  });
}

export async function updatePortletListFailsWith409(
  request: APIRequestContext,
  portletListUuid: string,
  inputTypeToFail: string,
  ownerUsername: string,
  portletListName: string,
  items: Array<Record<string, string>>
  ): Promise<void> {
  const responseCreation = await request.put(
    `${config.url}api/portlet-list/${portletListUuid}`,
    { data: {
        ownerUsername: ownerUsername,
        name: portletListName,
        items: items,
      },
    }
  );
  expect(responseCreation.status()).toEqual(409);
  expect(await responseCreation.json()).toEqual({
    message: `Specified ${inputTypeToFail} is not the correct length or has invalid characters.`,
  });
}