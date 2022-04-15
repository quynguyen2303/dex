const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const Dai = artifacts.require("tokens/Dai.sol");
const Bat = artifacts.require("tokens/Bat.sol");
const Rep = artifacts.require("tokens/Rep.sol");
const Zrx = artifacts.require("tokens/Zrx.sol");
const Dex = artifacts.require("Dex.sol");

contract("Dex", (accounts) => {
    let dai, bat, rep, zrx, dex;
    const [trader1, trader2] = [accounts[1], accounts[2]];
    const [DAI, BAT, REP, ZRX] = ["DAI", "BAT", "REP", "ZRX"].map(ticker => web3.utils.fromAscii(ticker));

    beforeEach( async () => {
        ([dai, bat, rep, zrx] = await Promise.all([
            Dai.new(),
            Bat.new(),
            Rep.new(),
            Zrx.new()
        ]));
        // init Dex
        dex = await Dex.new();
        await Promise.all([
            dex.addToken(DAI,dai.address),
            dex.addToken(BAT,bat.address),
            dex.addToken(REP,rep.address),
            dex.addToken(ZRX,zrx.address)
        ]);
        // init seed token balance for testing
        const amount = web3.utils.toWei("10");
        const seedTokenBalance = async (token, trader) => {
            await token.faucet(trader, amount)
            await token.approve(
                dex.address,
                amount,
                {from: trader}
            );
        };
        await Promise.all(
            [dai, bat, rep, zrx].map(
                token => seedTokenBalance(token, trader1))
        );
        await Promise.all(
            [dai, bat, rep, zrx].map(
                token => seedTokenBalance(token, trader2))
        );
    });

            // Test the deposit() function
    it("Should deposit the token", async () => {
        const amount = web3.utils.toWei("0.01");
                await dex.deposit(amount, DAI, {from: trader1});
                const balance = await dex.traderBalances[trader1][DAI];
    
                assert(amount == balance.toString());
            });
    
    it("Failed test", async () => {
                assert(0 == 1);
            })
});