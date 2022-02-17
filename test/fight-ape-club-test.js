const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FightApesClub", function () {
  it("Should  fail to mint in sale mode", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await expect(
      fightApesClub.mintSale(1)
    ).to.be.revertedWith("Sale not allowed");

    /*const tokenUri = await fightApesClub.tokenURI(2);
    console.log(tokenUri);*/

  });

  it("Should  fail to mintPreSale when in inactive mode", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await expect(
      fightApesClub.mintPreSale({ value: ethers.utils.parseEther("1.0") })
    ).to.be.revertedWith("Presale not allowed");
  });

  it("Should  fail to mintPreSale when user is not whitelisted", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setPresale();

    await expect(
      fightApesClub.mintPreSale({ value: ethers.utils.parseEther("1.0") })
    ).to.be.revertedWith("User not whitelisted");
  });

  it("Should  be able to mint presale", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    const [owner, add1] = await ethers.getSigners();

    await fightApesClub.setWhiteListedUsers([add1.address]);
    await fightApesClub.setPresale();

    await fightApesClub.connect(add1).mintPreSale({ value: ethers.utils.parseEther("0.08") })
    const add1Balance = await fightApesClub.balanceOf(add1.address);

    expect(add1Balance).to.equal(1);
  });

  it("Should  fail to mint twice in presale", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    const [owner, add1] = await ethers.getSigners();

    await fightApesClub.setWhiteListedUsers([add1.address]);
    await fightApesClub.setPresale();

    await fightApesClub.connect(add1).mintPreSale({ value: ethers.utils.parseEther("0.08") });

    await expect(
      fightApesClub.connect(add1).mintPreSale({ value: ethers.utils.parseEther("0.08") })
    ).to.be.revertedWith("User already claimed whitelisted nft");

  });

  it("Should  fail to mint presale with ether < 0.08", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    const [owner, add1] = await ethers.getSigners();

    await fightApesClub.setWhiteListedUsers([add1.address]);
    await fightApesClub.setPresale();

    await expect(
      fightApesClub.connect(add1).mintPreSale({ value: ethers.utils.parseEther("0.07") })
    ).to.be.revertedWith("Not enough ether");

  });

  it("Should  be able  to mint in sale mode", async function () {
    const [owner] = await ethers.getSigners();
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setSale();
    await fightApesClub.mintSale(4, { value: ethers.utils.parseEther("1.0") });

    const ownerBalance = await fightApesClub.balanceOf(owner.address);
    expect(ownerBalance).to.equal(4);
  });

  it("Should  fail to mint in sale mode with not enough ether sent", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setSale();

    await expect(
      fightApesClub.mintSale(10, { value: ethers.utils.parseEther("0.01") })
    ).to.be.revertedWith("Not enough ether");
  });

  it("Should  fail to mint when amount > 10", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setSale();

    await expect(
      fightApesClub.mintSale(100, { value: ethers.utils.parseEther("8.0") })
    ).to.be.revertedWith("Amount is not valid");
  });

  it("Should be able to switch between mint statues", async function () {
    let status;
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setSale();
    status = await fightApesClub.MINT_STATUS();
    expect(status).to.equal(2);

    await fightApesClub.setInactive();
    status = await fightApesClub.MINT_STATUS();
    expect(status).to.equal(0);

    await fightApesClub.setPresale();
    status = await fightApesClub.MINT_STATUS();
    expect(status).to.equal(1);
  });

  it("Should be able to set sale price", async function () {
    const [owner] = await ethers.getSigners();
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setSalePrice(ethers.utils.parseEther("0.01"));
    await fightApesClub.setSale();
    await fightApesClub.mintSale(1, { value: ethers.utils.parseEther("0.01") })
    const ownerBalance = await fightApesClub.balanceOf(owner.address);

    expect(ownerBalance).to.equal(1);
  });

  it("Shouldn't be able to mint more then  12 000 NFTS", async function () {
    this.timeout(400000);
    let ownerBalance;
    const [owner] = await ethers.getSigners();
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setSalePrice(ethers.utils.parseEther("0.001"));
    await fightApesClub.setSale();
    for (let i = 0; i < 1200; i++) {
      await fightApesClub.mintSale(10, { value: ethers.utils.parseEther("1.2") });
    }
    ownerBalance = await fightApesClub.balanceOf(owner.address);

    expect(ownerBalance).to.equal(12000);

    await expect(
      fightApesClub.mintSale(1, { value: ethers.utils.parseEther("0.001") })
    ).to.be.revertedWith("GEN_0 cap overflow");
  });

  it("Owner should be able to widthdraw the balance of contract", async function () {
    const [owner, addr1] = await ethers.getSigners();
    let provider = ethers.getDefaultProvider();
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setSale();
    await fightApesClub.connect(addr1).mintSale(1, { value: ethers.utils.parseEther("0.1") });
    const prevBalance = await fightApesClub.contractBalance();
    await fightApesClub.connect(owner).withdrawAll();
    const currentBalance = await fightApesClub.contractBalance();
    expect(prevBalance).to.equal(ethers.utils.parseEther("0.1"));
    expect(currentBalance).to.equal(0);
  });

  it("After presale mint, balance should be bigger then 0 ", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.setPresale();
    await fightApesClub.setWhiteListedUsers([addr1.address]);
    await fightApesClub.connect(addr1).mintPreSale({ value: ethers.utils.parseEther("0.08") });
    const prevBalance = await fightApesClub.contractBalance();
    await fightApesClub.withdrawAll();
    const currentBalance = await fightApesClub.contractBalance();
    expect(prevBalance).to.equal(ethers.utils.parseEther("0.08"));
    expect(currentBalance).to.equal(0);
  });

  it("When balance is 0, withdrawAll should fail", async function () {
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    const balance = await fightApesClub.contractBalance();
    expect(balance).to.equal(0);
    await expect(fightApesClub.withdrawAll())
      .to.be.revertedWith("No balance to withdraw.");

  });

  it("Setting admin should pass", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const FightApesClub = await ethers.getContractFactory("FightApesClub");
    const fightApesClub = await FightApesClub.deploy();
    await fightApesClub.deployed();

    await fightApesClub.connect(owner).setAdmin(addr1.address);
    const admin = await fightApesClub.admin();
    expect(admin).to.equal(addr1.address);
  });
});
