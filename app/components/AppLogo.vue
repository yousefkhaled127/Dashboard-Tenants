<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" fill="none" style="flex-shrink:0;">
    <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#3A3733"/>
    <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
    <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
    <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
    <rect x="46" y="42" width="8" height="46" fill="#3A3733"/>
    <rect x="44" y="30" width="6" height="6" fill="#3A3733"/>
    <rect x="52" y="30" width="6" height="6" fill="#3A3733"/>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
