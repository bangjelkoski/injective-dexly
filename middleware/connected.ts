import { useWalletStore } from "@/store/wallet";

export default defineNuxtRouteMiddleware(() => {
  const walletStore = useWalletStore();

  if (!walletStore.isUserWalletConnected) {
    return navigateTo("/");
  }
});
