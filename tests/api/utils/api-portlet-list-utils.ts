import { test, expect } from '@playwright/test';
import { config } from '../../general-config.ts';

/*
 * Creates a portlet-list with a given name, and returns the portlet-list id.
 */
export async function createPortletList(request, portletListName) {
  const response = await request.post(`${config.url}api/portlet-list/`, {
    data: {
      name: portletListName,
    }
  });
  const locationHeader = await response.headers().location;
  expect(locationHeader).not.toEqual(undefined);
  expect(locationHeader.length).not.toEqual(0);
  expect(response.status()).toEqual(201);
  return locationHeader;
}

/*
 * Returns all portlet-lists for the logged in user
 */
export async function getAllPortletLists(request) {
    const response = await request.get(`${config.url}api/portlet-list/`);
    expect(response.status()).toEqual(200);
    const json = await response.json();
    return json;
}

/*
 * Returns the specific portlet-list for the logged in user
 */
export async function getPortletList(request, id) {
    const response = await request.get(`${config.url}api/portlet-list/${id}`);
    expect(response.status()).toEqual(200);
    const json = await response.json();
    return json;
}
