import { test, expect } from "@playwright/test";
import { config } from "../general-config";
import {
  createPortletList,
  updatePortletList,
  removePortletList,
  getPortletList,
  getAllPortletLists,
  createPortletListFailsWith409,
  updatePortletListFailsWith409,
} from "./utils/api-portlet-list-utils";
import {
  loginViaApi,
  logoutViaApi,
} from "../ux/utils/ux-general-utils";

const REGEX_TEST_ARRAY = [`TEST spaces`, `TEST!`, `TEST"`, `TEST'`, `TEST&`];

test("GET ALL - not logged in", async ({ request }) => {
  const response = await request.get(`${config.url}api/portlet-list/`);
  expect(response.status()).toEqual(401); // Unauthorized
  expect(await response.json()).toEqual({
    message: "Not authorized",
  });
});

test("GET specific - not logged in", async ({ request }) => {
  const response = await request.get(`${config.url}api/portlet-list/aaa-bbb-ccc`);
  expect(response.status()).toEqual(401); // Unauthorized
  expect(await response.json()).toEqual({
    message: "Not authorized",
  });
});

test("POST confirm disallow duplicate name", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);

  const dateString = new Date().getTime();
  const payload = {
    data: {
      name: `TESTING_-_portlet-list_POST_confirm_disallow_duplicate_name_-_${dateString}`,
    },
  };
  // Create a portlet-list
  const responseCreation = await request.post(
    `${config.url}api/portlet-list/`,
    payload
  );
  expect(responseCreation.status()).toEqual(201);

  // Try to create another one with the same name
  const responseCreation2 = await request.post(
    `${config.url}api/portlet-list/`,
    payload
  );
  expect(responseCreation2.status()).toEqual(400);
  expect(await responseCreation2.json()).toEqual({
    message: "Data integrity issue - such as specifying a non-unique name.",
  });
});

test("POST confirm disallow extra fields", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);

  const dateString = new Date().toString();
  const payload = {
    data: {
      name: `TESTING - portlet-list POST confirm disallow extra fields - ${dateString}`,
      bogus: "trying to sneak something in here",
    },
  };
  // Create a portlet-list
  const responseCreation = await request.post(
    `${config.url}api/portlet-list/`,
    payload
  );
  expect(responseCreation.status()).toEqual(400);
  expect(await responseCreation.json()).toEqual({
    message: "Unparsable portlet-list JSON",
  });
});

test("POST name regex", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);
  for(const valueToTest of REGEX_TEST_ARRAY) {
    await createPortletListFailsWith409(request, "name", config.users.admin.username, valueToTest, [{entityId: "fname1"}]);
  }
});

test("POST ownerUsername regex", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);
  for(const valueToTest of REGEX_TEST_ARRAY) {
    await createPortletListFailsWith409(request, "ownerUsername", valueToTest, `TESTING_regex`, [{entityId: "fname1"}]);
  }
});

test("POST items entityId regex", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);
  for(const valueToTest of REGEX_TEST_ARRAY) {
    await createPortletListFailsWith409(request, "items > entityId", config.users.admin.username, `TESTING_regex`, [{entityId: valueToTest}]);
  }
});

test("POST disallow non-admin to specify ownerUsername", async ({
  request,
}) => {
  await loginViaApi(request, config.users.staff);

  const response = await request.post(
    `${config.url}api/portlet-list/`,
    {
      data: {
        name: `TESTING - portlet-list disallow non-admin to specify ownerUsername - ${(new Date()).toString()}`,
        ownerUsername: config.users.admin.username,
      },
    }
  );
  expect(response.status()).toEqual(400);
  expect(await response.json()).toEqual({
    message: `Non-admin user cannot set portlet-list owner`,
  });
});

test("POST disallow non-admin to specify name as favorites", async ({
  request,
}) => {
  await loginViaApi(request, config.users.staff);

  const response = await request.post(
    `${config.url}api/portlet-list/`,
    {
      data: {
        name: `favorites`,
      },
    }
  );
  expect(response.status()).toEqual(400);
  expect(await response.json()).toEqual({
    message: `Non-admin user cannot set portlet-list name to favorites`,
  });
});

test("PUT name regex", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);
  const listId = await createPortletList(request, `PUT_portlet-list_name_regex_${(new Date()).getTime()}`, [{entityId: "fname1"}]);
  const baselineState = await getPortletList(request, listId);
  for(const valueToTest of REGEX_TEST_ARRAY) {
    await updatePortletListFailsWith409(request, listId, "name", config.users.admin.username, valueToTest, [{entityId: `fname1`}]);
    const currentState = await getPortletList(request, listId);
    expect(currentState).toEqual(baselineState);
  }
});

