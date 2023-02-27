<script setup lang="ts">
import { useWalletStore } from "@/store/wallet";
import { useIntervalFn } from "@vueuse/core";
import { useBridgeStore } from "@/store/bridge";

const router = useRouter();
const walletStore = useWalletStore();
const bridgeStore = useBridgeStore();

definePageMeta({
  middleware: ["connected"],
});

onMounted(() => {
  bridgeStore.fetchErc20Balances().catch((error) => {
    alert(error);
  });
});

function handleTradeClick() {
  return router.push({ name: "trade" });
}
</script>

<template>
  <div class="py-1 px-4 w-full">
    <h2 class="text-lg mr-4">
      Your wallet address:
      <span class="font-mono">{{ walletStore.address }}</span>
      <span
        class="text-blue-500 font-semibold ml-2 cursor-pointer"
        @click="handleTradeClick"
      >
        Trade
      </span>
    </h2>

    <div class="w-full md:w-2/3 xl:w-3/4 px-4">
      <div class="bg-gray-300 rounded-lg px-4 py-2 mt-4">
        <h3 class="text-center font-semibold">Bridge to Injective</h3>
        <Bridge class="mt-4" />
      </div>
    </div>
  </div>
</template>
