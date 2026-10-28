import {expect,test,type Page} from '@playwright/test';

const sponsor='0xB845a69860ba4CDf19CfDC5AfbAF2e20b6bE86b0';
const replacement='0x951e6B75530774fF82321a5ae54e14F778F0C855';
const txHash='0xecffe0cb59c0d99f331f486188e90f197fecc5bb920665fe2deb765425f8e972';

async function installProvider(page: Page) {
  await page.addInitScript(({sponsorAddress, replacementAddress, hash}) => {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    const state = { account: sponsorAddress, chainId: '0x1', sent: [] as unknown[] };
    const notify = (event: string, value: unknown) => listeners.get(event)?.forEach((listener) => listener(value));
    const transaction = () => ({
      hash,
      from_address: state.account,
      to_address: '0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D',
      data: { calldata: '' },
      value: 0,
      type: 2,
      status: 'FINALIZED',
      result: 6,
      result_name: 'MAJORITY_AGREE',
      txExecutionResult: 1,
      consensus_data: { leader_receipt: [{ mode: 'leader', execution_result: 'SUCCESS' }], validators: [] },
      currentTimestamp: 0,
      numOfInitialValidators: 0,
      txSlot: 0,
      createdTimestamp: 0,
      lastVoteTimestamp: 0,
      queuePosition: 0,
      numOfRounds: 0,
      readStateBlockRange: { activationBlock: 0, processingBlock: 0, proposalBlock: 0 },
      lastRound: { round: 0, leaderIndex: 0, votesCommitted: 0, votesRevealed: 0, appealBond: 0, rotationsLeft: 0, validatorVotes: [] },
      value_credited: true,
    });
    const provider = {
      request: async ({method, params = []}: {method: string; params?: unknown[]}) => {
        switch (method) {
          case 'eth_requestAccounts':
          case 'eth_accounts': return [state.account];
          case 'eth_chainId': return state.chainId;
          case 'wallet_switchEthereumChain': state.chainId = String((params[0] as {chainId:string}).chainId); notify('chainChanged', state.chainId); return null;
          case 'wallet_addEthereumChain': state.chainId = '0xf22f'; notify('chainChanged', state.chainId); return null;
          case 'eth_getTransactionCount': return '0x0';
          case 'eth_estimateGas': return '0x30d40';
          case 'eth_gasPrice': return '0x0';
          case 'eth_sendTransaction': state.sent.push(params[0]); return hash;
          case 'eth_getTransactionByHash': return transaction();
          case 'eth_getTransactionReceipt': return {transactionHash: hash, status: '0x1', logs: []};
          default: throw new Error(`Unsupported deterministic wallet method: ${method}`);
        }
      },
      on: (event: string, listener: (...args: unknown[]) => void) => { if(!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event)?.add(listener); },
      removeListener: (event: string, listener: (...args: unknown[]) => void) => { listeners.get(event)?.delete(listener); },
    };
    (window as unknown as {ethereum: unknown}).ethereum = provider;
    (window as unknown as {__creditsplitTest: unknown}).__creditsplitTest = {
      sent: () => state.sent,
      switchAccount: (account: string) => { state.account = account; notify('accountsChanged', [account]); },
      switchChain: (chainId: string) => { state.chainId = chainId; notify('chainChanged', chainId); },
      replacementAddress,
    };
  }, {sponsorAddress: sponsor, replacementAddress: replacement, hash: txHash});
}

