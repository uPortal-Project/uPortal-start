import { test, expect, Page } from "@playwright/test";
import { loginViaUrl } from "../utils/ux-general-utils";
import { config } from "../../general-config";

const BOOKMARKS_URL = `${config.url}p/bookmarks/max/render.uP`;
const BOOKMARKS_EDIT_URL = `${BOOKMARKS_URL}?pCm=edit`;

/**
 * Bookmarks edit mode keeps every form on the page (an empty add form, a
 * hidden error form, etc.). We need to scope input fills to the visible
 * "empty" form, otherwise Playwright resolves to multiple inputs.
 */
function emptyBookmarkForm(page: Page) {
  return page.locator("form[name$='emptyBookmarkForm']:visible");
}

function emptyFolderForm(page: Page) {
  return page.locator("form[name$='emptyFolderForm']:visible");
}

function bookmarkEntryByName(page: Page, name: string) {
  return page.locator(".bookmarksPortlet .bookmarksEntry", { hasText: name });
}

function folderEntryByName(page: Page, name: string) {
  return page.locator(".bookmarksPortlet .bookmarksFolder", { hasText: name });
}

test.describe("Bookmarks Portlet", () => {
  test("renders bookmark list for logged-in user", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(BOOKMARKS_URL);

    await expect(page.locator(".bookmarksPortlet")).toBeVisible();
  });

  test("edit mode loads with action buttons", async ({ page }) => {
    await loginViaUrl(page, config.users.admin);
    await page.goto(BOOKMARKS_EDIT_URL);

    await expect(
      page.getByRole("button", { name: /add bookmark/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /add folder/i })
    ).toBeVisible();
  });

  test("add, edit, and delete a bookmark", async ({ page }) => {
    const stamp = Date.now();
    const initialName = `Playwright Add ${stamp}`;
    const editedName = `Playwright Renamed ${stamp}`;
    const url = "https://www.apereo.org/";
    const note = "Added by the bookmarks workflow spec";

    await loginViaUrl(page, config.users.admin);
    await page.goto(BOOKMARKS_EDIT_URL);

    // --- Add ---
    await page.getByRole("button", { name: /add bookmark/i }).click();

    const addForm = emptyBookmarkForm(page);
    await expect(addForm).toBeVisible();
    await addForm.locator("input[name='name']").fill(initialName);
    await addForm.locator("input[name='url']").fill(url);
    await addForm.locator("textarea[name='note']").fill(note);
    await addForm.locator("input[type='submit'][value='Save']").click();

    await expect(bookmarkEntryByName(page, initialName)).toBeVisible();

    // --- Edit (rename) ---
    const newEntry = page
      .locator(".bookmarksPortlet li.bookmarkListItem")
      .filter({ hasText: initialName });
    await newEntry.locator("a[title^='Edit Bookmark']").click();

    const editForm = emptyBookmarkForm(page);
    await expect(editForm).toBeVisible();
    await expect(editForm.locator("input[name='name']")).toHaveValue(
      initialName
    );
    await expect(editForm.locator("input[name='url']")).toHaveValue(url);

    await editForm.locator("input[name='name']").fill(editedName);
    await editForm.locator("input[type='submit'][value='Save']").click();

    await expect(bookmarkEntryByName(page, editedName)).toBeVisible();
    await expect(bookmarkEntryByName(page, initialName)).toHaveCount(0);

    // --- Delete (auto-confirm the native dialog) ---
    page.on("dialog", (dialog) => dialog.accept());

    const editedEntry = page
      .locator(".bookmarksPortlet li.bookmarkListItem")
      .filter({ hasText: editedName });
    await editedEntry
      .locator("button[type='submit']:has(img[alt^='Delete Bookmark'])")
      .click();

    await expect(bookmarkEntryByName(page, editedName)).toHaveCount(0);
  });

  test("add and delete a folder", async ({ page }) => {
    const folderName = `PW Folder ${Date.now()}`;

    await loginViaUrl(page, config.users.admin);
    await page.goto(BOOKMARKS_EDIT_URL);

    // --- Add folder ---
    await page.getByRole("button", { name: /add folder/i }).click();

    const addForm = emptyFolderForm(page);
    await expect(addForm).toBeVisible();
    await addForm.locator("input[name='name']").fill(folderName);
    await addForm.locator("input[type='submit'][value='Save']").click();

    await expect(folderEntryByName(page, folderName)).toBeVisible();

    // --- Delete folder ---
    page.on("dialog", (dialog) => dialog.accept());

    const folderItem = page
      .locator(".bookmarksPortlet li.bookmarkListItem")
      .filter({ hasText: folderName });
    await folderItem
      .locator("button[type='submit']:has(img[alt^='Delete Folder'])")
      .click();

    await expect(folderEntryByName(page, folderName)).toHaveCount(0);
  });
});
