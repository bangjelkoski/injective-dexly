import { defineStore } from "pinia";
import {
  ErrorType,
  MetamaskException,
  UnspecifiedErrorCode,
} from "@injectivelabs/exceptions";
import { Coin, getInjectiveAddress, MsgSend } from "@injectivelabs/sdk-ts";
import {
  chainGrpcBankApi,
  createAndBroadcastTransaction,
} from "@/app/Services";
import { BigNumberInBase } from "@injectivelabs/utils";

type WalletStoreState = {
  address: string;
  balances: Coin[];
};

const initialStateFactory = (): WalletStoreState => ({
  address: "",
  balances: [],
});

export const useWalletStore = defineStore("wallet", {
  state: (): WalletStoreState => initialStateFactory(),
  getters: {
    isUserWalletConnected: (state) => {
      return !!state.address;
    },
  },
  actions: {
    async connect() {
      const walletStore = useWalletStore();
      const ethereum = (window as any).ethereum;

      if (!ethereum) {
        throw new MetamaskException(new Error("Metamask is not installed"));
      }

      try {
        const ethereumAccounts = await ethereum.request({
          method: "eth_requestAccounts",
        });

        const [ethereumAddress] = ethereumAccounts;
        const address = getInjectiveAddress(ethereumAddress);

        walletStore.$patch({
          address,
        });
      } catch (e: unknown) {
        throw new MetamaskException(new Error((e as any).message), {
          code: UnspecifiedErrorCode,
          type: ErrorType.WalletError,
        });
      }
    },

    async fetchBalances() {
      const walletStore = useWalletStore();

      if (!walletStore.isUserWalletConnected) {
        return;
      }

      try {
        const { balances } = await chainGrpcBankApi.fetchBalances(
          walletStore.address
        );

        walletStore.$patch({
          balances,
        });
      } catch (e: unknown) {
        throw new MetamaskException(new Error((e as any).message), {
          code: UnspecifiedErrorCode,
          type: ErrorType.WalletError,
        });
      }
    },

    async transfer({
      amount,
      destination,
    }: {
      amount: string;
      destination: string;
    }) {
      const walletStore = useWalletStore();

      if (!walletStore.isUserWalletConnected) {
        return;
      }

      const message = MsgSend.fromJSON({
        srcInjectiveAddress: walletStore.address,
        dstInjectiveAddress: destination,
        amount: {
          denom: "inj",
          amount: new BigNumberInBase(amount).toWei().toFixed(),
        },
      });

      await createAndBroadcastTransaction({
        address: walletStore.address,
        message,
      });
    },
  },
});
