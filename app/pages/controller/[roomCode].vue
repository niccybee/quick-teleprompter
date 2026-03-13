<script setup lang="ts">
import QRCode from 'qrcode'
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
const scriptPanelOpen = ref(true)
const settingsOpen = ref(false)
const modeMenuOpen = ref(false)
const previewOpen = ref(false)
const roomInfoOpen = ref(false)
const dockPosition = ref<'top' | 'bottom'>('bottom')
const settingsSection = ref<'playback' | 'typography' | 'display'>('playback')
const roomQrDataUrl = ref('')
const playbackSettingsRef = ref<HTMLElement | null>(null)
const typographySettingsRef = ref<HTMLElement | null>(null)
const displaySettingsRef = ref<HTMLElement | null>(null)
const { y: previewY } = useScroll(scrollPreviewRef, { behavior: 'auto' })

const playbackModes: Array<{ label: string, value: PlaybackMode, icon: string }> = [
  { label: 'Autoplay', value: 'auto', icon: 'i-lucide-play' },
  { label: 'Step', value: 'step', icon: 'i-lucide-chevrons-right' },
  { label: 'Scroll', value: 'scroll', icon: 'i-lucide-hand' }
]

const themeOptions: Array<{ label: string, value: ThemeMode, icon: string }> = [
  { label: 'Light', value: 'light', icon: 'i-lucide-sun-medium' },
  { label: 'Dark', value: 'dark', icon: 'i-lucide-moon-star' },
  { label: 'Jet Black', value: 'jetblack', icon: 'i-lucide-monitor-smartphone' },
  { label: 'System', value: 'system', icon: 'i-lucide-laptop-minimal' }
]

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
  modeMenuOpen.value = false
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
const activeMode = computed(() => playbackModes.find(mode => mode.value === state.value?.playback.mode) ?? playbackModes[0])
const activeTheme = computed(() => themeOptions.find(theme => theme.value === state.value?.display.theme) ?? themeOptions[0])
const canPlay = computed(() => Boolean(state.value && modeIsAuto.value))
const primaryActionLabel = computed(() => state.value?.playback.isPlaying ? 'Pause' : 'Play')
const primaryActionIcon = computed(() => state.value?.playback.isPlaying ? 'i-lucide-pause' : 'i-lucide-play')
const dockPositionLabel = computed(() => dockPosition.value === 'top' ? 'Top' : 'Bottom')

const openSettings = (section: 'playback' | 'typography' | 'display') => {
  settingsSection.value = section
  settingsOpen.value = true
}

