import { defineStore } from "pinia";
import { getEthereumAddress } from "@injectivelabs/sdk-ts";
import {
  NETWORK,
  web3Client,
  web3Composer,
  broadcastWeb3Transaction,
} from "@/app/Services";
import { useWalletStore } from "./wallet";
import { awaitForAll, BigNumberInBase } from "@injectivelabs/utils";
import { fetchGasPrice } from "@injectivelabs/sdk-ui-ts";

export const USDT_ERC20_CONTRACT_ADDRESS =
  "0xdac17f958d2ee523a2206206994597c13d831ec7";
export const INJ_ERC20_CONTRACT_ADDRESS =
  "0xe28b3b32b6c345a34ff64674606124dd5aceca30";

type BridgeStoreState = {
  erc20Balances: Array<{
    contractAddress: string;
    balance: string;
    allowance: string;
  }>;
};

const initialStateFactory = (): BridgeStoreState => ({
  erc20Balances: [],
});

export const useBridgeStore = defineStore("bridge", {
  state: (): BridgeStoreState => initialStateFactory(),
  actions: {
    async fetchErc20Balances() {
      const bridgeStore = useBridgeStore();
      const walletStore = useWalletStore();

      const ethereumAddress = getEthereumAddress(walletStore.address);
      const contractAddresses = [
        INJ_ERC20_CONTRACT_ADDRESS,
        USDT_ERC20_CONTRACT_ADDRESS,
      ];

      const tokenBalance = await awaitForAll(
        contractAddresses,
        async (contractAddress) =>
          await web3Client.fetchTokenBalanceAndAllowance({
            address: ethereumAddress,
            contractAddress,
          })
      );

      bridgeStore.$patch({
        erc20Balances: tokenBalance.map((balance, index) => {
          return {
            ...balance,
            contractAddress: contractAddresses[index],
          };
        }),
      });
    },

    async transferToInjective({
      amount,
      contractAddress,
    }: {
      contractAddress: string;
      amount: string;
    }) {
      const { address, isUserWalletConnected } = useWalletStore();

      if (!address || !isUserWalletConnected) {
        return;
      }

      const gasPrice = await fetchGasPrice(NETWORK, {
        alchemyKey: import.meta.env.VITE_ALCHEMY_KEY as string,
      });
      const isUsdt = contractAddress === INJ_ERC20_CONTRACT_ADDRESS;
      const ethereumAddress = getEthereumAddress(address);
      const actualAmount = new BigNumberInBase(
        new BigNumberInBase(amount).toFixed(3, BigNumberInBase.ROUND_DOWN)
      )
        .toWei(isUsdt ? 6 : 18 /** USDT has 6 and INJ has 18 decimals */)
        .toFixed();

      const tx = await web3Composer.getPeggyTransferTx({
        gasPrice,
        address: ethereumAddress,
        denom: contractAddress,
        amount: actualAmount,
        destinationAddress: ethereumAddress,
      });

      await broadcastWeb3Transaction(tx);
    },
  },
});
