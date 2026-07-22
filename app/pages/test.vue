<script setup lang="ts">
import { telePageClass } from '~/utils/tailwindSurfaces'

const logoAnimation = ref<{
  play: () => void
  pause: () => void
  stop: () => void
  restart: () => void
} | null>(null)

const colorMode = useColorMode()
const activeControl = ref('Play')
const logoFill = computed(() => colorMode.value === 'light' ? '#0f172a' : '#f8fafc')

const controls = [
  {
    label: 'Play',
    icon: 'i-lucide-play',
    action: () => logoAnimation.value?.play()
  },
  {
    label: 'Pause',
    icon: 'i-lucide-pause',
    action: () => logoAnimation.value?.pause()
  },
  {
    label: 'Stop',
    icon: 'i-lucide-square',
    action: () => logoAnimation.value?.stop()
  },
  {
    label: 'Restart',
    icon: 'i-lucide-rotate-ccw',
    action: () => logoAnimation.value?.restart()
  }
]

const runControl = (control: typeof controls[number]) => {
  control.action()
  activeControl.value = control.label
}
</script>

<template>
  <main :class="[telePageClass, 'min-h-screen px-4 py-10 sm:px-6 lg:px-8']">
    <FloatingThemeMenu />

    <section class="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
      <div class="flex w-full flex-col items-center gap-8 text-center">
        <LogoLottie ref="logoAnimation" :fill="logoFill" />

        <div class="flex flex-wrap items-center justify-center gap-2 rounded-full border border-default/80 bg-default/75 p-2 shadow-sm backdrop-blur">
          <UButton
            v-for="control in controls"
            :key="control.label"
            :color="activeControl === control.label ? 'primary' : 'neutral'"
            :variant="activeControl === control.label ? 'solid' : 'soft'"
            size="sm"
            @click="runControl(control)"
          >
            <UIcon :name="control.icon" class="size-4" />
            {{ control.label }}
          </UButton>
        </div>

        <div class="space-y-3">
          <p class="text-sm font-medium uppercase tracking-[0.28em] text-muted">Lottie Test</p>
          <h1 class="text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">
            Animated logo reveal
          </h1>
        </div>
      </div>
    </section>
  </main>
</template>
