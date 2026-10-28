import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  testMatch:'**/connected-wallet.spec.ts',
  fullyParallel:false,
  reporter:'list',
  use:{baseURL:'http://127.0.0.1:3110',trace:'retain-on-failure'},
  webServer:{command:'node tests/e2e/connected-server.mjs',url:'http://127.0.0.1:3110',reuseExistingServer:false,timeout:120000},
  projects:[
    {name:'connected-desktop',use:{...devices['Desktop Chrome']}},
    {name:'connected-mobile',use:{...devices['Pixel 7']}},
  ],
});
