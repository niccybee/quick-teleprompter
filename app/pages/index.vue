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
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold">Teleprompter</h1>
      <p class="text-muted">Create a room, open display on one screen, and control from another.</p>
    </header>

    <UCard>
      <template #header>
        <h2 class="text-xl font-medium">Create Session</h2>
      </template>

      <div class="space-y-4">
        <UButton :loading="creating" @click="createRoom">Create Room</UButton>

        <div v-if="createdRoomCode" class="space-y-3">
          <p>
            Room code:
            <span class="font-mono text-xl">{{ createdRoomCode }}</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton :to="`/controller/${createdRoomCode}`">Open Controller</UButton>
            <UButton :to="`/display/${createdRoomCode}`" variant="soft">Open Display</UButton>
          </div>
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="Display QR code" class="w-40 rounded border border-default" />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-xl font-medium">Join Existing Room</h2>
      </template>

      <div class="flex flex-col gap-4 sm:flex-row">
        <UInput v-model="joinCode" placeholder="Enter room code" class="sm:max-w-sm" />
        <div class="flex gap-2">
          <UButton :to="`/controller/${normalizedJoinCode}`" :disabled="normalizedJoinCode.length !== 6">
            Controller
          </UButton>
          <UButton :to="`/display/${normalizedJoinCode}`" :disabled="normalizedJoinCode.length !== 6" variant="soft">
            Display
          </UButton>
        </div>
      </div>
    </UCard>
  </main>
</template>
