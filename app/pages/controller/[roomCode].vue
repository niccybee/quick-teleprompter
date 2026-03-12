<script setup lang="ts">
import type { ThemeMode } from '#shared/types/teleprompter'

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
const controlsOpen = ref(false)

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

const setTheme = (theme: ThemeMode) => {
  updateDisplay({ theme })
}

const reduceSpeed = () => {
  if (!state.value) {
    return
  }

  updatePlayback({ speedWpm: state.value.playback.speedWpm - 10 })
}
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-4">
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

      <div class="grid gap-4 lg:grid-cols-2">
        <UCard>
          <template #header>
            <h2 class="font-medium">Script</h2>
          </template>

          <div class="space-y-3">
            <UScrollArea class="h-[24rem] rounded border border-default p-2">
              <UTextarea v-model="markdown" :rows="16" autoresize class="w-full" />
            </UScrollArea>
            <div class="flex flex-wrap gap-2">
              <UButton @click="submitMarkdown">Apply Markdown</UButton>
              <UInput v-model="googleDocUrl" placeholder="Google Doc URL" class="min-w-72" />
              <UButton :loading="importPending" variant="soft" @click="importGoogleDoc">Import Doc</UButton>
              <UButton variant="outline" @click="controlsOpen = true">Open Controls</UButton>
            </div>
          </div>
        </UCard>
      </div>

      <UAlert v-if="error" color="error" variant="soft" :title="error" class="mt-4" />
    </UCard>

    <UModal v-model:open="controlsOpen" title="Controller Controls" description="Adjust playback and display settings">
      <template #body>
        <div v-if="state" class="space-y-6">
          <div class="space-y-2">
            <p class="text-sm text-muted">Playback mode</p>
            <div class="flex gap-2">
              <UButton
                :variant="state.playback.mode === 'auto' ? 'solid' : 'soft'"
                @click="updatePlayback({ mode: 'auto' })"
              >
                Auto Scroll
              </UButton>
              <UButton
                :variant="state.playback.mode === 'step' ? 'solid' : 'soft'"
                @click="updatePlayback({ mode: 'step' })"
              >
                Step
              </UButton>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-sm text-muted">Speed (WPM): {{ state.playback.speedWpm }}</p>
              <UButton size="xs" variant="soft" @click="reduceSpeed">Slow Down -10</UButton>
            </div>
            <USlider
              :model-value="state.playback.speedWpm"
              :min="20"
              :max="300"
              :step="5"
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
            <UButton @click="updatePlayback({ isPlaying: !state.playback.isPlaying })">
              {{ state.playback.isPlaying ? 'Pause' : 'Play' }}
            </UButton>
            <UButton variant="soft" @click="stepPlayback({ direction: 'prev' })">Step Prev</UButton>
            <UButton variant="soft" @click="stepPlayback({ direction: 'next' })">Step Next</UButton>
            <UButton variant="soft" @click="updateDisplay({ mirror: !state.display.mirror })">
              Mirror: {{ state.display.mirror ? 'On' : 'Off' }}
            </UButton>
          </div>

          <div class="space-y-2">
            <p class="text-sm text-muted">Theme</p>
            <div class="flex gap-2">
              <UButton variant="soft" @click="setTheme('light')">Light</UButton>
              <UButton variant="soft" @click="setTheme('dark')">Dark</UButton>
              <UButton variant="soft" @click="setTheme('system')">System</UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </main>
</template>
