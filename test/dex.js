const { expectRevert } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const Dai = artifacts.require("tokens/Dai.sol");
const Bat = artifacts.require("tokens/Bat.sol");
const Rep = artifacts.require("tokens/Rep.sol");
const Zrx = artifacts.require("tokens/Zrx.sol");
const Dex = artifacts.require("Dex.sol");

const SIDE = {
    BUY:0,
    SELL:1
}

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
        await dex.deposit(DAI,amount, {from: trader1});
        const balance = await dex.traderBalances(trader1, DAI);
    
        assert(amount == balance.toString());
    });
    
    it("Should NOT deposit the token not in the exchange yet.", async () => {
        await expectRevert(
            dex.deposit(
                                web3.utils.fromAscii("FAKE-TOKEN"),
                web3.utils.toWei("1"),
                {from: trader1}
            ),
            "Token is not in the DEX yet."
        );
    });

    it("Test get balance", async () => {
        const amount = web3.utils.toWei("10");

        await dex.deposit( DAI, amount, {from: trader1});
        
        let balance = await dai.balanceOf(dai.address);
        let dexBlance = await dai.balanceOf(dex.address);

        console.log("deposited addess: " + dai.address);
        // let balance = await web3.eth.getBalance(dai.address);
        console.log(balance.toString());
        console.log(dexBlance.toString());
    });

    // Test the withdraw() functioneth
    it("Should withdraw token", async () => {
        const amount = web3.utils.toWei("10");
        // const withdrawAmount = web3.utils.toWei("5");

        await dex.deposit( DAI,amount, {from: trader1});

        // const balanceDex = await dex.tokens

        await dex.withdraw(DAI, amount, {from: trader1});

        const [balanceDex, balanceTrader] = await Promise.all([
            dex.traderBalances(trader1, DAI),
            dai.balanceOf(trader1)
        ]);

        // const balanceTrader = await dai.balanceOf(trader1);

        assert(balanceDex.isZero());
        assert(balanceTrader.toString() === web3.utils.toWei("1000"));
    });

    it('should withdraw tokens', async () => {
        const amount = web3.utils.toWei('100');
    
        await dex.deposit(
            DAI,
          amount,
          {from: trader1}
        );
    
        await dex.withdraw(
          DAI,
          amount,
          {from: trader1}
        );
    
        const [balanceDex, balanceDai] = await Promise.all([
          dex.traderBalances(trader1, DAI),
          dai.balanceOf(trader1)
        ]);
        assert(balanceDex.isZero());
        assert(balanceDai.toString() === web3.utils.toWei('1000')); 
      });

    it("Should not withdraw an unexists token", async () => {
        await expectRevert(
            dex.withdraw(
                web3.utils.fromAscii("FAKE-TOKEN"), 
                web3.utils.toWei("1"),
                {from: trader1}
            ),
            "Token is not in the DEX yet."
        );
    });

    it("Should not withdraw with low balance", async () => {
        const amount = web3.utils.toWei("100", "wei");

        await dex.deposit( DAI,amount, {from: trader1});
        // console.log(await dai.balanceOf("0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4").toString())
        // var transfer = dai.transfer();
        // transfer.get();
        
        await expectRevert(
            dex.withdraw(
                DAI, 
                web3.utils.toWei("1000"),
                {from: trader1}
            ),
            "Balance is too low"
        );
    });

    // Test for createLimitOrder
    // Happy paths
    it("Should create a limit order", async () => {
        await dex.deposit(
            DAI,
            web3.utils.toWei("1000"),
            {from: trader1}
        );

        await dex.createLimitOrder(
            REP,
            web3.utils.toWei("10"),
            10,
            SIDE.BUY,
            {from: trader1}
        );
        
        const buyOrders = await dex.getOrders(REP, 0);
        const sellOrders = await dex.getOrders(REP, 1);

        // console.log(typeof(buyOrders[0].amount));
        // console.log(buyOrders[0].ticker);
        
        assert(buyOrders.length == 1);
        assert(sellOrders.length == 0);
        assert(buyOrders[0].price == 10);
        assert(buyOrders[0].amount == web3.utils.toWei("10"));
        assert(buyOrders[0].ticker == web3.utils.padRight(REP, 64));

    });
    // Unhappy paths
    it("Should NOT create a limit order for not existed token", async () => {
        await expectRevert( 
            dex.createLimitOrder(
                web3.utils.fromAscii("FAKE-TOKEN"),
                web3.utils.toWei("10"),
                10,
                SIDE.SELL,
                {from: trader2}
            ),
            "Token is not in the DEX yet."
        );
    });

    it("Should NOT create a limit order for DAI token", async () => {
        await expectRevert(
            dex.createLimitOrder(
                DAI,
                web3.utils.toWei("10"),
                10,
                SIDE.BUY,
                {from: trader2}
            ),
            "Cannot trade DAI."
        );
    });

    it("Should NOT create a sell limit order when token amount is not enough", async () => {
        await dex.deposit(
            REP,
            web3.utils.toWei("10"),
            {from: trader1}
        );

        await expectRevert(
            dex.createLimitOrder(
                REP,
                web3.utils.toWei("100"),
                10,
                SIDE.SELL,
                {from: trader1}
            ),
            "Not enough token"
        );
    });

    it.only("Should NOT create a buy limit order if DAI amount is not enough", async () => {
        await expectRevert(
            dex.createLimitOrder(
                REP,
                web3.utils.toWei("10"),
                10,
                SIDE.BUY,
                {from: trader1}
            ),
            "Not enough DAI"
        );
    });
});