async function failReads(page: Page) {
  await page.route('**/api', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') return route.continue();
    const body = request.postDataJSON() as {id: string|number; method:string};
    if (body.method === 'eth_getTransactionCount') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:body.id,result:'0x0'})});
    if (body.method === 'eth_estimateGas') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:body.id,result:'0x30d40'})});
    if (body.method === 'eth_gasPrice') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:body.id,result:'0x0'})});
    if (body.method === 'eth_getTransactionByHash') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:body.id,result:{hash:txHash,from_address:sponsor,to_address:'0xBfBF8E1AB95cbEfF732aa541840f55C222f2c80D',data:{calldata:''},value:0,type:2,status:'FINALIZED',result:6,result_name:'MAJORITY_AGREE',txExecutionResult:1,consensus_data:{leader_receipt:[{mode:'leader',execution_result:'SUCCESS'}],validators:[]},currentTimestamp:0,numOfInitialValidators:0,txSlot:0,createdTimestamp:0,lastVoteTimestamp:0,queuePosition:0,numOfRounds:0,readStateBlockRange:{activationBlock:0,processingBlock:0,proposalBlock:0},lastRound:{round:0,leaderIndex:0,votesCommitted:0,votesRevealed:0,appealBond:0,rotationsLeft:0,validatorVotes:[]},value_credited:true}})});
    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({jsonrpc:'2.0', id:body.id, error:{code:-32000, message:'deterministic read fixture unavailable'}})});
  });
}

test('connected sponsor flow validates chain, constructs one payable write, and preserves confirmed success after read failure', async ({page}) => {
  await installProvider(page);
  await failReads(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/Creditsplit/);
  await page.getByRole('button',{name:'Connect wallet'}).click();
  await expect(page.getByText('Wallet connected to StudioNet 61999.')).toBeVisible();
  await page.getByRole('button',{name:'Create a project',exact:true}).click();
  await page.getByLabel('Project title').fill('Deterministic wallet QA project');
  await page.getByLabel('Project brief').fill('A fixture-backed browser test for a funded collaborative technical guide.');
  await page.getByLabel('Contributor A wallet').fill('0x7e2a8d765e0e346C451109eb42D92f61FBdbfd4b');
  await page.getByLabel('Contributor B wallet').fill('0x1F21Be13E3Fd277C5D3115b7Fb8135de19A427F5');
  await page.getByLabel('Contributor C wallet').fill('0x9Fb5156D0befFbCE9489C69f4Ae84C8A129598e6');
  await page.getByLabel('Reward pool in native GEN').fill('0.002');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Create & fund project'}).click();
  await expect(page.getByText(/Transaction finalized with successful execution/)).toBeVisible();
  await expect(page.getByText(/confirmed transaction is saved|read-back failed|read-back is still unavailable/i)).toBeVisible();
  await expect(page.getByRole('button',{name:'Retry read only'})).toBeVisible();
  await expect(page.getByRole('link',{name:/View transaction/})).toHaveAttribute('href',new RegExp(txHash));
  const sent = await page.evaluate(() => (window as unknown as {__creditsplitTest:{sent:()=>unknown[]}}).__creditsplitTest.sent());
  expect(sent).toHaveLength(1);
  expect((sent[0] as {value:string}).value).toBe('0x71afd498d0000');
  await page.getByRole('button',{name:'Create a project',exact:true}).click();
  await expect(page.getByRole('button',{name:'Create & fund project'})).toBeDisabled();
  const sentAfterRetry = await page.evaluate(() => (window as unknown as {__creditsplitTest:{sent:()=>unknown[]}}).__creditsplitTest.sent());
  expect(sentAfterRetry).toHaveLength(1);
});
test('account and chain changes clear stale signing authority', async ({page}) => {
  await installProvider(page);
  await failReads(page);
  await page.goto('/');
  await page.getByRole('button',{name:'Connect wallet'}).click();
  await expect(page.getByText('Wallet connected to StudioNet 61999.')).toBeVisible();
  await page.evaluate(() => (window as unknown as {__creditsplitTest:{switchAccount:(account:string)=>void}}).__creditsplitTest.switchAccount('0x951e6B75530774fF82321a5ae54e14F778F0C855'));
  await expect(page.getByText('Wallet or network changed. Reconnect to StudioNet before signing.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Connect wallet'})).toBeVisible();
  await page.evaluate(() => (window as unknown as {__creditsplitTest:{switchChain:(chain:string)=>void}}).__creditsplitTest.switchChain('0x1'));
  await expect(page.getByText('Wallet or network changed. Reconnect to StudioNet before signing.')).toBeVisible();
});
