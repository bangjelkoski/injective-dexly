<script setup lang="ts">
import { INJ_DENOM, BigNumberInWei } from "@injectivelabs/utils";
import { useWalletStore } from "@/store/wallet";

const walletStore = useWalletStore();

const form = reactive({
  amount: "",
  destination: "",
});

const injBalance = computed(() => {
  return new BigNumberInWei(
    walletStore.balances.find((coin) => coin.denom === INJ_DENOM)?.amount || "0"
  );
});

const injBalanceInBase = computed(() => {
  return injBalance.value.toBase();
});

function handleSubmit() {
  if (!form.amount || !form.destination) {
    return alert("Please fill out all fields");
  }

  if (new BigNumberInWei(form.amount).gt(injBalanceInBase.value)) {
    return alert(
      "The amount you are trying to send is greater than your inj balance"
    );
  }

  if (!form.destination.startsWith("inj")) {
    return alert(
      "The inj address you are trying to send to must start with 'inj'"
    );
  }

  if (form.destination.length !== 42) {
    return alert(
      "The inj address you are trying to send to must be 42 characters long"
    );
  }

  walletStore
    .transfer(form)
    .then(() => {
      alert("Transfer successful");
      form.amount = "";
      form.destination = "";
    })
    .catch((err) => alert(err.message));
}
</script>

<template>
  <div>
    <div>
      <label for="address" class="block mb-2 text-sm font-medium text-gray-700"
        >Destination Address</label
      >
      <input
        :value="form.destination"
        @input="(event: any) => (form.destination = event.target.value)"
        type="text"
        id="address"
        class="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        placeholder="inj1..."
        required
      />
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
          :placeholder="`Your amount (max: ${injBalanceInBase.toFixed(2)})`"
          required
        />
      </div>
    </div>

    <div class="flex items-center mt-4">
      <button
        class="bg-orange-500 text-orange-900 hover:bg-orange-600 py-2 px-4 rounded-sm text-sm uppercase tracking-tight font-semibold mr-4"
        @click="handleSubmit"
      >
        Transfer
      </button>
    </div>
  </div>
</template>
