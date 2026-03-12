<script setup lang="ts">
const colorMode = useColorMode()

const nextModeLabel = computed(() => {
  if (colorMode.preference === 'dark') {
    return 'Light'
  }

  return 'Dark'
})

const toggleMode = () => {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <UApp>
    <div class="fixed right-4 top-4 z-50">
      <UButton variant="soft" size="sm" @click="toggleMode">
        {{ nextModeLabel }}
      </UButton>
    </div>
    <NuxtPage />
  </UApp>
</template>
