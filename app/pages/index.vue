<script setup lang="ts">
import QRCode from 'qrcode'

const joinCode = ref('')
const createdRoomCode = ref('')
const creating = ref(false)
const qrDataUrl = ref('')

const createRoom = async () => {
  creating.value = true
  try {
    const { roomCode } = await $fetch<{ roomCode: string }>('/api/session/create', {
      method: 'POST'
    })

    createdRoomCode.value = roomCode

    const displayUrl = `${window.location.origin}/display/${roomCode}`
    qrDataUrl.value = await QRCode.toDataURL(displayUrl, {
      margin: 1,
      width: 240
    })
  }
  finally {
    creating.value = false
  }
}

const normalizedJoinCode = computed(() => joinCode.value.toUpperCase().trim())
const canJoin = computed(() => normalizedJoinCode.value.length === 6)

const quickLinks = computed(() => {
  if (!createdRoomCode.value) {
    return []
  }

  return [
    {
      label: 'Controller',
      to: `/controller/${createdRoomCode.value}`,
      icon: 'i-lucide-sliders-horizontal'
    },
    {
      label: 'Display',
      to: `/display/${createdRoomCode.value}`,
      icon: 'i-lucide-monitor-play'
    }
  ]
})
</script>

<template>
  <main class="tele-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <FloatingThemeMenu />

    <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-28 pt-16 lg:pt-20">
      <section class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,30rem)] lg:items-end">
        <div class="space-y-6">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-default/80 bg-default/75 px-3 py-1 text-sm text-toned shadow-sm backdrop-blur">
            <UIcon name="i-lucide-radio-tower" class="size-4" />
            Realtime rooms for controller + display pairs
          </div>

          <div class="space-y-4">
            <h1 class="max-w-4xl text-5xl font-semibold tracking-tight text-highlighted sm:text-6xl lg:text-7xl">
              Keep the script moving without losing the room.
            </h1>
            <p class="max-w-2xl text-lg text-toned sm:text-xl">
              Spin up a teleprompter session, hand the display to one screen, and steer everything from a cleaner
              control surface.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="tele-glass rounded-3xl p-4">
              <p class="text-sm font-medium text-highlighted">Fast setup</p>
              <p class="mt-1 text-sm text-muted">Create a room instantly and launch both views from the same place.</p>
            </div>
            <div class="tele-glass rounded-3xl p-4">
              <p class="text-sm font-medium text-highlighted">Live sync</p>
              <p class="mt-1 text-sm text-muted">Playback, display settings, and script updates stay aligned in real
                time.</p>
            </div>
            <div class="tele-glass rounded-3xl p-4">
              <p class="text-sm font-medium text-highlighted">Stage ready</p>
              <p class="mt-1 text-sm text-muted">Swap themes, mirror text, and tune reading comfort without breaking
                flow.</p>
            </div>
          </div>
        </div>

        <div class="tele-glass rounded-[2rem] p-5 sm:p-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium uppercase tracking-[0.24em] text-muted">Session Builder</p>
                <p class="mt-1 text-sm text-toned">Create a fresh room or jump into an existing one.</p>
              </div>
              <div class="rounded-2xl border border-default/80 bg-default/70 px-3 py-2 text-right shadow-sm">
                <p class="text-xs uppercase tracking-[0.2em] text-muted">Flow</p>
                <p class="text-sm font-medium text-highlighted">Home -> Controller -> Display</p>
              </div>
            </div>

            <div class="grid gap-4">
              <UCard :ui="{ root: 'rounded-[1.5rem] tele-glass', body: 'p-5', header: 'p-5 pb-0' }">
                <template #header>
                  <div class="space-y-1">
                    <h2 class="text-xl font-semibold text-highlighted">Create Session</h2>
                    <p class="text-sm text-muted">Start a new room and generate a QR for the display device.</p>
                  </div>
                </template>

                <div class="space-y-4">
                  <UButton size="xl" :loading="creating" class="justify-center" @click="createRoom">
                    <UIcon name="i-lucide-plus" class="size-4" />
                    Create Room
                  </UButton>

                  <div v-if="createdRoomCode"
                    class="grid gap-4 rounded-[1.5rem] border border-default/80 bg-default/60 p-4 shadow-sm sm:grid-cols-[1fr_auto]">
                    <div class="space-y-3">
                      <div>
                        <p class="text-xs uppercase tracking-[0.24em] text-muted">Room Code</p>
                        <p class="mt-1 font-mono text-3xl font-semibold tracking-[0.18em] text-highlighted">
                          {{ createdRoomCode }}
                        </p>
                      </div>

                      <div class="flex flex-wrap gap-2">
                        <UButton v-for="link in quickLinks" :key="link.label" :to="link.to" size="sm" color="neutral"
                          variant="soft">
                          <UIcon :name="link.icon" class="size-4" />
                          {{ link.label }}
                        </UButton>
                      </div>
                    </div>

                    <img v-if="qrDataUrl" :src="qrDataUrl" alt="Display QR code"
                      class="mx-auto w-36 rounded-2xl border border-default bg-white p-2" />
                  </div>
                </div>
              </UCard>

              <UCard :ui="{ root: 'rounded-[1.5rem] tele-glass', body: 'p-5', header: 'p-5 pb-0' }">
                <template #header>
                  <div class="space-y-1">
                    <h2 class="text-xl font-semibold text-highlighted">Join Existing Room</h2>
                    <p class="text-sm text-muted">Paste the code from another device and choose your role.</p>
                  </div>
                </template>

                <div class="grid gap-4">
                  <UInput v-model="joinCode" placeholder="Enter 6-character room code" size="xl" class="w-full"
                    :ui="{ base: 'font-mono tracking-[0.2em] uppercase' }" />

                  <div class="grid gap-2 sm:grid-cols-2">
                    <UButton :to="canJoin ? `/controller/${normalizedJoinCode}` : undefined" :disabled="!canJoin"
                      size="lg" class="justify-center">
                      <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
                      Open Controller
                    </UButton>
                    <UButton :to="canJoin ? `/display/${normalizedJoinCode}` : undefined" :disabled="!canJoin" size="lg"
                      color="neutral" variant="soft" class="justify-center">
                      <UIcon name="i-lucide-monitor-play" class="size-4" />
                      Open Display
                    </UButton>
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </section>
      <USeparator class="my-8" />

      <section class="grid gap-4 lg:grid-cols-3">
        <UCard :ui="{ root: 'rounded-[1.75rem] tele-glass', body: 'p-5' }">
          <p class="text-sm font-medium text-highlighted">1. Load the script</p>
          <p class="mt-2 text-sm text-muted">Paste markdown or import a Google Doc from the controller once the room is
            live.
          </p>
        </UCard>
        <UCard :ui="{ root: 'rounded-[1.75rem] tele-glass', body: 'p-5' }">
          <p class="text-sm font-medium text-highlighted">2. Pick the reading mode</p>
          <p class="mt-2 text-sm text-muted">Autoplay, manual stepping, and free scroll all stay synced with the
            display.</p>
        </UCard>
        <UCard :ui="{ root: 'rounded-[1.75rem] tele-glass', body: 'p-5' }">
          <p class="text-sm font-medium text-highlighted">3. Tweak the screen</p>
          <p class="mt-2 text-sm text-muted">Adjust font size, line spacing, mirror mode, and theme without leaving the
            stage.
          </p>
        </UCard>
      </section>
    </div>



    <div v-if="quickLinks.length" class="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        class="pointer-events-auto tele-glass flex w-full max-w-xl items-center justify-between gap-3 rounded-full px-4 py-3 shadow-2xl">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-[0.24em] text-muted">Quick Launch</p>
          <p class="truncate font-mono text-sm font-semibold tracking-[0.16em] text-highlighted">
            {{ createdRoomCode }}
          </p>
        </div>

        <div class="flex flex-wrap justify-end gap-2">
          <UButton v-for="link in quickLinks" :key="link.label" :to="link.to" color="neutral" variant="soft" size="sm">
            <UIcon :name="link.icon" class="size-4" />
            {{ link.label }}
          </UButton>
        </div>
      </div>
    </div>
  </main>
</template>
