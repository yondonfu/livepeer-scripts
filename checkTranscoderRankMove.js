const Web3 = require("web3")
const BondingManagerABI = require("./abi/BondingManager.json")
const BigNumber = require("bignumber.js")
const prompt = require("prompt-sync")()

const main = async () => {
    const startRound = parseInt(prompt("Start round: "))
    const endRound = parseInt(prompt("End round: "))
    const transcoder = prompt("Transcoder address: ")

    const provider = new Web3.providers.HttpProvider("https://mainnet.infura.io")
    const web3 = new Web3()
    web3.setProvider(provider)

    const bondingManagerAddr = "0x511bc4556d823ae99630ae8de28b9b80df90ea2e"
    const bondingManager = new web3.eth.Contract(BondingManagerABI, bondingManagerAddr)

    for (let i = startRound; i <= endRound; i++) {
        const totalStake = new BigNumber((await bondingManager.methods.getTranscoderEarningsPoolForRound(transcoder, i).call()).totalStake)

        console.log(`Round ${i} stake: ${totalStake.div(10 ** 18)}`)

        const prevStake = new BigNumber((await bondingManager.methods.getTranscoderEarningsPoolForRound(transcoder, i - 1).call()).totalStake)
        const stakeDiff = totalStake.minus(prevStake).abs()

        if (totalStake.comparedTo(prevStake) == -1) {
            console.log(`Stake decreased from previous round by ${stakeDiff.div(10 ** 18)}`)
        } else if (totalStake.comparedTo(prevStake) == 1) {
            console.log(`Stake increased from previous round by ${stakeDiff.div(10 ** 18)}`)
        } else {
            console.log("Stake remained the same from previous round")
        }
    }
}

main()