<script lang="ts" setup>
import { OrderType } from "@/app/types";
import { useExchangeStore } from "@/store/exchange";

const exchangeStore = useExchangeStore();

const form = reactive({
  amount: "",
  price: "",
  orderType: OrderType.BUY,
});

const buys = computed(() => exchangeStore.orderbook.buys);
const sells = computed(() => exchangeStore.orderbook.sells.reverse());

function handleSelectOrderType(orderType: OrderType) {
  form.orderType = orderType;
}

function handleCreateLimitOrder() {
  if (!form.amount || !form.price) {
    return alert("Please fill out all fields");
  }

  exchangeStore
    .createLimitOrder(form)
    .then(() => {
      alert("Limit order created successfully");
      form.amount = "";
      form.price = "";
    })
    .catch((err) => alert(err.message));
}
</script>

<template>
  <div>
    <div class="flex flex-wrap -mx-4">
      <div class="w-full md:w-1/2 px-4">
        <button
          class="w-full text-green-500 font-bold uppercase tracking-tighter"
          :class="{ underline: form.orderType === OrderType.BUY }"
          @click="handleSelectOrderType(OrderType.BUY)"
        >
          Buy
        </button>
      </div>
      <div class="w-full md:w-1/2 px-4">
        <button
          class="w-full text-red-500 font-bold uppercase tracking-tighter"
          :class="{ underline: form.orderType === OrderType.SELL }"
          @click="handleSelectOrderType(OrderType.SELL)"
        >
          Sell
        </button>
      </div>
    </div>
    <div class="mt-4">
      <div class="flex flex-wrap -mx-4 mt-2">
        <div class="w-full md:w-1/2 px-4">
          <div>
            <label
              for="price"
              class="block mb-2 text-sm font-medium text-gray-700"
            >
              Price
            </label>
            <input
              :value="form.price"
              @input="(event: any) => (form.price = event.target.value)"
              type="tel"
              id="price"
              class="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              :placeholder="`0.001`"
              required
            />
          </div>
        </div>
        <div class="w-full md:w-1/2 px-4">
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
              :placeholder="`0.001`"
              required
            />
          </div>
        </div>
      </div>
      <div class="text-center mt-4">
        <button
          class="bg-blue-500 text-blue-900 hover:bg-blue-600 py-2 px-4 rounded-sm text-sm uppercase tracking-tight font-semibold mr-4"
          @click="handleCreateLimitOrder"
        >
          Create Limit Order
        </button>
      </div>
    </div>
    <div class="mt-4 border-t border-gray-400">
      <div class="flex flex-wrap -mx-4 mt-2">
        <div class="w-full md:w-1/2 px-4">
          <p class="text-center">Buys</p>
          <div>
            <table width="100%">
              <thead>
                <tr class="text-sm font-normal">
                  <th class="text-right" width="33.33%">
                    Price <span class="text-xs opacity-50">(USDT)</span>
                  </th>
                  <th class="text-right" width="33.33%">
                    Amount <span class="text-xs opacity-50">(INJ)</span>
                  </th>
                  <th class="text-right" width="33.33%">
                    Total <span class="text-xs opacity-50">(USDT)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <PriceLevel
                  v-for="record in buys"
                  :key="`buy-${record.price}`"
                  :record="record"
                  isBuy
                ></PriceLevel>
              </tbody>
            </table>
          </div>
        </div>
        <div class="w-full md:w-1/2 px-4">
          <p class="text-center">Sells</p>

          <div>
            <table width="100%">
              <thead>
                <tr class="text-sm font-normal">
                  <th class="text-right" width="33.33%">
                    Price <span class="text-xs opacity-50">(USDT)</span>
                  </th>
                  <th class="text-right" width="33.33%">
                    Amount <span class="text-xs opacity-50">(INJ)</span>
                  </th>
                  <th class="text-right" width="33.33%">
                    Total <span class="text-xs opacity-50">(USDT)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <PriceLevel
                  v-for="record in sells"
                  :key="`sell-${record.price}`"
                  :record="record"
                ></PriceLevel>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
