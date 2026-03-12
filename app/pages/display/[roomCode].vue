<script setup lang="ts">
import { markdownSegments, renderMarkdown } from '~/utils/markdown'

const route = useRoute()
const roomCode = String(route.params.roomCode).toUpperCase()
const colorMode = useColorMode()

const { connected, error, state } = useTeleprompterSocket(roomCode, 'display')

const renderedHtml = computed(() => renderMarkdown(state.value?.scriptMarkdown ?? ''))
const segments = computed(() => markdownSegments(state.value?.scriptMarkdown ?? ''))

const stageRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const layoutVersion = ref(0)
const autoProgress = ref(0)
let rafHandle = 0
let lastTick = 0
let resizeObserver: ResizeObserver | null = null

const pixelsPerSecond = computed(() => {
  if (!state.value || !state.value.playback.isPlaying || state.value.playback.mode !== 'auto') {
    return 0
  }

  return state.value.playback.speedWpm * 0.8
})

const maxScrollOffset = computed(() => {
  layoutVersion.value

  const stageHeight = stageRef.value?.clientHeight ?? 0
  const contentHeight = contentRef.value?.scrollHeight ?? 0
  return Math.max(0, contentHeight - stageHeight)
})

const clampedStateProgress = computed(() => {
  if (!state.value) {
    return 0
  }

  return Math.min(1, Math.max(0, state.value.playback.scrollProgress))
})

const activeProgress = computed(() => {
  if (!state.value) {
    return 0
  }

  if (state.value.playback.mode === 'auto') {
    return autoProgress.value
  }

  return clampedStateProgress.value
})

const scrollOffset = computed(() => maxScrollOffset.value * activeProgress.value)

const tick = (time: number) => {
  if (!lastTick) {
    lastTick = time
  }

  const deltaSec = (time - lastTick) / 1000
  lastTick = time

  if (pixelsPerSecond.value > 0 && maxScrollOffset.value > 0) {
    const nextProgress = autoProgress.value + ((pixelsPerSecond.value * deltaSec) / maxScrollOffset.value)
    autoProgress.value = Math.min(1, Math.max(0, nextProgress))
  }

  rafHandle = requestAnimationFrame(tick)
}

const handleResize = () => {
  layoutVersion.value += 1
}

const preventScrollShortcuts = (event: KeyboardEvent) => {
  if (state.value?.playback.mode !== 'scroll') {
    return
  }

  if ([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    ' ',
    'PageUp',
    'PageDown',
    'Home',
    'End'
  ].includes(event.key)) {
    event.preventDefault()
  }
}

onMounted(() => {
  rafHandle = requestAnimationFrame(tick)
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', preventScrollShortcuts, { passive: false })

  resizeObserver = new ResizeObserver(() => {
    layoutVersion.value += 1
  })

  if (stageRef.value) {
    resizeObserver.observe(stageRef.value)
  }

  if (contentRef.value) {
    resizeObserver.observe(contentRef.value)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafHandle)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', preventScrollShortcuts)
  resizeObserver?.disconnect()
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
  () => state.value?.playback.scrollProgress,
  (progress) => {
    if (typeof progress === 'number' && state.value?.playback.mode !== 'auto') {
      autoProgress.value = Math.min(1, Math.max(0, progress))
    }
  },
  { immediate: true }
)

watch(
  () => state.value?.playback.mode,
  (mode) => {
    if (mode !== 'auto') {
      autoProgress.value = clampedStateProgress.value
    }
  }
)
</script>

<template>
  <main
    ref="stageRef"
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
        v-if="state.playback.mode === 'auto' || state.playback.mode === 'scroll'"
        ref="contentRef"
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