test("PUT ownerUsername regex", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);
  const listId = await createPortletList(request, `PUT_portlet-list_name_regex_${(new Date()).getTime()}`, [{entityId: "fname1"}]);
  const baselineState = await getPortletList(request, listId);
  for(const valueToTest of REGEX_TEST_ARRAY) {
    await updatePortletListFailsWith409(request, listId, "ownerUsername", valueToTest, "Test_regex", [{entityId: `fname1`}]);
    const currentState = await getPortletList(request, listId);
    expect(currentState).toEqual(baselineState);
  }
});

test("PUT items entityId regex", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);
  const listId = await createPortletList(request, `PUT_portlet-list_name_regex_${(new Date()).getTime()}`, [{entityId: "fname1"}]);
  const baselineState = await getPortletList(request, listId);
  for(const valueToTest of REGEX_TEST_ARRAY) {
    await updatePortletListFailsWith409(request, listId, "items > entityId", config.users.admin.username, "Test_regex", [{entityId: valueToTest}]);
    const currentState = await getPortletList(request, listId);
    expect(currentState).toEqual(baselineState);
  }
});


test("PUT disallow non-admin to specify ownerUsername", async ({
  request,
}) => {
  await loginViaApi(request, config.users.staff);
  const listId = await createPortletList(request, `PUT_portlet-list_disallow_non-admin_to_specify_ownerUsername_${(new Date()).getTime()}`, [{entityId: "fname1"}]);
  const baselineState = await getPortletList(request, listId);

  const responseFailed = await request.put(
    `${config.url}api/portlet-list/${listId}`,
    { data: {
        ownerUsername: config.users.student.username,
      },
    }
  );
  expect(responseFailed.status()).toEqual(400);
  expect(await responseFailed.json()).toEqual({
    message: `Non-admin user cannot change portlet-list owner`,
  });

  const currentState = await getPortletList(request, listId);
  expect(currentState).toEqual(baselineState);
});

test("PUT disallow non-admin to specify name as favorites", async ({
  request,
}) => {
  await loginViaApi(request, config.users.staff);
  const listId = await createPortletList(request, `PUT_portlet-list_disallow_non-admin_to_specify_name_as_favorites_${(new Date()).getTime()}`, [{entityId: "fname1"}]);
  const baselineState = await getPortletList(request, listId);

  const responseFailed = await request.put(
    `${config.url}api/portlet-list/${listId}`,
    { data: {
        name: "favorites",
      },
    }
  );
  expect(responseFailed.status()).toEqual(400);
  expect(await responseFailed.json()).toEqual({
    message: `Non-admin user cannot change portlet-list name to favorites`,
  });

  const currentState = await getPortletList(request, listId);
  expect(currentState).toEqual(baselineState);
});

// This needs to be done in the same test to allow concurrent execution of tests (avoid collisions on the name field)
test("POST / PUT allow admin to specify name as favorites", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);

  // If this fails, check if 'admin' has a portlet list defined with a name of 'favorites'. If so, manually remove it, and rerun test.
  const listId = await createPortletList(request, `favorites`, [{entityId: "fname1"}]);
  const baselineState = await getPortletList(request, listId);

  // Change to a unique name that is not 'favorites'
  const responseUpdate1 = await request.put(
    `${config.url}api/portlet-list/${listId}`,
    { data: {
        name: `post_put_allow_admin_to_specify_name_as_favorites_${(new Date()).getTime()}`,
      },
    }
  );
  expect(responseUpdate1.status()).toEqual(200);

  // Change the name back to 'favorites'
  const responseUpdate2 = await request.put(
      `${config.url}api/portlet-list/${listId}`,
      { data: {
          name: "favorites",
        },
      }
    );
    expect(responseUpdate2.status()).toEqual(200);

  const currentState = await getPortletList(request, listId);
  expect(currentState).toEqual(baselineState);

  // Clean up
  await removePortletList(request, listId);
});

test("DELETE Confirm guest user cannot delete a real portlet list", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);
  const portletListUuid = await createPortletList(request, `DELETE_Confirm_guest_user_cannot_delete_a_real_portlet_list_${(new Date()).getTime()}`, [{entityId: "fname1"}]);
  const baselineState = await getPortletList(request, portletListUuid);
  await logoutViaApi(request);

  // Try to delete, and confirm failure
  const response = await request.delete(`${config.url}api/portlet-list/${portletListUuid}`);
  expect(response.status()).toEqual(401);

  // Check portlet list is still available
  await loginViaApi(request, config.users.admin);
  const currentState = await getPortletList(request, portletListUuid);
  expect(currentState).toEqual(baselineState);
});

test("DELETE Confirm admin can delete their own list", async ({
  request,
}) => {
  await loginViaApi(request, config.users.admin);
  const portletListUuid = await createPortletList(request, `DELETE_Confirm_admin_can_delete_their_own_list_${(new Date()).getTime()}`, [{entityId: "fname1"}]);

  // Try to delete, and confirm success
  await removePortletList(request, portletListUuid);
});

