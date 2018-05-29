const Web3 = require("web3")
const BondingManagerABI = require("./abi/BondingManager.json")
const RoundsManagerABI = require("./abi/RoundsManager.json")
const prompt = require("prompt-sync")()
const { promisify } = require("util")
const fs = require("fs")

const main = async () => {
    const startRound = prompt("Start round: ")
    const endRound = prompt("End round: ")

    const provider = new Web3.providers.WebsocketProvider("ws://localhost:8546")
    const web3 = new Web3()
    web3.setProvider(provider)

    const roundsManagerAddr = "0x3984fc4ceeef1739135476f625d36d6c35c40dc3"
    const roundsManager = new web3.eth.Contract(RoundsManagerABI, roundsManagerAddr)

    const bondingManagerAddr = "0x511bc4556d823ae99630ae8de28b9b80df90ea2e"
    const bondingManager = new web3.eth.Contract(BondingManagerABI, bondingManagerAddr)

    const roundLength = parseInt(await roundsManager.methods.roundLength().call())
    const startBlock = startRound * roundLength
    const endBlock = (endRound * roundLength) + roundLength

    const pastEvents = await bondingManager.getPastEvents("Reward", {
        fromBlock: startBlock,
        toBlock: endBlock
    })

    const numCalls = pastEvents.length
    const expCalls = 10 * 7

    const perc = (numCalls / expCalls) * 100
    console.log(`${numCalls} reward calls made out of ${expCalls} expected calls`)
    console.log(`${perc.toFixed(2)}% of reward calls made`)
}

main()