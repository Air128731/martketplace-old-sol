/* eslint no-use-before-define: "warn" */
const fs = require('fs')
const chalk = require('chalk')
const { config, ethers } = require('hardhat')
const { utils } = require('ethers')
const R = require('ramda')

const main = async () => {
  console.log('\n\n Deploying...\n')

  const offersContract = await deploy('Offers')
  const orderContract = await deploy('Order', [offersContract.address])

  console.log('Set orderContract address', orderContract.address)
  await offersContract.setOrderContractAddress(orderContract.address)

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */

  console.log(
    'Artifacts (address, abi, and args) saved to: ',
    chalk.blue('packages/hardhat/artifacts/'),
    '\n\n',
  )
}

// ------ utils -------

const deploy = async (
  contractName,
  _args = [],
  overrides = {},
  libraries = {},
) => {
  console.log(` 🛰  Deploying: ${contractName}`)

  const contractArgs = _args || []
  const contractArtifacts = await ethers.getContractFactory(contractName, {
    libraries: libraries,
  })
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides)
  const encoded = abiEncodeArgs(deployed, contractArgs)
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address)

  console.log(
    ' 📄',
    chalk.cyan(contractName),
    'deployed to:',
    chalk.magenta(deployed.address),
  )

  if (!encoded || encoded.length <= 2) return deployed
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2))

  return deployed
}

// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, contractArgs) => {
  // not writing abi encoded args if this does not pass
  if (
    !contractArgs ||
    !deployed ||
    !R.hasPath(['interface', 'deploy'], deployed)
  ) {
    return ''
  }
  const encoded = utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs,
  )
  return encoded
}

// checks if it is a Solidity file
const isSolidity = fileName =>
  fileName.indexOf('.sol') >= 0 &&
  fileName.indexOf('.swp') < 0 &&
  fileName.indexOf('.swap') < 0

const readArgsFile = contractName => {
  let args = []
  try {
    const argsFile = `./contracts/${contractName}.args`
    if (!fs.existsSync(argsFile)) return args
    args = JSON.parse(fs.readFileSync(argsFile))
  } catch (e) {
    console.log(e)
  }
  return args
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
