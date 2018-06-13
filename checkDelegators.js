const Web3 = require("web3")
const BondingManagerABI = require("./abi/BondingManager.json")
const RoundsManagerABI = require("./abi/RoundsManager.json")
const prompt = require("prompt-sync")()
const BigNumber = require("bignumber.js")

const main = async () => {
    const transcoder = prompt("Transcoder address: ")

    const provider = new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/_ws")
    const web3 = new Web3()
    web3.setProvider(provider)

    const roundsManagerAddr = "0x3984fc4ceeef1739135476f625d36d6c35c40dc3"
    const roundsManager = new web3.eth.Contract(RoundsManagerABI, roundsManagerAddr)

    const bondingManagerAddr = "0x511bc4556d823ae99630ae8de28b9b80df90ea2e"
    const bondingManager = new web3.eth.Contract(BondingManagerABI, bondingManagerAddr)

    const roundLength = parseInt(await roundsManager.methods.roundLength().call())

    const begRound = 955
    const begBlock = begRound * roundLength

    const currentRound = parseInt(await roundsManager.methods.currentRound().call())
    const endBlock = currentRound * roundLength

    const pastEvents = await bondingManager.getPastEvents("Bond", {
        fromBlock: begBlock,
        toBlock: endBlock
    })

    let bonded = {}
    let totalStake = new BigNumber(0)
    let totalDelegators = 0

    for (let e of pastEvents) {
        const delegatorAddr = e.returnValues.delegator

        if (!(delegatorAddr in bonded)) {
            bonded[delegatorAddr] = true

            const delegator = await bondingManager.methods.getDelegator(delegatorAddr).call()
            const delegateAddr = delegator.delegateAddress

            if (delegateAddr.toLowerCase() === transcoder.toLowerCase()) {
                const stake = new BigNumber(delegator.bondedAmount)

                let pendingStake

                if (parseInt(delegator.lastClaimRound) == currentRound) {
                    pendingStake = stake
                } else {
                    pendingStake = new BigNumber(await bondingManager.methods.pendingStake(delegatorAddr, currentRound).call())
                }

                totalDelegators++
                totalStake = totalStake.plus(pendingStake)

                console.log(`Delegator: ${delegatorAddr} Pending Stake: ${pendingStake.div(10 ** 18)} Stake: ${stake.div(10 ** 18)}`)
            }
        }
    }

    console.log(`${transcoder} has ${totalDelegators} delegators`)
}

main()