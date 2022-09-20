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
