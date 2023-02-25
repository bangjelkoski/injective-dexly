import { defineStore } from "pinia";
import {
  MsgCreateSpotLimitOrder,
  Address,
  PriceLevel,
  SpotMarket,
  spotPriceToChainPriceToFixed,
  spotQuantityToChainQuantityToFixed,
} from "@injectivelabs/sdk-ts";
import {
  createAndBroadcastTransaction,
  indexerGrpcSpotApi,
} from "@/app/Services";
import { useWalletStore } from "./wallet";
import { OrderType } from "@/app/types";

type ExchangeStoreState = {
  orderbook: { buys: PriceLevel[]; sells: PriceLevel[] };
  markets: SpotMarket[];
};

const initialStateFactory = (): ExchangeStoreState => ({
  orderbook: { buys: [], sells: [] },
  markets: [],
});

export const useExchangeStore = defineStore("exchange", {
  state: (): ExchangeStoreState => initialStateFactory(),
  getters: {
    injUsdtSpotMarket: (state) => {
      return state.markets.find(
        (market) => market.baseDenom.toLowerCase() === "inj"
      );
    },
  },
  actions: {
    async fetchMarkets() {
      const exchangeStore = useExchangeStore();

      const markets = await indexerGrpcSpotApi.fetchMarkets({
        marketStatus: "active",
        baseDenom: "inj",
        quoteDenom:
          "peggy0xdAC17F958D2ee523a2206206994597C13D831ec7" /** USDT denom */,
      });

      exchangeStore.$patch({
        markets,
      });
    },

    async fetchOrderbook() {
      const exchangeStore = useExchangeStore();

      if (!exchangeStore.injUsdtSpotMarket) {
        await exchangeStore.fetchMarkets();
      }

      const orderbook = await indexerGrpcSpotApi.fetchOrderbook(
        exchangeStore.injUsdtSpotMarket!.marketId
      );

      exchangeStore.$patch({
        orderbook,
      });
    },

    async createLimitOrder({
      price,
      amount,
      orderType,
    }: {
      price: string;
      orderType: OrderType;
      amount: string;
    }) {
      const exchangeStore = useExchangeStore();
      const walletStore = useWalletStore();

      if (!walletStore.isUserWalletConnected) {
        return;
      }

      if (!exchangeStore.injUsdtSpotMarket) {
        await exchangeStore.fetchMarkets();
      }

      const subaccountId = Address.fromBech32(
        walletStore.address
      ).getSubaccountId();

      const message = MsgCreateSpotLimitOrder.fromJSON({
        injectiveAddress: walletStore.address,
        marketId: exchangeStore.injUsdtSpotMarket!.marketId,
        feeRecipient: walletStore.address,
        subaccountId: subaccountId,
        price: spotPriceToChainPriceToFixed({
          value: price,
          baseDecimals: 18,
          quoteDecimals: 6,
        }),
        quantity: spotQuantityToChainQuantityToFixed({
          value: amount,
          baseDecimals: 18,
        }),
        orderType: orderType,
      });

      await createAndBroadcastTransaction({
        address: walletStore.address,
        message,
      });
    },
  },
});
