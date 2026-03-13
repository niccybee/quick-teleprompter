<script setup lang="ts">
import type { PlaybackMode, ThemeMode } from '#shared/types/teleprompter'
import { renderMarkdown } from '~/utils/markdown'

const route = useRoute()
const roomCode = String(route.params.roomCode).toUpperCase()

const {
  connected,
  error,
  state,
  updateScript,
  updatePlayback,
  updateDisplay,
  stepPlayback
} = useTeleprompterSocket(roomCode, 'controller')

const markdown = ref('')
const googleDocUrl = ref('')
const importPending = ref(false)
const scrollPreviewRef = ref<HTMLElement | null>(null)
const suppressPreviewSync = ref(false)
const pendingWindowScrollY = ref<number | null>(null)
const { y: previewY } = useScroll(scrollPreviewRef, { behavior: 'auto' })

watch(
  () => state.value?.scriptMarkdown,
  (value) => {
    if (typeof value === 'string') {
      markdown.value = value
    }
  },
  { immediate: true }
)

const submitMarkdown = async () => {
  await $fetch('/api/import/markdown', {
    method: 'POST',
    body: {
      roomCode,
      markdown: markdown.value
    }
  })

  updateScript({ markdown: markdown.value, renderMode: 'markdown' })
}

const importGoogleDoc = async () => {
  importPending.value = true
  try {
    await $fetch('/api/import/google-doc', {
      method: 'POST',
      body: {
        roomCode,
        url: googleDocUrl.value
      }
    })
  }
  finally {
    importPending.value = false
  }
}

const captureWindowScroll = () => {
  if (!import.meta.client) {
    return
  }

  pendingWindowScrollY.value = window.scrollY
}

const restoreWindowScroll = async () => {
  if (!import.meta.client || pendingWindowScrollY.value === null) {
    return
  }

  const targetY = pendingWindowScrollY.value
  await nextTick()
  window.scrollTo({ top: targetY, behavior: 'auto' })
  requestAnimationFrame(() => {
    window.scrollTo({ top: targetY, behavior: 'auto' })
  })
  pendingWindowScrollY.value = null
}

const setTheme = (theme: ThemeMode) => {
  updateDisplay({ theme })
}

const setPlaybackMode = (mode: PlaybackMode) => {
  captureWindowScroll()
  const isPlaying = mode === 'auto' ? (state.value?.playback.isPlaying ?? false) : false
  updatePlayback({ mode, isPlaying })
}

const reduceSpeed = () => {
  if (!state.value) {
    return
  }

  updatePlayback({ speedWpm: state.value.playback.speedWpm - 10 })
}

const play = () => {
  updatePlayback({ mode: 'auto', isPlaying: true })
}

const pause = () => {
  updatePlayback({ isPlaying: false })
}

const reset = () => {
  updatePlayback({ isPlaying: false, stepIndex: 0, scrollProgress: 0 })
}

const modeIsScroll = computed(() => state.value?.playback.mode === 'scroll')
const modeIsStep = computed(() => state.value?.playback.mode === 'step')
const modeIsAuto = computed(() => state.value?.playback.mode === 'auto')
const previewHtml = computed(() => renderMarkdown(state.value?.scriptMarkdown ?? ''))

const setPreviewScrollFromProgress = (progress: number) => {
  const element = scrollPreviewRef.value
  if (!element) {
    return
  }

  const max = Math.max(0, element.scrollHeight - element.clientHeight)
  suppressPreviewSync.value = true
  previewY.value = max * Math.min(1, Math.max(0, progress))
  nextTick(() => {
    suppressPreviewSync.value = false
  })
}

const emitPreviewProgress = useThrottleFn((progress: number) => {
  updatePlayback({ scrollProgress: progress, isPlaying: false })
}, 16)

watch(previewY, () => {
  if (!modeIsScroll.value || suppressPreviewSync.value) {
    return
  }
  const element = scrollPreviewRef.value
  if (!element) {
    return
  }

  const max = Math.max(0, element.scrollHeight - element.clientHeight)
  const progress = max > 0 ? previewY.value / max : 0
  emitPreviewProgress(progress)
})

