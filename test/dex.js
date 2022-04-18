const { expectRevert } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const Dai = artifacts.require("tokens/Dai.sol");
const Bat = artifacts.require("tokens/Bat.sol");
const Rep = artifacts.require("tokens/Rep.sol");
const Zrx = artifacts.require("tokens/Zrx.sol");
const Dex = artifacts.require("Dex.sol");

contract("Dex", (accounts) => {
    let dai, bat, rep, zrx, dex;
    const [trader1, trader2] = [accounts[1], accounts[2]];
    const [DAI, BAT, REP, ZRX] = ["DAI", "BAT", "REP", "ZRX"].map(
        ticker => web3.utils.fromAscii(ticker));

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
        const amount = web3.utils.toWei("1000");
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
        const amount = web3.utils.toWei("1");
        await dex.deposit(amount, DAI, {from: trader1});
        const balance = await dex.traderBalances(trader1, DAI);
    
        assert(amount == balance.toString());
    });
    
    it("Should NOT deposit the token not in the exchange yet.", async () => {
        await expectRevert(
            dex.deposit(
                web3.utils.toWei("1"),
                web3.utils.fromAscii("FAKE-TOKEN"),
                {from: trader1}
            ),
            "Token is not in the DEX yet."
        );
    });

    it.only("Test get balance", async () => {
        const amount = web3.utils.toWei("10");

        await dex.deposit(amount, DAI, {from: trader1});

        console.log("deposited addess: " + dai.address);
        let balance = await web3.eth.getBalance(dai.address);
        console.log(balance);
    });

    // Test the withdraw() functioneth
    it("Should withdraw token", async () => {
        const amount = web3.utils.toWei("10");
        // const withdrawAmount = web3.utils.toWei("5");

        await dex.deposit(amount, DAI, {from: trader1});

        const balanceDex = await dex.tokens

        await dex.withdraw(DAI, amount, {from: trader1});

        // const [balanceDex, balanceTrader] = await Promise.all([
        //     dex.traderBalances(trader1, DAI),
        //     dai.balanceOf(trader1)
        // ]);

        const balanceTrader = await dai.balanceOf(trader1);

        // assert(balanceDex.isZero());
        assert(balanceTrader.toString() === web3.utils.toWei("10"));
    });

    it("Should not withdraw an unexists token", async () => {
        await expectRevert(
            dex.withdraw(
                trader1, 
                web3.utils.fromAscii("FAKE-TOKEN"), 
                web3.utils.toWei("1")
            ),
            "Token is not in the DEX yet."
        );
    });

    it("Should not withdraw with low balance", async () => {
        const amount = web3.utils.toWei("100");

        await dex.deposit(amount, DAI, {from: trader1});

        await expectRevert(
            dex.withdraw(
                trader1, 
                DAI, 
                web3.utils.toWei("1000")
            ),
            "Balance is too low"
        );
    });
});