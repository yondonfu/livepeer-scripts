const Web3 = require("web3")
const prompt = require("prompt-sync")()
const BigNumber = require("bignumber.js")

const RoundsManagerABI = require("./abi/RoundsManager.json")
const BondingManagerABI = require("./abi/BondingManager.json")
const TokenABI = require("./abi/LivepeerToken.json")
const MinterABI = require("./abi/Minter.json")

const main = async () => {
    const provider = new Web3.providers.HttpProvider("https://mainnet.infura.io")
    const web3 = new Web3()
    web3.setProvider(provider)

    const roundsManager = new web3.eth.Contract(RoundsManagerABI, "0x3984fc4ceeef1739135476f625d36d6c35c40dc3")
    const bondingManager = new web3.eth.Contract(BondingManagerABI, "0x511bc4556d823ae99630ae8de28b9b80df90ea2e")
    const token = new web3.eth.Contract(TokenABI, "0x58b6a8a3302369daec383334672404ee733ab239")
    const minter = new web3.eth.Contract(MinterABI, "0x8573f2f5a3bd960eee3d998473e50c75cdbe6828")

    console.log("GENERAL INFO")
    console.log("---------------")

    const currentRound = await roundsManager.methods.currentRound().call()
    console.log(`Current Round: ${currentRound}`)

    const infl = await minter.methods.inflation().call()
    console.log(`Current Round Inflation: ${infl}`)

    const inflChange = await minter.methods.inflationChange().call()
    console.log(`Inflation Change Per Round: ${inflChange} out of 1000000`)

    const nrInfl = new BigNumber(infl).plus(new BigNumber(inflChange))
    console.log(`Projected Next Round Inflation: ${nrInfl} out of 1000000`)

    const currSupply = new BigNumber(await token.methods.totalSupply().call())
    console.log(`Total Supply: ${currSupply.div(10 ** 18)} LPT`)

    const newTokens = currSupply.times(nrInfl).idiv(1000000)
    console.log(`Projected New Tokens Next Round: ${newTokens.div(10 ** 18)} LPT`)

    console.log("\n")

    const myAddress = prompt("Enter your address: ")
    const dInfo = await bondingManager.methods.getDelegator(myAddress).call()
    const myBond = new BigNumber(await bondingManager.methods.pendingStake(myAddress, currentRound).call())
    console.log(`My Current Bonded Amount (Includes Pending Rewards): ${myBond.div(10 ** 18)} LPT`)

    const myDelegate = dInfo.delegateAddress
    console.log(`My Current Delegate: ${myDelegate}`)

    console.log("\n")

    const amount = new BigNumber(prompt("Enter an additional amount to bond: "))

    console.log(`Total Bonding Power: ${myBond.plus(amount).div(10 ** 18)} LPT`)

    console.log("\n")

    console.log("TRANSCODERS")
    console.log("---------------")

    let transcoders = []

    let curr = await bondingManager.methods.getFirstTranscoderInPool().call()

    while (curr !== "0x0000000000000000000000000000000000000000") {
        const totalStake = new BigNumber(await bondingManager.methods.transcoderTotalStake(curr).call())
        const delegatorsRCut = new BigNumber(1000000).minus((await bondingManager.methods.getTranscoder(curr).call()).pendingRewardCut)

        transcoders.push({
            address: curr,
            totalStake: totalStake,
            delegatorsRCut: delegatorsRCut
        })

        curr = await bondingManager.methods.getNextTranscoderInPool(curr).call()
    }

    const numActiveTranscoders = await bondingManager.methods.numActiveTranscoders().call()
    const activeStake = transcoders.slice(0, parseInt(numActiveTranscoders)).reduce((acc, val) => {
        return acc.plus(val.totalStake)
    }, new BigNumber(0)).plus(amount)


    console.log(`Total Active Stake For Next Round: ${activeStake.div(10 ** 18)} LPT`)

    console.log("\n")

    transcoders.forEach(t => {
        let projStake

        if (myDelegate === t.address) {
            console.log(`${t.address} (I am currently delegated to this transcoder!)`)

            projStake = t.totalStake.plus(amount)
        } else {
            console.log(t.address)

            projStake = t.totalStake.plus(myBond).plus(amount)
        }

        console.log(`Current Total Stake: ${t.totalStake.idiv(10 ** 18)} LPT`)
        console.log(`Reward Cut For Delegators: ${t.delegatorsRCut} out of 1000000`)

        console.log(`If I bond to this transcoder, its total stake next round will be ${projStake.div(10 ** 18)} LPT`)

        const tTokens = newTokens.times(projStake).idiv(activeStake)
        console.log(`If I bond to this transcoder, its LPT share next round will be ${tTokens.div(10 ** 18)} LPT`)

        const myShare = tTokens.times(t.delegatorsRCut).idiv(1000000).times(myBond.plus(amount)).idiv(projStake)
        console.log(`If I bond to this transcoder, my LPT share next round will be: ${myShare.div(10 ** 18)} LPT`)

        console.log("\n")
    })
}

main()
