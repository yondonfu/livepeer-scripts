const Web3 = require("web3")
const BondingManagerABI = require("./abi/BondingManager.json")
const RoundsManagerABI = require("./abi/RoundsManager.json")
const BigNumber = require("bignumber.js")
const prompt = require("prompt-sync")()

const main = async () => {
    const startRound = parseInt(prompt("Start round: "))

    const provider = new Web3.providers.HttpProvider("https://mainnet.infura.io")
    const web3 = new Web3()
    web3.setProvider(provider)

    const roundsManagerAddr = "0x3984fc4ceeef1739135476f625d36d6c35c40dc3"
    const roundsManager = new web3.eth.Contract(RoundsManagerABI, roundsManagerAddr)

    const bondingManagerAddr = "0x511bc4556d823ae99630ae8de28b9b80df90ea2e"
    const bondingManager = new web3.eth.Contract(BondingManagerABI, bondingManagerAddr)

    const poolSize = parseInt(await bondingManager.methods.getTranscoderPoolSize().call())

    let pool = []
    let num = 0
    let currentTranscoder

    while (num < poolSize) {
        if (num == 0) {
            currentTranscoder = await bondingManager.methods.getFirstTranscoderInPool().call()
        } else {
            currentTranscoder = await bondingManager.methods.getNextTranscoderInPool(currentTranscoder).call()
        }

        num++

        pool.push(currentTranscoder)
    }

    console.log(pool)
    console.log(`Size of pool: ${pool.length}`)

    const currentRound = parseInt(await roundsManager.methods.currentRound().call())

    // Map round numbers to array of transcoders that did not call reward that round
    let missingRewards = {}

    for (let i = startRound; i < currentRound; i++) {
        for (let transcoder of pool) {
            const earningsPool = await bondingManager.methods.getTranscoderEarningsPoolForRound(transcoder, i).call()
            const rewards = new BigNumber(earningsPool.rewardPool)
            const totalStake = new BigNumber(earningsPool.totalStake)

            if (rewards.comparedTo(0) == 0 && totalStake.comparedTo(0) == 1) {
                if (i in missingRewards) {
                    missingRewards[i].push(transcoder)
                } else {
                    missingRewards[i] = [transcoder]
                }
            }
        }
    }

    console.log(missingRewards)
}

main()