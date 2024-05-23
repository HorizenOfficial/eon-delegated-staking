# Delegated Staking Smart Contracts
The smart contracts in this repo serve as a reference implementation for forgers to allow delegators to claim their staking rewards. Forgers have the ability to use their own smart contract to distribute rewards; however, the smart contract in this repository serves as a reference implementation for forgers to use. This feature is part of the EON 1.4 release and was voted for in [ZenIP-42404](https://snapshot.org/#/horizenfoundationtechnical.eth/proposal/0x5f58eed0a9775283e2f668f2721d78cc6ee0289e9bcd77a4e74b81451bf75a49).

## Contracts
### `DelegatedStaking`

Intented to be used by delegators to claim their staking rewards. Leverages the ForgerStakesV2 native smart contract to query forger information such as total amount staked by a delegator, and total rewards received by a forger.

| Method | Description |
| ------------- | ------------- |
| `calcReward(address owner)`  | Calculates the reward amount `owner` is eligible to receive |
| `claimReward(address payable owner)`  | Calculates the reward amount `owner` is eligible to recieve, and then sends those funds to `owner` |

### `DelegatedStakingFactory`

Used by a forger to deploy an instance of the `DelegatedStaking` contract, which delegators who have staked to this forger can use to claim their staking rewards. Only one `DelegatedStaking` contract can be deployed per forger. Forger's are uniquely identified by their signed public key and VRF.

| Method | Description |
| ------------- | ------------- |
| `deployDelegatedStakingReferenceImplementation(bytes32 signPubKey, bytes32 vrf1, bytes1 vrf2)`  | Deploys a `DelegatedStaking` contract for the forger, identified by `signPubKey`, `vrf1`, and `vrf2` |

## Audit
***TODO*** include audit report here when completed.

## References
- [ZenIP-42404](https://snapshot.org/#/horizenfoundationtechnical.eth/proposal/0x5f58eed0a9775283e2f668f2721d78cc6ee0289e9bcd77a4e74b81451bf75a49)
- [Idea Discussion](https://horizen.discourse.group/t/new-zenip-delegated-staking-on-eon/492)

# Hardhat

This project was built using Hardhat

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
```
