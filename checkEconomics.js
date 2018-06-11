const Web3 = require("web3")
const BigNumber = require("bignumber.js")
const BondingManagerABI = require("./abi/BondingManager.json")
const RoundsManagerABI = require("./abi/RoundsManager.json")
const MinterABI = require("./abi/Minter.json")
const TokenABI = require("./abi/LivepeerToken.json")
const prompt = require("prompt-sync")()
const { promisify } = require("util")
const fs = require("fs")

const main = async () => {
    const provider = new Web3.providers.HttpProvider("https://mainnet.infura.io")
    const web3 = new Web3()
    web3.setProvider(provider)

    const bondingManagerAddr = "0x511bc4556d823ae99630ae8de28b9b80df90ea2e"
    const bondingManager = new web3.eth.Contract(BondingManagerABI, bondingManagerAddr)

    const minterAddr = "0x8573f2f5a3bd960eee3d998473e50c75cdbe6828"
    const minter = new web3.eth.Contract(MinterABI, minterAddr)

    const tokenAddr = "0x58b6a8a3302369daec383334672404ee733ab239"
    const token = new web3.eth.Contract(TokenABI, tokenAddr)

    const totalBonded = new BigNumber(await bondingManager.methods.getTotalBonded().call())

    console.log(`Total Bonded: ${totalBonded.div(10 ** 18)}`)

    const totalSupply = new BigNumber(await token.methods.totalSupply().call())

    console.log(`Total Supply: ${totalSupply.div(10 ** 18)}`)

    const generated = totalSupply.div(10 ** 18).minus(10000000)

    console.log(`Total Generated: ${generated}`)

    const participationRate = totalBonded.div(totalSupply)

    console.log(`Participation Rate: ${participationRate * 100}%`)

    const currentMintable = new BigNumber(await minter.methods.currentMintableTokens().call())
    
    console.log(`Current Mintable Tokens: ${currentMintable.div(10 ** 18)}`)

    const inflation = parseInt(await minter.methods.inflation().call())

    console.log(`Inflation: ${(inflation / 1000000) * 100}%`)

    const inflationChange = parseInt(await minter.methods.inflationChange().call())

    console.log(`Inflation Change: ${(inflationChange / 1000000) * 100}%`)
}

main()
