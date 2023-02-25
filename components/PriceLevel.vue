<script lang="ts" setup>
import { PropType } from "vue";
import { PriceLevel } from "@injectivelabs/sdk-ts";
import { BigNumberInBase, BigNumberInWei } from "@injectivelabs/utils";

const props = defineProps({
  isBuy: Boolean,

  record: {
    type: Object as PropType<PriceLevel>,
    required: true,
  },
});

const quantity = computed(() =>
  new BigNumberInWei(props.record.quantity).toBase()
);
const price = computed(() =>
  new BigNumberInWei(props.record.price).toBase(
    6 - 18 /* usdt decimals - inj decimals */
  )
);
const total = computed(() =>
  new BigNumberInBase(quantity.value).times(price.value)
);
</script>
<template>
  <tr>
    <td
      class="font-mono text-xs text-right"
      :class="{ 'text-green-500': isBuy, 'text-red-500': !isBuy }"
    >
      {{ price }}
    </td>
    <td class="font-mono text-xs text-right">{{ quantity }}</td>
    <td class="font-mono text-xs text-right">{{ total }}</td>
  </tr>
</template>
