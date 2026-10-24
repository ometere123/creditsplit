import {expect,test} from '@playwright/test';

test('source build exposes honest deployment state and keyboard navigation',async({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle(/Creditsplit/);
  await expect(page.getByText('Source build · Not deployed.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Connect wallet'})).toBeVisible();
  await page.getByRole('button',{name:'How it works',exact:true}).click();
  await expect(page.getByRole('heading',{name:/Fair credit/})).toBeVisible();
  await page.getByRole('button',{name:'Create a project',exact:true}).click();
  await expect(page.getByText('02 / Three acceptance criteria')).toBeVisible();
  await expect(page.getByLabel('Criterion 1')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
