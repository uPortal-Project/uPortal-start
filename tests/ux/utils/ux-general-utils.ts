import { test, expect, APIRequestContext } from '@playwright/test';
import { config } from '../../general-config';

/*
 * Log into uPortal
 */
export async function login(request: APIRequestContext, username: string, password: string): Promise<void> {
    const response = await request.get(`${config.url}Login?userName=${username}&password=${password}`);
    expect(response.status()).toEqual(200);
}
