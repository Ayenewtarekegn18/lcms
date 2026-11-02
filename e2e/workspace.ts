import { expect, test, type Locator, type Page } from '@playwright/test'
import { serviceSelect } from './helpers'

// Helpers for the ministry workspace specs (docs/MINISTRY_WORKSPACES.md): open a tab, fill the add and
// edit dialogs, find a row, confirm a delete.

export const ZERO = '00000000-0000-0000-0000-000000000000'

/** A name no other run or test uses. */
export const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 6)}${test.info().retry}-${Math.random().toString(36).slice(2, 8)}`

/** <main> is the scroll container, so overflow can hide inside it without widening the document. */
export const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

export const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

export async function openTab(page: Page, name: string) {
  const tab = page.getByRole('tab', { name, exact: true })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
}

/** Type in a member field (label starting with `label`) and choose the person from the matches. */
export async function pickMember(dialog: Locator, label: string, person: { firstName: string; lastName: string }) {
  await dialog.getByLabel(new RegExp(`^${label}`)).fill(person.lastName)
  await dialog.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(`${person.firstName} ${person.lastName}`) }).click()
}

/** Click "Add <noun>", fill the dialog and send it; resolves once the dialog closed. */
export async function addRow(page: Page, noun: string, fill: (dialog: Locator) => Promise<unknown>) {
  await page.getByRole('button', { name: `Add ${noun}` }).first().click()
  const dialog = page.getByRole('dialog', { name: `Add ${noun}` })
  await fill(dialog)
  await dialog.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(dialog).toBeHidden({ timeout: 20_000 })
}

/** The row of the `label` table that contains `text`, after searching for `search` (default `text`). */
export async function findRow(page: Page, label: string, searchPlaceholder: string, text: string, search = text) {
  await page.getByRole('searchbox', { name: searchPlaceholder }).fill(search)
  const row = page.getByRole('table', { name: label }).getByRole('row').filter({ hasText: text })
  await expect(row).toHaveCount(1)
  return row
}

/** Open the row's edit dialog, change it and save. */
export async function editRow(page: Page, row: Locator, noun: string, fill: (dialog: Locator) => Promise<unknown>) {
  await row.getByRole('button', { name: /^Edit / }).click()
  const dialog = page.getByRole('dialog', { name: `Edit ${noun}` })
  await fill(dialog)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toBeHidden({ timeout: 20_000 })
}

/** Delete (or remove) the row: cancel once, then confirm. */
export async function deleteRow(page: Page, row: Locator, noun: string, verb: 'Delete' | 'Remove' = 'Delete') {
  const confirm = page.getByRole('dialog', { name: `${verb} this ${noun}?` })
  await row.getByRole('button', { name: new RegExp(`^${verb} `) }).click()
  await confirm.getByRole('button', { name: 'Cancel' }).click()
  await expect(confirm).toBeHidden()
  await expect(row).toHaveCount(1)
  await row.getByRole('button', { name: new RegExp(`^${verb} `) }).click()
  await confirm.getByRole('button', { name: verb, exact: true }).click()
  await expect(confirm).toBeHidden()
  await expect(row).toHaveCount(0)
}
