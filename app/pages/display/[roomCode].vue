<script setup lang="ts">
import { markdownSegments, renderMarkdown } from '~/utils/markdown'

const route = useRoute()
const roomCode = String(route.params.roomCode).toUpperCase()
const colorMode = useColorMode()

const { connected, error, state } = useTeleprompterSocket(roomCode, 'display')

const renderedHtml = computed(() => renderMarkdown(state.value?.scriptMarkdown ?? ''))
const segments = computed(() => markdownSegments(state.value?.scriptMarkdown ?? ''))

const scrollOffset = ref(0)
let rafHandle = 0
let lastTick = 0

const pixelsPerSecond = computed(() => {
  if (!state.value || !state.value.playback.isPlaying || state.value.playback.mode !== 'auto') {
    return 0
  }

  return state.value.playback.speedWpm * 0.8
})

const tick = (time: number) => {
  if (!lastTick) {
    lastTick = time
  }

  const deltaSec = (time - lastTick) / 1000
  lastTick = time

  if (pixelsPerSecond.value > 0) {
    scrollOffset.value += pixelsPerSecond.value * deltaSec
  }

  rafHandle = requestAnimationFrame(tick)
}

onMounted(() => {
  rafHandle = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafHandle)
})

watch(
  () => state.value?.display.theme,
  (theme) => {
    if (theme) {
      colorMode.preference = theme
    }
  },
  { immediate: true }
)

watch(
  () => state.value?.playback.mode,
  (mode) => {
    if (mode === 'step') {
      scrollOffset.value = 0
    }
  }
)
</script>

<template>
  <main
    class="relative h-screen overflow-hidden"
    :class="state?.display.mirror ? '-scale-x-100' : ''"
  >
    <div class="absolute left-4 top-4 z-10 flex items-center gap-2">
      <UBadge :color="connected ? 'success' : 'error'" variant="soft">
        {{ connected ? 'Live' : 'Offline' }}
      </UBadge>
      <UBadge v-if="state" variant="soft">{{ roomCode }}</UBadge>
    </div>

    <template v-if="state">
      <div
        v-if="state.playback.mode === 'auto'"
        class="mx-auto h-full max-w-6xl px-8 pb-24 pt-[40vh]"
        :style="{
          transform: `translateY(-${scrollOffset}px)`,
          fontSize: `${state.display.fontSize}px`,
          lineHeight: String(state.display.lineSpacing)
        }"
      >
        <div class="prose prose-invert max-w-none dark:prose-invert" v-html="renderedHtml" />
      </div>

      <div
        v-else
        class="mx-auto flex h-full max-w-6xl items-center justify-center px-12 text-center"
        :style="{
          fontSize: `${state.display.fontSize}px`,
          lineHeight: String(state.display.lineSpacing)
        }"
      >
        <UScrollArea class="h-[70vh] w-full rounded border border-default p-6">
          <div class="space-y-4">
            <p
              v-for="(segment, index) in segments"
              :key="`${index}-${segment}`"
              :class="[
                'transition-opacity',
                index === state.playback.stepIndex ? 'opacity-100 font-semibold' : 'opacity-45'
              ]"
            >
              {{ segment }}
            </p>
          </div>
        </UScrollArea>
      </div>
    </template>

    <div v-else class="mx-auto flex h-full max-w-6xl items-center justify-center px-12 text-center">
      <p class="text-lg text-muted">Waiting for session state…</p>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="absolute bottom-4 left-4 right-4" />
  </main>
</template>
