import { test, expect } from '@playwright/test';
import { config } from '../../general-config.ts';

/*
 * Log into uPortal
 */
export async function login(request, username, password) {
    const response = await request.get(config.url + `Login?userName=` + username + `&password=` + password);
    expect(response.status()).toEqual(200);
}
