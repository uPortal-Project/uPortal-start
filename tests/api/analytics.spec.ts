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
  expect(await response.json()).toEqual({});
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
  expect(await response.json()).toEqual({
    message:"Specified eventType is not the correct length or has invalid characters."
    });
});

test("get logging level", async({ request}) => {
  await loginViaApi(request, "admin", "admin", "Amy Administrator");
    const response = await request.get(
         `${config.url}api/analytics/level`
  );
  expect(response.status()).toEqual(200);
  expect(await response.json()).toEqual({
    level:"AUTHENTICATED"
    });
});
