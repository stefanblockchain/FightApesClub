require("@nomiclabs/hardhat-waffle");

const RINKEBY_PRIVATE_KEY = 'f5a8f4a9c24a3493630921fbe11e3abbe1678d6adc2a830303c9accf567dd90c';
//0xa5CF63886a7db590bCc587F30351c529f081a0D9

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        //host: "127.0.0.1",
        //port: 8545,
        //enabled: true,
        url: 'https://mainnet.infura.io/v3/4fe5aedd983b4af799545ffad71ed745',
        //network_id: "999",
      },
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/4fe5aedd983b4af799545ffad71ed745`,
      accounts: [`${RINKEBY_PRIVATE_KEY}`]
    }
  },
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
