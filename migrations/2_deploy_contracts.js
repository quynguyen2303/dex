const Dai = artifacts.require("tokens/Dai.sol");
const Bat = artifacts.require("tokens/Bat.sol");
const Rep = artifacts.require("tokens/Rep.sol");
const Zrx = artifacts.require("tokens/Zrx.sol");
const Dex = artifacts.require("Dex.sol");

const [DAI, BAT, REP, ZRX] = ["DAI", "BAT", "REP", "ZRX"].
    map(ticker => web3.utils.fromAscii(ticker));

// deploy function
module.exports = async function(deployer, _network, accounts) {
    
    const [trader1, trader2, trader3, trader4, _] = accounts;
    
    await Promise.all(
        [Dai, Bat, Rep, Zrx, Dex].map(contract => deployer.deploy(contract))
    );

    const [dai, bat, rep, zrx, dex] = await Promise.all(
        [Dai, Bat, Rep, Zrx, Dex].map(contract => contract.deployed())
    ); 

    await Promise.all([
        dex.addToken(DAI,dai.address),
        dex.addToken(BAT,bat.address),
        dex.addToken(REP,rep.address),
        dex.addToken(ZRX,zrx.address)
    ]);

    // init seed token balance for testing
    const amount = web3.utils.toWei("1000");
    const seedTokenBalance = async (token, owner) => {
        await token.faucet(owner, amount)
        await token.approve(
            dex.address,
            amount,
            {from: owner}
        );

        const ticker = await token.symbol();
        // console.log(web3.utils.fromAscii(ticker));
        await dex.deposit(
            web3.utils.fromAscii(ticker),
            amount,
            {from: owner}
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
    await Promise.all(
        [dai, bat, rep, zrx].map(
            token => seedTokenBalance(token, trader3))
    );
    await Promise.all(
        [dai, bat, rep, zrx].map(
            token => seedTokenBalance(token, trader4))
    );

};