test("DELETE Confirm admin can delete someone elses list", async ({
  request,
}) => {
  await loginViaApi(request, config.users.staff);
  const portletListUuid = await createPortletList(request, `DELETE_Confirm_admin_can_delete_someone_elses_list_${(new Date()).getTime()}`, [{entityId: "fname1"}]);
  await logoutViaApi(request);

  // Log in as admin
  await loginViaApi(request, config.users.admin);

  // Try to delete, and confirm success
  await removePortletList(request, portletListUuid);
});

test("DELETE Confirm non-admin cannot delete someone elses list", async ({
  request,
}) => {
  await loginViaApi(request, config.users.staff);
  const portletListUuid = await createPortletList(request, `DELETE_Confirm_non-admin_cannot_delete_someone_elses_list_${(new Date()).getTime()}`, [{entityId: "fname1"}]);
  await logoutViaApi(request);

  // Log in as a non-admin
  await loginViaApi(request, config.users.student);

  // Try to delete, and confirm failure
  const response = await request.delete(`${config.url}api/portlet-list/${portletListUuid}`);
  expect(response.status()).toEqual(400);
  expect(await response.json()).toEqual({
    message: `Unable to remove portlet list. Please check with your System Administrator.`,
  });
});

test("happy path", async ({ request }) => {
  const dateString = new Date().getTime();

  const portletListName = `portlet-list_happy_path_${dateString}`;

  await loginViaApi(request, config.users.student);

  const jsonBaseline = await getAllPortletLists(request);
  const jsonBaselineWithNewList = await getAllPortletLists(request);
  const jsonBaselineWithUpdatedList = await getAllPortletLists(request);

  const itemsOfNewList = [
    {entityId: "fname1"},
    {entityId: "fname3"},
    {entityId: "fname2"}
  ];

  const idOfNewList = await createPortletList(request, portletListName, itemsOfNewList);

  // Retrieve and confirm newly created list
  const jsonSpecificList = await getPortletList(request, idOfNewList);
  const expectedCreatedList = {
    id: idOfNewList,
    ownerUsername: config.users.student.username,
    name: portletListName,
    items: itemsOfNewList,
    createdBy: config.users.student.username,
    createdOn: expect.stringMatching(config.formats.auditDateTimeTz),
    updatedBy: config.users.student.username,
    updatedOn: expect.stringMatching(config.formats.auditDateTimeTz),
  };
  //expect(jsonSpecificList).toEqual(expect.objectContaining(expectedCreatedList));
  expect(jsonSpecificList).toEqual(expectedCreatedList);

  // Retrieve all lists and confirm baseline portlet-lists and the new list equals the current set of lists
  const jsonCurrentListWithNewList = await getAllPortletLists(request);
  jsonBaselineWithNewList.push(jsonSpecificList);
  expect(jsonCurrentListWithNewList).toEqual(jsonBaselineWithNewList);

  // login_via_api with a different user
  await loginViaApi(request, config.users.staff);

  // Retrieve lists and confirm newly created list is not included
  const jsonOtherUserBaseline = await getAllPortletLists(request);
  expect(jsonOtherUserBaseline).not.toContainEqual(
    expect.objectContaining(jsonSpecificList)
  );

  // login_via_api with original user
  await loginViaApi(request, config.users.student);

  // Update portlet list name and items
  const portletListNameUpdated = `${portletListName}_UPDATED`;
  const itemsOfUpdatedList = [
    {entityId: "fname2"},
    {entityId: "weeklySchedule"}
  ];
  await updatePortletList(request, idOfNewList, portletListNameUpdated, itemsOfUpdatedList);

  // Retrieve and confirm updated list
  const jsonSpecificListUpdated = await getPortletList(request, idOfNewList);
  const expectedUpdatedList = {
    id: idOfNewList,
    ownerUsername: config.users.student.username,
    name: portletListNameUpdated,
    items: itemsOfUpdatedList,
    createdBy: config.users.student.username,
    createdOn: expect.stringMatching(config.formats.auditDateTimeTz),
    updatedBy: config.users.student.username,
    updatedOn: expect.stringMatching(config.formats.auditDateTimeTz),
  };
  expect(jsonSpecificListUpdated).toEqual(expectedUpdatedList);

  // Retrieve all lists and confirm baseline portlet-lists and the new list equals the current set of lists
  const jsonCurrentListWithUpdatedList = await getAllPortletLists(request);
  jsonBaselineWithUpdatedList.push(expectedUpdatedList);
  expect(jsonCurrentListWithUpdatedList).toEqual(jsonBaselineWithUpdatedList);

  // Remove portlet list
  await removePortletList(request, idOfNewList);

  // Retrieve all lists and confirm baseline portlet-lists equals the current set of lists
  const jsonCurrentListWithRemovedList = await getAllPortletLists(request);
  expect(jsonCurrentListWithRemovedList).toEqual(jsonBaseline);
});
