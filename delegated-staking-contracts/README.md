# Delegated Staking Smart Contracts
The smart contracts in this repo serve as a reference implementation for forgers to allow delegators to claim their staking rewards. Forgers have the ability to use their own smart contract to distribute rewards; however, the smart contract in this repository serves as a reference implementation for forgers to use. This feature is part of the EON 1.4 release and was voted for in [ZenIP-42404](https://snapshot.org/#/horizenfoundationtechnical.eth/proposal/0x5f58eed0a9775283e2f668f2721d78cc6ee0289e9bcd77a4e74b81451bf75a49).

## Contracts
### `DelegatedStaking`

Intended to be used by delegators to claim their staking rewards. Leverages the `ForgerStakesV2` native smart contract to query forger information such as total amount staked by a delegator, and total rewards received by a forger.

| Method | Description |
| ------------- | ------------- |
| `calcReward(address owner)`  | Calculates the reward amount `owner` is eligible to receive |
| `claimReward(address payable owner)`  | Calculates the reward amount `owner` is eligible to recieve, and then sends those funds to `owner` |

#### Reward calculation
For a given epoch (N), a delegator's rewards is based on the total amount they have staked 2 epochs ago (N-2). The reward calculation takes this number, proportionate to the total amount staked for the same epoch (N-2). For example:
```
delegator D's reward for epoch N = (sum of all fees accrued in epoch N) * (delegator D stakes at epoch N-2) / (forger total stakes at epoch N-2)
```
A delegator can claim for multiple epochs at a time. The smart contract will compute the total rewards for all epochs for which the delegator is eligible, and has not yet claimed. To reduce gas consumption, the reward calculation will be for a configured maximum of 100 epochs.

### `DelegatedStakingFactory`

Used by a forger to deploy an instance of the `DelegatedStaking` contract, which delegators who have staked to this forger can use to claim their staking rewards. Only one `DelegatedStaking` contract can be deployed per forger. Forger's are uniquely identified by their signed public key and VRF. Once deployed, a forger can use the `ForgerStakesV2` native smart contract to call either `registerForger` for new forgers, or `updateForger` for existing forgers.

| Method | Description |
| ------------- | ------------- |
| `deployDelegatedStakingReferenceImplementation(bytes32 signPubKey, bytes32 vrf1, bytes1 vrf2)`  | Deploys a `DelegatedStaking` contract for the forger, identified by `signPubKey`, `vrf1`, and `vrf2` |

<!-- ## Audit
***TODO*** include audit report here when completed. -->

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