const scrollSettingsSectionIntoView = () => {
  const target = settingsSection.value === 'playback'
    ? playbackSettingsRef.value
    : settingsSection.value === 'typography'
      ? typographySettingsRef.value
      : displaySettingsRef.value

  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

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
  () => roomCode,
  async () => {
    if (!import.meta.client) {
      return
    }

    roomQrDataUrl.value = await QRCode.toDataURL(`${window.location.origin}/display/${roomCode}`, {
      margin: 1,
      width: 240
    })
  },
  { immediate: true }
)

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
  (mode) => {
    if (mode !== 'scroll') {
      previewOpen.value = false
    }
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

watch(settingsOpen, async (isOpen) => {
  if (!isOpen) {
    return
  }

  await nextTick()
  scrollSettingsSectionIntoView()
})
</script>

<template>
  <main class="tele-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <FloatingThemeMenu class="top-5" />

    <div class="mx-auto flex max-w-[96rem] flex-col gap-6 pb-32 pt-16 lg:pt-20">
      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(26rem,0.9fr)]">
        <UCard :ui="{ root: 'rounded-xl sm:rounded-[2rem] tele-glass', body: 'p-5 sm:p-6', header: 'p-5 sm:p-6 pb-0' }">
          <template #header>
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="space-y-3">
                <div class="inline-flex items-center gap-2 rounded-full border border-default/80 bg-default/70 px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted">
                  Room {{ roomCode }}
                </div>
                <div>
                  <h1 class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">Controller Console</h1>
                  <p class="mt-2 max-w-2xl text-sm text-toned sm:text-base">
                    Keep the operator controls close, tuck the script away when you need space, and shape the display from one floating control stack.
                  </p>
                </div>
              </div>

              <div class="grid gap-2 text-sm sm:text-right">
                <div class="flex items-center gap-2 sm:justify-end">
                  <UBadge :color="connected ? 'success' : 'error'" variant="soft">
                    {{ connected ? 'Connected' : 'Disconnected' }}
                  </UBadge>
                  <UButton color="neutral" variant="soft" size="sm" @click="roomInfoOpen = true">
                    Displays: {{ state?.presence.displays ?? 0 }}
                  </UButton>
                </div>
                <p class="text-muted">Mode: <span class="text-highlighted">{{ activeMode.label }}</span></p>
                <p class="text-muted">Theme: <span class="text-highlighted">{{ activeTheme.label }}</span></p>
              </div>
            </div>
          </template>

          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-lg border border-default/80 bg-default/55 p-4 sm:rounded-[1.5rem]">
              <div class="flex items-start justify-between gap-3">
                <p class="text-xs uppercase tracking-[0.2em] text-muted">Playback</p>
                <UPopover :content="{ side: 'bottom', align: 'end', sideOffset: 8 }">
                  <UButton color="neutral" variant="ghost" size="xs">
                    <UIcon name="i-lucide-chevron-down" class="size-4" />
                  </UButton>

                  <template #content>
                    <div class="w-52 space-y-2 p-2">
                      <UButton
                        v-for="mode in playbackModes"
                        :key="mode.value"
                        color="neutral"
                        :variant="state?.playback.mode === mode.value ? 'solid' : 'soft'"
                        class="justify-start"
                        block
                        @click="setPlaybackMode(mode.value)"
                      >
                        <UIcon :name="mode.icon" class="size-4" />
                        {{ mode.label }}
                      </UButton>
                    </div>
                  </template>
                </UPopover>
              </div>
              <p class="mt-2 text-lg font-semibold text-highlighted">{{ activeMode.label }}</p>
              <p class="text-sm text-muted">
                {{ modeIsAuto ? (state?.playback.isPlaying ? 'Running live on the display.' : 'Ready to roll.') : 'Manual control active.' }}
              </p>
            </div>
            <div class="rounded-lg border border-default/80 bg-default/55 p-4 sm:rounded-[1.5rem]">
              <div class="flex items-start justify-between gap-3">
                <p class="text-xs uppercase tracking-[0.2em] text-muted">Typography</p>
                <UButton color="neutral" variant="ghost" size="xs" @click="openSettings('typography')">
                  <UIcon name="i-lucide-pencil" class="size-4" />
                </UButton>
              </div>
              <p class="mt-2 text-lg font-semibold text-highlighted">{{ state?.display.fontSize ?? 0 }}px</p>
              <p class="text-sm text-muted">Line spacing {{ state?.display.lineSpacing?.toFixed(1) ?? '0.0' }}</p>
            </div>
            <div class="rounded-lg border border-default/80 bg-default/55 p-4 sm:rounded-[1.5rem]">
              <div class="flex items-start justify-between gap-3">
                <p class="text-xs uppercase tracking-[0.2em] text-muted">Display</p>
                <UButton color="neutral" variant="ghost" size="xs" @click="openSettings('display')">
                  <UIcon name="i-lucide-pencil" class="size-4" />
                </UButton>
              </div>
              <p class="mt-2 text-lg font-semibold text-highlighted">{{ state?.display.mirror ? 'Mirrored' : 'Standard' }}</p>
              <p class="text-sm text-muted">Use the settings menu for theme and screen comfort changes.</p>
            </div>
          </div>
        </UCard>

        <UCard
          :ui="{ root: 'rounded-xl sm:rounded-[2rem] tele-glass', body: 'p-5 sm:p-6', header: 'p-5 sm:p-6 pb-0' }"
          class="xl:sticky xl:top-24"
        >
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold text-highlighted">Quick Actions</h2>
                <p class="mt-1 text-sm text-muted">Core controls live here; the floating dock stays available while you scroll.</p>
              </div>
              <UBadge color="neutral" variant="soft">{{ dockPositionLabel }} Dock</UBadge>
            </div>
          </template>

            <div class="grid gap-3 sm:grid-cols-2">
              <UButton
                v-if="!modeIsScroll"
                :disabled="!canPlay"
                size="lg"
                class="justify-center"
                @click="state?.playback.isPlaying ? pause() : play()"
            >
              <UIcon :name="primaryActionIcon" class="size-4" />
              {{ primaryActionLabel }}
            </UButton>
            <UButton color="warning" variant="soft" size="lg" class="justify-center" @click="reset">
              <UIcon name="i-lucide-rotate-ccw" class="size-4" />
              Reset
            </UButton>
            <UButton
              v-if="modeIsScroll"
              color="neutral"
              variant="soft"
              size="lg"
              class="justify-center sm:col-span-2"
              @click="previewOpen = true"
            >
              <UIcon name="i-lucide-monitor-play" class="size-4" />
              Open Display Preview
            </UButton>
          </div>
        </UCard>
      </section>

      <section
        v-if="state"
        class="grid gap-4 xl:items-start"
        :class="scriptPanelOpen ? 'xl:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)]' : 'xl:grid-cols-1'"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-x-4 opacity-0"
          enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-x-0 opacity-100"
          leave-to-class="-translate-x-4 opacity-0"
        >
          <UCard
            v-if="scriptPanelOpen"
            :ui="{ root: 'rounded-xl sm:rounded-[2rem] tele-glass', body: 'p-5 sm:p-6', header: 'p-5 sm:p-6 pb-0' }"
            class="xl:sticky xl:top-24"
          >
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-xl font-semibold text-highlighted">Script Workspace</h2>
                  <p class="mt-1 text-sm text-muted">Keep this open while editing, or collapse it to focus on playback and preview.</p>
                </div>
                <UButton color="neutral" variant="ghost" size="sm" @click="scriptPanelOpen = false">
                  <UIcon name="i-lucide-eye-off" class="size-4" />
                </UButton>
              </div>
            </template>

            <div class="space-y-4">
              <UScrollArea class="h-[26rem] rounded-lg border border-default/80 bg-default/60 sm:rounded-[1.5rem]">
                <UTextarea
                  v-model="markdown"
                  :rows="22"
                  autoresize
                  class="w-full"
                  :ui="{ base: 'min-h-[26rem] border-0 bg-transparent p-4 font-mono text-sm leading-6 ring-0' }"
                />
              </UScrollArea>

              <div class="grid gap-3">
                <UButton size="lg" class="justify-center" @click="submitMarkdown">
                  <UIcon name="i-lucide-upload" class="size-4" />
                  Load to Display
                </UButton>

                <UInput
                  v-model="googleDocUrl"
                  placeholder="Paste Google Doc URL"
                  size="lg"
                />

                <UButton
                  :loading="importPending"
                  color="neutral"
                  variant="soft"
                  size="lg"
                  class="justify-center"
                  @click="importGoogleDoc"
                >
                  <UIcon name="i-lucide-file-input" class="size-4" />
                  Import from Google Docs
                </UButton>
              </div>
            </div>
          </UCard>
        </Transition>

        <div v-if="!scriptPanelOpen" class="tele-glass rounded-xl border border-dashed border-default/80 p-8 text-center sm:rounded-[2rem]">
          <p class="text-lg font-semibold text-highlighted">Script panel hidden</p>
          <p class="mt-2 text-sm text-muted">Open Settings from the floating dock whenever you want to bring the script workspace back.</p>
        </div>
      </section>
    </div>

    <div
      class="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      :class="dockPosition === 'top' ? 'top-20' : 'bottom-4'"
    >
      <div class="pointer-events-auto tele-glass flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 rounded-full px-3 py-3 shadow-2xl">
        <UPopover
          v-model:open="modeMenuOpen"
          :content="{ side: dockPosition === 'top' ? 'bottom' : 'top', sideOffset: 12 }"
        >
          <UButton color="neutral" variant="soft" size="sm">
            <UIcon :name="activeMode.icon" class="size-4" />
            {{ activeMode.label }}
            <UIcon name="i-lucide-chevrons-up-down" class="size-4 opacity-70" />
          </UButton>

          <template #content>
            <div class="w-72 space-y-3 p-3">
              <div class="space-y-1">
                <p class="text-sm font-semibold text-highlighted">Playback Mode</p>
                <p class="text-xs text-muted">Switch how the display advances through the script.</p>
              </div>

              <div class="grid gap-2">
                <UButton
                  v-for="mode in playbackModes"
                  :key="mode.value"
                  color="neutral"
                  :variant="state?.playback.mode === mode.value ? 'solid' : 'soft'"
                  class="justify-start"
                  @click="setPlaybackMode(mode.value)"
                >
                  <UIcon :name="mode.icon" class="size-4" />
                  {{ mode.label }}
                </UButton>
              </div>
            </div>
          </template>
        </UPopover>

        <UButton
          v-if="!modeIsScroll"
          size="sm"
          :disabled="!canPlay"
          @click="state?.playback.isPlaying ? pause() : play()"
        >
          <UIcon :name="primaryActionIcon" class="size-4" />
          {{ primaryActionLabel }}
        </UButton>

        <UButton
          v-if="modeIsStep"
          color="neutral"
          variant="soft"
          size="sm"
          @click="stepPlayback({ direction: 'prev' })"
        >
          <UIcon name="i-lucide-chevron-left" class="size-4" />
        </UButton>

        <UButton
          v-if="modeIsStep"
          color="neutral"
          variant="soft"
          size="sm"
          @click="stepPlayback({ direction: 'next' })"
        >
          <UIcon name="i-lucide-chevron-right" class="size-4" />
        </UButton>

        <UButton
          v-if="modeIsScroll"
          color="neutral"
          variant="soft"
          size="sm"
          @click="previewOpen = true"
        >
          <UIcon name="i-lucide-monitor-play" class="size-4" />
          Preview
        </UButton>

        <UButton color="warning" variant="soft" size="sm" @click="reset">
          <UIcon name="i-lucide-rotate-ccw" class="size-4" />
          Reset
        </UButton>

        <USlideover v-model:open="settingsOpen" side="right">
          <UButton color="neutral" variant="soft" size="sm" @click="settingsOpen = true">
            <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
            Settings
          </UButton>

          <template #content>
            <div class="flex h-full flex-col bg-default">
              <div class="flex items-start justify-between gap-3 border-b border-default px-5 py-4">
                <div>
                  <p class="text-lg font-semibold text-highlighted">Display Settings</p>
                  <p class="mt-1 text-sm text-muted">Tune playback, typography, and display behavior without leaving the controller.</p>
                </div>
                <UButton color="neutral" variant="ghost" size="sm" class="sm:hidden" @click="settingsOpen = false">
                  <UIcon name="i-lucide-x" class="size-4" />
                  Close
                </UButton>
              </div>

              <div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                <div class="space-y-3">
                  <p class="text-sm font-medium text-highlighted">Workspace</p>
                  <UButton
                    color="neutral"
                    variant="soft"
                    class="justify-between"
                    block
                    @click="scriptPanelOpen = !scriptPanelOpen"
                  >
                    <span>{{ scriptPanelOpen ? 'Hide script panel' : 'Show script panel' }}</span>
                    <UBadge color="neutral" variant="subtle">{{ scriptPanelOpen ? 'Visible' : 'Hidden' }}</UBadge>
                  </UButton>
                </div>

                <div class="space-y-3">
                  <p class="text-sm font-medium text-highlighted">Floating Dock</p>
                  <div class="grid grid-cols-2 gap-2">
                    <UButton
                      color="neutral"
                      :variant="dockPosition === 'top' ? 'solid' : 'soft'"
                      class="justify-start"
                      @click="dockPosition = 'top'"
                    >
                      <UIcon name="i-lucide-panel-top" class="size-4" />
                      Top
                    </UButton>
                    <UButton
                      color="neutral"
                      :variant="dockPosition === 'bottom' ? 'solid' : 'soft'"
                      class="justify-start"
                      @click="dockPosition = 'bottom'"
                    >
                      <UIcon name="i-lucide-panel-bottom" class="size-4" />
                      Bottom
                    </UButton>
                  </div>
                </div>

                <div ref="playbackSettingsRef" class="space-y-3">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-medium text-highlighted">Speed</p>
                    <UButton size="xs" color="neutral" variant="soft" :disabled="modeIsScroll" @click="reduceSpeed">
                      Slow Down -10
                    </UButton>
                  </div>
                  <p class="text-sm text-muted">Words per minute: {{ state.playback.speedWpm }}</p>
                  <USlider
                    :model-value="state.playback.speedWpm"
                    :min="20"
                    :max="300"
                    :step="5"
                    :disabled="modeIsScroll"
                    @update:model-value="(v) => updatePlayback({ speedWpm: Number(v) })"
                  />
                </div>

                <div ref="typographySettingsRef" class="space-y-3">
                  <p class="text-sm font-medium text-highlighted">Text Size</p>
                  <p class="text-sm text-muted">{{ state.display.fontSize }}px</p>
                  <USlider
                    :model-value="state.display.fontSize"
                    :min="20"
                    :max="120"
                    :step="1"
                    @update:model-value="(v) => updateDisplay({ fontSize: Number(v) })"
                  />
                </div>

                <div class="space-y-3">
                  <p class="text-sm font-medium text-highlighted">Line Spacing</p>
                  <p class="text-sm text-muted">{{ state.display.lineSpacing.toFixed(1) }}</p>
                  <USlider
                    :model-value="state.display.lineSpacing"
                    :min="1"
                    :max="3"
                    :step="0.1"
                    @update:model-value="(v) => updateDisplay({ lineSpacing: Number(v) })"
                  />
                </div>

                <div ref="displaySettingsRef" class="space-y-3">
                  <p class="text-sm font-medium text-highlighted">Theme</p>
                  <div class="grid grid-cols-2 gap-2">
                    <UButton
                      v-for="theme in themeOptions"
                      :key="theme.value"
                      color="neutral"
                      :variant="state.display.theme === theme.value ? 'solid' : 'soft'"
                      class="justify-start"
                      @click="setTheme(theme.value)"
                    >
                      <UIcon :name="theme.icon" class="size-4" />
                      {{ theme.label }}
                    </UButton>
                  </div>
                </div>

                <div class="space-y-3">
                  <p class="text-sm font-medium text-highlighted">Display Behavior</p>
                  <UButton
                    color="neutral"
                    variant="soft"
                    class="justify-between"
                    block
                    @click="updateDisplay({ mirror: !state.display.mirror })"
                  >
                    <span>Mirror text</span>
                    <UBadge color="neutral" variant="subtle">{{ state.display.mirror ? 'On' : 'Off' }}</UBadge>
                  </UButton>
                </div>
              </div>
            </div>
          </template>
        </USlideover>
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
      class="fixed left-4 right-4 z-30 mx-auto max-w-2xl"
      :class="dockPosition === 'top' ? 'bottom-4' : 'bottom-24'"
    />

    <UModal v-model:open="previewOpen" :content="{ class: 'max-w-6xl' }">
      <template #content>
        <div class="flex max-h-[88vh] flex-col overflow-hidden bg-default">
          <div class="flex items-start justify-between gap-3 border-b border-default px-5 py-4">
            <div>
              <p class="text-lg font-semibold text-highlighted">Display Preview</p>
              <p class="mt-1 text-sm text-muted">Drag or wheel directly in the preview to set the display position while scroll mode is active.</p>
            </div>
            <UButton color="neutral" variant="ghost" size="sm" @click="previewOpen = false">
              <UIcon name="i-lucide-x" class="size-4" />
            </UButton>
          </div>

          <div
            v-if="state && modeIsScroll"
            ref="scrollPreviewRef"
            class="overflow-y-auto bg-black/90 p-3 text-white"
            style="touch-action: pan-y; -webkit-overflow-scrolling: touch; height: min(72vh, 980px);"
          >
            <div
              class="mx-auto max-w-5xl px-4 pb-16 pt-[30vh]"
              :class="state.display.mirror ? '-scale-x-100' : ''"
              :style="{
                fontSize: `${Math.max(14, state.display.fontSize * 0.45)}px`,
                lineHeight: String(state.display.lineSpacing)
              }"
            >
              <div class="prose prose-invert max-w-none dark:prose-invert" v-html="previewHtml" />
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="roomInfoOpen" :content="{ class: 'max-w-md' }">
      <template #content>
        <div class="flex flex-col items-center gap-5 bg-default px-6 py-6 text-center">
          <div class="space-y-1">
            <p class="text-lg font-semibold text-highlighted">Display Pairing</p>
            <p class="text-sm text-muted">Open the display on another device by scanning the QR code or entering the room code.</p>
          </div>

          <img
            v-if="roomQrDataUrl"
            :src="roomQrDataUrl"
            alt="Display QR code"
            class="w-56 rounded-lg border border-default bg-white p-3 sm:rounded-2xl"
          />

          <div class="space-y-1">
            <p class="text-xs uppercase tracking-[0.24em] text-muted">Room Code</p>
            <p class="font-mono text-3xl font-semibold tracking-[0.18em] text-highlighted">{{ roomCode }}</p>
          </div>

          <UButton color="neutral" variant="soft" @click="roomInfoOpen = false">
            Close
          </UButton>
        </div>
      </template>
    </UModal>
  </main>
</template>
