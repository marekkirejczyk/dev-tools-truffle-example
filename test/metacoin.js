const {providers, Wallet, ContractFactory, Contract} = require('ethers');
const MetaCoin = artifacts.require("MetaCoin");
const SafeMath = artifacts.require("SafeMath");
const MetaCoinContract = require('../.0x-artifacts/MetaCoin.json');
const SafeMathContract = require('../.0x-artifacts/SafeMath.json');

const mode = process.env.MODE;
const amount = 1;
let accountOne;
let accountTwo;

const defaultDeployOptions = {
  gasLimit: 4000000,
  gasPrice: 9000000000
};

async function deployContract(
  wallet,
  contractJSON,
  args = [],
  overrideOptions = {}
) {
  const {abi} = contractJSON;
  const bytecode = contractJSON.evm.bytecode.object;
  const factory = new ContractFactory(abi, bytecode, wallet);
  const deployTransaction = {
    ...defaultDeployOptions,
    ...overrideOptions,
    ...factory.getDeployTransaction(...args)
  };
  const tx = await wallet.sendTransaction(deployTransaction);
  const receipt = await wallet.provider.getTransactionReceipt(tx.hash);
  return new Contract(receipt.contractAddress, abi, wallet);
}

contract("MetaCoin with truffle", accounts => {
  accountOne = accounts[0];
  accountTwo = accounts[1];
  it("should send coin correctly", async () => {
    const metaCoinInstance = await MetaCoin.deployed();
    const safeMathInstance = await SafeMath.deployed();

    console.time("    truffle send");
    await metaCoinInstance.sendCoin(
      safeMathInstance.address,
      accountTwo,
      amount,
      { from: accountOne }
    );
    console.timeEnd("    truffle send");

    console.time("    truffle call");
    await metaCoinInstance.balances(accountTwo);
    console.timeEnd("    truffle call");
  });
});

describe("MetaCoin with ethers.js", () => {
  const provider = new providers.JsonRpcProvider('http://localhost:8545');
  provider.pollingInterval = 5;
  const privateKey = '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d';
  const wallet = new Wallet (privateKey, provider);

  it('ethers', async () => {
    const coinContract = await deployContract(wallet, MetaCoinContract.compilerOutput);
    const mathContract = await deployContract(wallet, SafeMathContract.compilerOutput);

    console.time("    ethers send");
    await coinContract.sendCoin(mathContract.address, accountTwo, amount);
    console.timeEnd("    ethers send");

    console.time("    ethers call");
    (await coinContract.balances(accountTwo));
    console.timeEnd("    ethers call");
  });
});
