import { test, expect } from '@playwright/test';
import { config } from '../general-config.ts';
import {
    createPortletList,
    getAllPortletLists,
    getPortletList } from './utils/api-portlet-list-utils.ts';
import { login } from '../ux/utils/ux-general-utils.ts';

test('portlet-list GET ALL - not logged in', async ({ request }) => {
  const response = await request.get(`${config.url}api/portlet-list/`);
  expect(response.status()).toEqual(401); // Unauthorized
  expect(await response.json()).toEqual({
    message: 'Not authorized'
  });
});

test('portlet-list POST confirm disallow duplicate name', async ({ request }) => {
    await login(request, 'admin', 'admin');

    const dateString = new Date();
    const payload = {
        data: {
            name: 'TESTING - portlet-list POST confirm disallow duplicate name - ' + dateString,
        }
    }
    // Create a portlet-list
    const responseCreation = await request.post(`${config.url}api/portlet-list/`, payload);
    expect(responseCreation.status()).toEqual(201);

    // Try to create another one with the same name
    const responseCreation2 = await request.post(`${config.url}api/portlet-list/`, payload);
    expect(responseCreation2.status()).toEqual(400);
    expect(await responseCreation2.json()).toEqual({
    message: 'Data integrity issue - likely tried to use a non-unique name.'
    });
});

test('portlet-list happy path', async ({ request }) => {
    const portletListName = "portlet-list happy path ${(new Date())}";

    await login(request, 'admin', 'admin');

    const jsonBaseline = await getAllPortletLists(request);

    const idOfNewList = await createPortletList(request, portletListName);

    // Retrieve and confirm newly created list
    const jsonSpecificList = await getPortletList(request, idOfNewList);
    const expectedCreatedList = {
        id: idOfNewList,
        userId: config.adminUserId,
        name: portletListName,
    }
    expect(jsonSpecificList).toEqual(expectedCreatedList);

    // Retrieve all lists and confirm baseline portlet-lists and the new list equals the current set of lists
    const jsonNewBaseline = await getAllPortletLists(request);
    const jsonExpectedNewBaseline = jsonNewBaseline;
    jsonExpectedNewBaseline.push(jsonSpecificList);
    expect(jsonNewBaseline).toEqual(jsonExpectedNewBaseline);

    // Login with a different user
    await login(request, 'staff', 'staff');

    // Retrieve lists and confirm newly created list is not included
    const jsonOtherUserBaseline = await getAllPortletLists(request);
    expect(jsonOtherUserBaseline).not.toContainEqual(expect.objectContaining(jsonSpecificList));
});
