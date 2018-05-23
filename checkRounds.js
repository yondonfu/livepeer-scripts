const Web3 = require("web3")
const RoundsManagerABI = require("./abi/RoundsManager.json")
const prompt = require("prompt-sync")()

const main = async () => {
    const startRound = prompt("Start round: ")
    const endRound = prompt("End round: ")

    const provider = new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws")
    const web3 = new Web3()
    web3.setProvider(provider)

    const roundsManagerAddr = "0x3984fc4ceeef1739135476f625d36d6c35c40dc3"
    const roundsManager = new web3.eth.Contract(RoundsManagerABI, roundsManagerAddr)

    const roundLength = parseInt(await roundsManager.methods.roundLength().call())
    const startBlock = startRound * roundLength
    const endBlock = (endRound * roundLength) + roundLength

    const pastEvents = await roundsManager.getPastEvents("NewRound", {
        filter: { from: roundsManagerAddr },
        fromBlock: startBlock,
        toBlock: endBlock
    })

    let totalRounds = endRound - startRound + 1
    let belowThreshold = 0

    pastEvents.forEach(e => {
        const round = e.returnValues.round
        const roundStartBlock = round * roundLength
        const roundInitBlock = e.blockNumber
        const blocksToInit = roundInitBlock - roundStartBlock

        if (blocksToInit <= 40) {
            belowThreshold++
        }

        console.log(`Round ${round} initialized ${blocksToInit} blocks after its start`)
    })

    console.log(`${belowThreshold} rounds out of ${totalRounds} initialized within 40 blocks of start`)

    const perc = (belowThreshold / totalRounds) * 100
    console.log(`${perc.toFixed(2)}% of rounds initialized within 40 blocks of start`)
}

main()