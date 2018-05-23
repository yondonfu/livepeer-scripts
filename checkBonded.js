const Web3 = require("web3")
const BondingManagerABI = require("./abi/BondingManager.json")
const RoundsManagerABI = require("./abi/RoundsManager.json")
const prompt = require("prompt-sync")()
const { promisify } = require("util")
const fs = require("fs")

const main = async () => {
    const startRound = prompt("Start round: ")
    const endRound = prompt("End round: ")

    const provider = new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws")
    const web3 = new Web3()
    web3.setProvider(provider)

    const roundsManagerAddr = "0x3984fc4ceeef1739135476f625d36d6c35c40dc3"
    const roundsManager = new web3.eth.Contract(RoundsManagerABI, roundsManagerAddr)

    const bondingManagerAddr = "0x511bc4556d823ae99630ae8de28b9b80df90ea2e"
    const bondingManager = new web3.eth.Contract(BondingManagerABI, bondingManagerAddr)

    const roundLength = parseInt(await roundsManager.methods.roundLength().call())
    const startBlock = startRound * roundLength
    const endBlock = (endRound * roundLength) + roundLength

    const pastEvents = await bondingManager.getPastEvents("Bond", {
        fromBlock: startBlock,
        toBlock: endBlock
    })

    const data = await promisify(fs.readFile)("bonded.json")
    const bonded = JSON.parse(data)

    let newBonded = 0

    pastEvents.forEach(e => {
        const delegator = e.returnValues.delegator

        if (!(delegator in bonded)) {
            console.log(`New delegator ${delegator}`)
            bonded[delegator] = true
            newBonded++
        }
    })

    await promisify(fs.writeFile)("bonded.json", JSON.stringify(bonded, null, 2))

    console.log(`${newBonded} new bonded accounts`)
}

main()