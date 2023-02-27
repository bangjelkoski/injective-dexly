<script setup lang="ts">
import {
  INJ_ERC20_CONTRACT_ADDRESS,
  USDT_ERC20_CONTRACT_ADDRESS,
  useBridgeStore,
} from "@/store/bridge";
import { BigNumberInWei } from "@injectivelabs/utils";

const bridgeStore = useBridgeStore();

const form = reactive({
  amount: "",
  contractAddress: INJ_ERC20_CONTRACT_ADDRESS,
});

const balance = computed(() => {
  return new BigNumberInWei(
    bridgeStore.erc20Balances.find(
      (balance) =>
        balance.contractAddress.toLowerCase() ===
        form.contractAddress.toLowerCase()
    )?.balance || 0
  ).toBase(form.contractAddress === INJ_ERC20_CONTRACT_ADDRESS ? 18 : 6);
});

function handleSubmit() {
  if (!form.amount || !form.contractAddress) {
    return alert("Please fill out all fields");
  }

  bridgeStore
    .transferToInjective(form)
    .then(() => {
      alert("Transfer successful");
      form.amount = "";
      form.contractAddress = INJ_ERC20_CONTRACT_ADDRESS;
    })
    .catch((err) => alert(err.message));
}
</script>

<template>
  <div>
    <p>Balance: {{ balance.toFixed(2) }}</p>
    <div>
      <label for="erc20" class="block mb-2 text-sm font-medium text-gray-700">
        Select Asset
      </label>
      <select
        id="erc20"
        class="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        v-model="form.contractAddress"
      >
        <option :value="INJ_ERC20_CONTRACT_ADDRESS">INJ</option>
        <option :value="USDT_ERC20_CONTRACT_ADDRESS">USDT</option>
      </select>
    </div>

    <div class="mt-4">
      <div>
        <label
          for="amount"
          class="block mb-2 text-sm font-medium text-gray-700"
        >
          Amount
        </label>
        <input
          :value="form.amount"
          @input="(event: any) => (form.amount = event.target.value)"
          type="tel"
          id="amount"
          class="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          :placeholder="`Your amount (max: ${balance.toFixed(2)})`"
          required
        />
      </div>
    </div>

    <div class="flex items-center mt-4">
      <button
        class="bg-orange-500 text-orange-900 hover:bg-orange-600 py-2 px-4 rounded-sm text-sm uppercase tracking-tight font-semibold mr-4"
        @click="handleSubmit"
      >
        Bridge
      </button>
    </div>
  </div>
</template>
