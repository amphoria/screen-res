import { StakeWiseSDK, Network } from '@stakewise/v3-sdk'
import {ethers} from "ethers";

const sdk = new StakeWiseSDK({ network: Network.Mainnet })

const inputEl = document.getElementById("input-el")
const updateBtn = document.getElementById("update-btn")
const saveBtn = document.getElementById("save-btn")
const stakewiseBal = document.getElementById("stakewise-bal")
const genesisOSETHBal = document.getElementById("genesis-oseth-bal")
const chorusOneBal = document.getElementById("chorus-one-bal")
const chorusOneOSETHBal = document.getElementById("chorus-one-oseth-bal")
const walletOSETHBal = document.getElementById("wallet-oseth-bal")
const eigenlayerOETHBal = document.getElementById("eigenlayer-oeth-bal")
const stablfiBal = document.getElementById("stablfi-bal")

// Contract addresses and ABIs
const genesisAddress = "0xac0f906e433d58fa868f936e8a43230473652885"
const chorusOneAddress = "0xe6d8d8aC54461b1C5eD15740EEe322043F696C08"
const stakewiseABI = 
[
    // Some details about the contract
    "function vaultId() view returns (bytes32)",
    "function version() view returns (uint8)",
    // Functions to get vault balance for a wallet
    "function getShares(address) view returns (uint256)",
    "function convertToAssets(uint256) view returns (uint256)",
    // Function to get minted osETH shares for a user
    "function osTokenPositions(address) view returns (uint256)" 
]

// osETH Contract
const osETHAddress = "0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38"
const osETHABI = 
[
    // Some details about the contract
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    // Function to get balance of address
    "function balanceOf(address) view returns (uint256)"
]

// EigenLayer OETH pool
const eigenlayerPoolAddress = "0xa4C637e0F704745D182e4D38cAb7E7485321d059"
const eigenlayerABI = 
[
    // Functions to get pool balance for a wallet
    "function shares(address) view returns (uint256)",
    "function sharesToUnderlyingView(uint256) view returns (uint256)"  
]

// Stabl.fi CASH token
const cashAddress = "0x5d066d022ede10efa2717ed3d79f22f949f8c175"
const cashABI =
[
    // Some details about the contract
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    // Function to get balance of address
    "function balanceOf(address) view returns (uint256)"
]

// Ethers provider objects
const ethProvider = 
    new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/ca1b1cda8d6940e6af90ec7b1b8cf84d")
const polProvider = 
    new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/ca1b1cda8d6940e6af90ec7b1b8cf84d")

// Ethers contract objects
const genesisContract = new ethers.Contract(genesisAddress, stakewiseABI, ethProvider)
const chorusOneContract = new ethers.Contract(chorusOneAddress, stakewiseABI, ethProvider)
const osethContract = new ethers.Contract(osETHAddress, osETHABI, ethProvider)
const eigenlayerPoolContract = new ethers.Contract(eigenlayerPoolAddress, 
                                                    eigenlayerABI, ethProvider)
const cashContract = new ethers.Contract(cashAddress, cashABI, polProvider)

// Default wallet address
const cookie = getCookie("defaultAddress")
if (cookie != "") {
    const defaultAddress = cookie.split('=')
    inputEl.value = defaultAddress[1]
} 

updateBtn.addEventListener("click", getBalances)
saveBtn.addEventListener("click", saveAddress)

async function getOsethPosition(userAddr, vaultAddr) {
    let output

    output = await sdk.osToken.getBaseData()
    const thresholdPercent = output.thresholdPercent

    output = await sdk.vault.getStakeBalance({
        userAddress: userAddr,
        vaultAddress: vaultAddr
    })
    const stakeBalance = output.assets

    output = await sdk.osToken.getPosition({
        userAddress: userAddr,
        vaultAddress: vaultAddr,
        stakedAssets: stakeBalance,
        thresholdPercent: thresholdPercent
   })
   return output
}

async function getBalances () {
    let shares
    let assets
    let balanceWei
    let balanceEth
    let output

    
    output = await sdk.vault.getStakeBalance({
        userAddress: inputEl.value,
        vaultAddress: genesisAddress
    })
    balanceEth = ethers.formatEther(output.assets)
    stakewiseBal.textContent = balanceEth

    shares = await genesisContract.osTokenPositions(inputEl.value)
    balanceEth = ethers.formatEther(shares)
    genesisOSETHBal.textContent = balanceEth

    // console.log((await getOsethPosition(inputEl.value, genesisAddress)).minted.shares)

    output = await sdk.vault.getStakeBalance({
        userAddress: inputEl.value,
        vaultAddress: chorusOneAddress
    })
    balanceEth = ethers.formatEther(output.assets)
    chorusOneBal.textContent = balanceEth

    shares = await chorusOneContract.osTokenPositions(inputEl.value)
    balanceEth = ethers.formatEther(shares)
    chorusOneOSETHBal.textContent = balanceEth

    balanceWei = await osethContract.balanceOf(inputEl.value)
    balanceEth = ethers.formatEther(balanceWei)
    walletOSETHBal.textContent = balanceEth

    shares = await eigenlayerPoolContract.shares(inputEl.value)
    assets = await eigenlayerPoolContract.sharesToUnderlyingView(shares)
    balanceEth = ethers.formatEther(assets)
    eigenlayerOETHBal.textContent = balanceEth

    balanceWei = await cashContract.balanceOf(inputEl.value)
    balanceEth = ethers.formatEther(balanceWei)
    stablfiBal.textContent = balanceEth
}

function saveAddress() {
    if (inputEl.value != "") {
        document.cookie = "defaultAddress=" + inputEl.value
    } else {
        console.log("No address entered")
    }
}

function getCookie(caddr) {
    let address = caddr + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(address) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


