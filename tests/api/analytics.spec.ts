import { test, expect } from "@playwright/test";
import { config } from "../general-config";
import { loginViaApi } from "../ux/utils/ux-general-utils";

test("post valid link", async ({ request }) => {
  await loginViaApi(request, "admin", "admin", "Amy Administrator");
  const response = await request.post(
    `${config.url}api/analytics`, {
        data: {
            url:'https://yahoo.com',
            type:'link'
        }
    }
  );
  expect(response.status()).toEqual(201);
});

test("post invalid link", async ({ request }) => {
  await loginViaApi(request, "admin", "admin", "Amy Administrator");
  const response = await request.post(
    `${config.url}api/analytics`, {
        data: {
            url:'https://yahoo.com',
            type:'<link/>'
        }
    }
  );
  expect(response.status()).toEqual(400);
});

//test("search type people", async ({ request }) => {
//  await loginViaApi(request, "admin", "admin", "Amy Administrator");
//  const response = await request.get(
//    `${config.url}api/v5-0/portal/search?q=steven&type=people`
//  );
//  expect(response.status()).toEqual(200);
//  expect(await response.json()).toEqual({
//    people: [
//      {
//        uid: ["student"],
//        telephoneNumber: ["(555) 555-5555"],
//        mail: ["steven.student@example.org"],
//        displayName: ["Steven Student"],
//        givenName: ["Steven"],
//        "user.login.id": ["student"],
//        sn: ["Student"],
//        username: ["student"],
//      },
//    ],
//  });
//});
