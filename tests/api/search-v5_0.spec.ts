import { test, expect } from "@playwright/test";
import { config } from "../general-config";
import { login_via_api } from "../ux/utils/ux-general-utils";

test.only("search all", async ({
  request,
}) => {
  await login_via_api(request, "admin", "admin", "Amy Administrator");
  const response = await request.get(`${config.url}api/v5-0/portal/search?q=cartoon`);
  expect(response.status()).toEqual(200);
  expect(await response.json()).toEqual({
    people: [],
    portlets: [
      {
        description: "Daily Business Cartoon by Ted Goff, www.tedgoff.com",
        fname: "daily-business-cartoon",
        name: "Daily Business Cartoon",
        score: "4.0",
        title: "Daily Business Cartoon",
        url: "/uPortal/p/daily-business-cartoon.ctf3/max/render.uP"
      }
    ]
  });
});

test("search type people", async ({
  request,
}) => {
  await login_via_api(request, "admin", "admin", "Amy Administrator");
  const response = await request.get(`${config.url}api/v5-0/portal/search?q=steven&type=people`);
  expect(response.status()).toEqual(200);
  expect(await response.json()).toEqual({
    people: [
      {
        uid: [
          "student"
        ],
        telephoneNumber: [
          "(555) 555-5555"
        ],
        mail: [
          "steven.student@example.org"
        ],
        displayName: [
          "Steven Student"
        ],
        givenName: [
          "Steven"
        ],
        "user.login.id": [
          "student"
        ],
        sn: [
          "Student"
        ],
        username: [
          "student"
        ]
      }
    ]
  });
});