const preventScrollShortcuts = (event: KeyboardEvent) => {
  if (!modeIsScroll.value) {
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

useEventListener(window, 'keydown', preventScrollShortcuts, { passive: false })

watch(
  () => state.value?.playback.scrollProgress,
  (progress) => {
    if (typeof progress !== 'number') {
      return
    }

    nextTick(() => {
      setPreviewScrollFromProgress(progress)
    })
  },
  { immediate: true }
)

watch(
  () => state.value?.playback.mode,
  () => {
    void restoreWindowScroll()
  }
)

watch(
  () => [state.value?.scriptMarkdown, state.value?.display.fontSize, state.value?.display.lineSpacing],
  () => {
    const progress = state.value?.playback.scrollProgress ?? 0
    nextTick(() => {
      setPreviewScrollFromProgress(progress)
    })
  }
)
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4">
    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h1 class="text-xl font-semibold">Controller: {{ roomCode }}</h1>
          <div class="flex items-center gap-3 text-sm">
            <UBadge :color="connected ? 'success' : 'error'" variant="soft">
              {{ connected ? 'Connected' : 'Disconnected' }}
            </UBadge>
            <span>Displays: {{ state?.presence.displays ?? 0 }}</span>
          </div>
        </div>
      </template>

      <UCard>
        <template #header>
          <h2 class="font-medium">Script</h2>
        </template>

        <div class="space-y-3">
          <UScrollArea class="h-[24rem] rounded border border-default p-2">
            <UTextarea v-model="markdown" :rows="16" autoresize class="w-full" />
          </UScrollArea>
          <div class="flex flex-wrap gap-2">
            <UButton @click="submitMarkdown">Load to Display</UButton>
            <UInput v-model="googleDocUrl" placeholder="Google Doc URL" class="min-w-72" />
            <UButton :loading="importPending" variant="soft" @click="importGoogleDoc">Import Doc</UButton>
          </div>
        </div>
      </UCard>
    </UCard>

    <div
      v-if="state"
      class="grid gap-4"
      :class="modeIsScroll ? 'lg:grid-cols-[minmax(20rem,25rem)_1fr]' : 'lg:grid-cols-1'"
    >
      <UCard v-if="modeIsScroll" class="order-1 lg:order-2">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-medium">Scroll Preview (Mirrored Display)</h2>
            <UBadge variant="soft">Touch / wheel / drag</UBadge>
          </div>
        </template>

        <div
          ref="scrollPreviewRef"
          class="h-[68vh] overflow-y-auto rounded border border-default p-3 lg:h-[74vh]"
          style="touch-action: pan-y; -webkit-overflow-scrolling: touch;"
        >
          <div
            class="mx-auto max-w-4xl px-4 pb-16 pt-[30vh]"
            :class="state.display.mirror ? '-scale-x-100' : ''"
            :style="{
              fontSize: `${Math.max(14, state.display.fontSize * 0.45)}px`,
              lineHeight: String(state.display.lineSpacing)
            }"
          >
            <div class="prose prose-invert max-w-none dark:prose-invert" v-html="previewHtml" />
          </div>
        </div>
      </UCard>

      <UCard class="order-2 lg:order-1">
        <template #header>
          <h2 class="font-medium">Controls</h2>
        </template>

        <div class="space-y-6">
          <div class="space-y-2">
            <p class="text-sm text-muted">Playback mode</p>
            <div class="flex flex-wrap gap-2">
              <UButton :variant="modeIsAuto ? 'solid' : 'soft'" @click="setPlaybackMode('auto')">Autoplay</UButton>
              <UButton :variant="modeIsStep ? 'solid' : 'soft'" @click="setPlaybackMode('step')">Step</UButton>
              <UButton :variant="modeIsScroll ? 'solid' : 'soft'" @click="setPlaybackMode('scroll')">Scroll</UButton>
            </div>
          </div>

          <div class="hidden space-y-6 lg:block">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-sm text-muted">Speed (WPM): {{ state.playback.speedWpm }}</p>
                <UButton size="xs" variant="soft" :disabled="modeIsScroll" @click="reduceSpeed">Slow Down -10</UButton>
              </div>
              <USlider
                :model-value="state.playback.speedWpm"
                :min="20"
                :max="300"
                :step="5"
                :disabled="modeIsScroll"
                @update:model-value="(v) => updatePlayback({ speedWpm: Number(v) })"
              />
            </div>

            <div class="space-y-2">
              <p class="text-sm text-muted">Text Size: {{ state.display.fontSize }}px</p>
              <USlider
                :model-value="state.display.fontSize"
                :min="20"
                :max="120"
                :step="1"
                @update:model-value="(v) => updateDisplay({ fontSize: Number(v) })"
              />
            </div>

            <div class="space-y-2">
              <p class="text-sm text-muted">Line Spacing: {{ state.display.lineSpacing.toFixed(1) }}</p>
              <USlider
                :model-value="state.display.lineSpacing"
                :min="1"
                :max="3"
                :step="0.1"
                @update:model-value="(v) => updateDisplay({ lineSpacing: Number(v) })"
              />
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton :disabled="!modeIsAuto" @click="play">Play</UButton>
              <UButton variant="soft" :disabled="!modeIsAuto" @click="pause">Pause</UButton>
              <UButton color="warning" variant="soft" @click="reset">Reset</UButton>
              <UButton variant="soft" :disabled="!modeIsStep" @click="stepPlayback({ direction: 'prev' })">Step Prev</UButton>
              <UButton variant="soft" :disabled="!modeIsStep" @click="stepPlayback({ direction: 'next' })">Step Next</UButton>
              <UButton variant="soft" @click="updateDisplay({ mirror: !state.display.mirror })">
                Mirror: {{ state.display.mirror ? 'On' : 'Off' }}
              </UButton>
            </div>

            <div class="space-y-2">
              <p class="text-sm text-muted">Theme</p>
              <div class="flex gap-2">
                <UButton variant="soft" @click="setTheme('light')">Light</UButton>
                <UButton variant="soft" @click="setTheme('dark')">Dark</UButton>
                <UButton variant="soft" @click="setTheme('jetblack')">Jet Black</UButton>
                <UButton variant="soft" @click="setTheme('system')">System</UButton>
              </div>
            </div>
          </div>

          <div class="space-y-3 lg:hidden">
            <details class="rounded border border-default p-3">
              <summary class="cursor-pointer text-sm font-medium">Playback Controls</summary>
              <div class="mt-3 space-y-3">
                <p class="text-sm text-muted">Speed (WPM): {{ state.playback.speedWpm }}</p>
                <USlider
                  :model-value="state.playback.speedWpm"
                  :min="20"
                  :max="300"
                  :step="5"
                  :disabled="modeIsScroll"
                  @update:model-value="(v) => updatePlayback({ speedWpm: Number(v) })"
                />
                <div class="flex flex-wrap gap-2">
                  <UButton size="sm" :disabled="!modeIsAuto" @click="play">Play</UButton>
                  <UButton size="sm" variant="soft" :disabled="!modeIsAuto" @click="pause">Pause</UButton>
                  <UButton size="sm" color="warning" variant="soft" @click="reset">Reset</UButton>
                  <UButton size="sm" variant="soft" :disabled="!modeIsStep" @click="stepPlayback({ direction: 'prev' })">Prev</UButton>
                  <UButton size="sm" variant="soft" :disabled="!modeIsStep" @click="stepPlayback({ direction: 'next' })">Next</UButton>
                </div>
              </div>
            </details>

            <details class="rounded border border-default p-3">
              <summary class="cursor-pointer text-sm font-medium">Typography</summary>
              <div class="mt-3 space-y-3">
                <p class="text-sm text-muted">Text Size: {{ state.display.fontSize }}px</p>
                <USlider
                  :model-value="state.display.fontSize"
                  :min="20"
                  :max="120"
                  :step="1"
                  @update:model-value="(v) => updateDisplay({ fontSize: Number(v) })"
                />
                <p class="text-sm text-muted">Line Spacing: {{ state.display.lineSpacing.toFixed(1) }}</p>
                <USlider
                  :model-value="state.display.lineSpacing"
                  :min="1"
                  :max="3"
                  :step="0.1"
                  @update:model-value="(v) => updateDisplay({ lineSpacing: Number(v) })"
                />
              </div>
            </details>

            <details class="rounded border border-default p-3">
              <summary class="cursor-pointer text-sm font-medium">Display Settings</summary>
              <div class="mt-3 flex flex-wrap gap-2">
                <UButton size="sm" variant="soft" @click="updateDisplay({ mirror: !state.display.mirror })">
                  Mirror: {{ state.display.mirror ? 'On' : 'Off' }}
                </UButton>
                <UButton size="sm" variant="soft" @click="setTheme('light')">Light</UButton>
                <UButton size="sm" variant="soft" @click="setTheme('dark')">Dark</UButton>
                <UButton size="sm" variant="soft" @click="setTheme('jetblack')">Jet Black</UButton>
                <UButton size="sm" variant="soft" @click="setTheme('system')">System</UButton>
              </div>
            </details>
          </div>
        </div>
      </UCard>
    </div>

    <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />
  </main>
</template>
