<script setup lang="ts">
import type { ThemeMode } from '#shared/types/teleprompter'

const props = withDefaults(defineProps<{
  class?: string
}>(), {
  class: ''
})

const colorMode = useColorMode()

const themes: Array<{ label: string, value: ThemeMode, icon: string }> = [
  { label: 'Light', value: 'light', icon: 'i-lucide-sun-medium' },
  { label: 'Dark', value: 'dark', icon: 'i-lucide-moon-star' },
  { label: 'Jet Black', value: 'jetblack', icon: 'i-lucide-monitor-smartphone' },
  { label: 'System', value: 'system', icon: 'i-lucide-laptop-minimal' }
]

const currentTheme = computed(() => {
  return themes.find(theme => theme.value === colorMode.preference) ?? themes[3]!
})

const setTheme = (theme: ThemeMode) => {
  colorMode.preference = theme
}
</script>

<template>
  <div :class="['fixed right-4 top-4 z-50', props.class]">
    <UPopover :content="{ align: 'end', side: 'bottom', sideOffset: 10 }">
      <UButton
        color="neutral"
        variant="soft"
        size="lg"
        :aria-label="`Appearance: ${currentTheme.label}`"
        class="rounded-full border border-default/70 bg-default/80 shadow-lg shadow-black/10 backdrop-blur"
      >
        <UIcon :name="currentTheme.icon" class="size-4" />
        <span class="hidden sm:inline">{{ currentTheme.label }}</span>
      </UButton>

      <template #content>
        <div class="w-60 space-y-3 p-3">
          <div class="space-y-1">
            <p class="text-sm font-semibold text-highlighted">Appearance</p>
            <p class="text-xs text-muted">Switch the room between light, dark, and high-contrast looks.</p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              v-for="theme in themes"
              :key="theme.value"
              color="neutral"
              :variant="colorMode.preference === theme.value ? 'solid' : 'soft'"
              class="justify-start"
              @click="setTheme(theme.value)"
            >
              <UIcon :name="theme.icon" class="size-4" />
              {{ theme.label }}
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
