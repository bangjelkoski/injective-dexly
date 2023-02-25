<script setup lang="ts">
import { useWalletStore } from "@/store/wallet";

const router = useRouter();
const walletStore = useWalletStore();

function handleConnectWallet() {
  walletStore
    .connect()
    .then(() => {
      router.push({ name: "trade" });
    })
    .catch((error) => {
      alert(error);
    });
}

function handleGoToWallet() {
  return router.push({ name: "trade" });
}
</script>

<template>
  <div class="flex items-center justify-center w-full">
    <div v-if="!walletStore.isUserWalletConnected">
      <button
        class="bg-blue-500 text-blue-900 hover:bg-blue-600 py-2 px-4 rounded-sm text-sm uppercase tracking-tight font-semibold"
        @click="handleConnectWallet"
      >
        Connect Wallet
      </button>
    </div>
    <div v-else>
      <button
        class="bg-blue-500 text-blue-900 hover:bg-blue-600 py-2 px-4 rounded-sm text-sm uppercase tracking-tight font-semibold"
        @click="handleGoToWallet"
      >
        Go to Wallet
      </button>
    </div>
  </div>
</template>
