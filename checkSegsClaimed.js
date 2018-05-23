const Web3 = require("web3")
const RoundsManagerABI = require("./abi/RoundsManager.json")
const JobsManagerABI = require("./abi/JobsManager.json")
const prompt = require("prompt-sync")()
const promisify = require("util")
const fs = require("fs")

const main = async () => {
    const startRound = prompt("Start round: ")
    const endRound = prompt("End round: ")

    const provider = new Web3.providers.WebsocketProvider("ws://localhost:8546")
    const web3 = new Web3()
    web3.setProvider(provider)

    const roundsManagerAddr = "0x3984fc4ceeef1739135476f625d36d6c35c40dc3"
    const roundsManager = new web3.eth.Contract(RoundsManagerABI, roundsManagerAddr)

    const jobsManagerAddr = "0xbf07ff45f14c9ff0571b9fbdc7e2b62d29931224"
    const jobsManager = new web3.eth.Contract(JobsManagerABI, jobsManagerAddr)

    const roundLength = parseInt(await roundsManager.methods.roundLength().call())
    const startBlock = startRound * roundLength
    const endBlock = (endRound * roundLength) + roundLength

    const pastEvents = await jobsManager.getPastEvents("NewClaim", {
        fromBlock: startBlock,
        toBlock: endBlock
    })

    let totalSegs = 0

    for (let e of pastEvents) {
        const jobID = e.returnValues.jobId
        const claimID = e.returnValues.claimId
        const segRange = (await jobsManager.methods.getClaim(jobID, claimID).call()).segmentRange
        const numSegs = parseInt(segRange[1]) - parseInt(segRange[0]) + 1

        totalSegs += numSegs
    }

    console.log(`${totalSegs} segments claimed`)
}

main()