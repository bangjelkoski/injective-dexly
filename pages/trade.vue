<script setup lang="ts">
import { useWalletStore } from "@/store/wallet";
import { useExchangeStore } from "@/store/exchange";
import { useIntervalFn } from "@vueuse/core";

const walletStore = useWalletStore();
const exchangeStore = useExchangeStore();

definePageMeta({
  middleware: ["connected"],
});

onMounted(() => {
  walletStore.fetchBalances().catch((error) => {
    alert(error);
  });

  exchangeStore
    .fetchMarkets()
    .then(() => {
      exchangeStore.fetchOrderbook().catch((error) => {
        alert(error);
      });
    })
    .catch((error) => {
      alert(error);
    });
});

useIntervalFn(() => {
  exchangeStore.fetchOrderbook();
}, 5 * 1000);
</script>

<template>
  <div class="py-1 px-4 w-full">
    <h2 class="text-lg mr-4">
      Your wallet address:
      <span class="font-mono">{{ walletStore.address }}</span>
    </h2>

    <div class="flex flex-wrap -mx-4">
      <div class="w-full md:w-1/3 xl:w-1/4 px-4">
        <div class="bg-gray-300 rounded-lg px-4 py-2 mt-4">
          <h3 class="text-center font-semibold">Send INJ on Injective</h3>
          <Transfer class="mt-4" />
        </div>
      </div>

      <div class="w-full md:w-2/3 xl:w-3/4 px-4">
        <div class="bg-gray-300 rounded-lg px-4 py-2 mt-4">
          <h3 class="text-center font-semibold">Trade INJ on Injective</h3>
          <Trade class="mt-4" />
        </div>
      </div>
    </div>
  </div>
</template>
