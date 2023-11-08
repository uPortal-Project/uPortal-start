import { test, expect } from "@playwright/test";
import { config } from "../general-config";
import { loginViaApi } from "../ux/utils/ux-general-utils";
import {
  PortletDefBasicInfo,
  getPortletDetails,
} from "./utils/api-portlets-utils";
import {
  favoritePortlet,
  unfavoritePortlet,
} from "./utils/api-preferences-utils";

interface PortletSearchResult {
  description: string;
  fname: string;
  name: string;
  score: string;
  title: string;
  url: string;
  favorite: boolean;
}

interface PortletSearchResults {
  portlets: PortletSearchResult[];
}

test("search all", async ({ request }) => {
  await loginViaApi(request, config.users.admin);
  const response = await request.get(
    `${config.url}api/v5-0/portal/search?q=cartoon`
  );
  expect(response.status()).toEqual(200);
  expect(await response.json()).toEqual({
    people: [],
    portlets: [
      {
        description: "Daily Business Cartoon by Ted Goff, www.tedgoff.com",
        "favorite": false,
        fname: "daily-business-cartoon",
        name: "Daily Business Cartoon",
        score: "4.0",
        title: "Daily Business Cartoon",
        url: "/uPortal/p/daily-business-cartoon.ctf3/max/render.uP",
	favorite: false,
      },
    ],
  });
});

test("search favorited portlet", async({ request }) => {
  await loginViaApi(request, config.users.admin);
  const portletFname = 'daily-business-cartoon';
  const portletDetails: PortletDefBasicInfo | null = await getPortletDetails(request, portletFname);
  if (!portletDetails) {
    console.error('could not retrieve portlet details in order to get portlet ID');
    test.fail();
  } else {
    const portletId = portletDetails.id;
    expect(await favoritePortlet(request, portletId)).not.toBeNull();
    const response = await request.get(`${config.url}api/v5-0/portal/search?q=cartoon&type=portlets`);
    expect(await unfavoritePortlet(request, portletId)).toBe(true);
    expect(response.status()).toEqual(200);
    const portletSearchResults: PortletSearchResults = JSON.parse(await response.text()) as PortletSearchResults;
    const portletFound: PortletSearchResult = portletSearchResults.portlets[0];
    expect(portletFound.favorite).toBe(true);
    expect(portletFound.fname).toBe(portletFname);
  }
});

test("search type people", async ({ request }) => {
  await loginViaApi(request, config.users.admin);
  const response = await request.get(
    `${config.url}api/v5-0/portal/search?q=steven&type=people`
  );
  expect(response.status()).toEqual(200);
  expect(await response.json()).toEqual({
    people: [
      {
        uid: ["student"],
        telephoneNumber: ["(555) 555-5555"],
        mail: ["steven.student@example.org"],
        displayName: ["Steven Student"],
        givenName: ["Steven"],
        "user.login.id": ["student"],
        sn: ["Student"],
        username: ["student"],
      },
    ],
  });
});
