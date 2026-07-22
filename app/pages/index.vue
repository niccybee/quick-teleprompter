<script setup lang="ts">
import { telePageClass } from '~/utils/tailwindSurfaces'

useHead({
  title: 'ompt | Start a free teleprompter instantly',
  meta: [
    {
      name: 'description',
      content: 'Start a free teleprompter in seconds with synced controller and display screens for creators, crews, and budget-friendly shoots.'
    }
  ]
})

const joinCode = ref('')
const creating = ref(false)
const createSectionReady = ref(false)
const startWorkbenchOpen = ref(false)

const homeMenuLinks = [
  { label: 'Start free', to: '#launch' },
  { label: 'Flow', to: '#flow' },
  { label: 'Pricing', to: '/pricing' }
]

onMounted(() => {
  requestAnimationFrame(() => {
    createSectionReady.value = true
  })
})

const createRoom = async () => {
  creating.value = true
  try {
    const { roomCode } = await $fetch<{ roomCode: string }>('/api/session/create', {
      method: 'POST'
    })

    await navigateTo({
      path: `/controller/${roomCode}`,
      query: { pairing: 'display' }
    })
  }
  finally {
    creating.value = false
  }
}

const normalizedJoinCode = computed(() => joinCode.value.toUpperCase().trim())
const canJoin = computed(() => normalizedJoinCode.value.length === 6)

const workbenchSteps = [
  {
    label: 'Create',
    title: 'Start a room in seconds',
    body: 'Spin up a free teleprompter, hand the display screen a QR code, and keep the controller on your device.',
    icon: 'i-lucide-radio-tower'
  },
  {
    label: 'Load',
    title: 'Bring in the script',
    body: 'Paste markdown or import a Google Doc once you are inside the controller view.',
    icon: 'i-lucide-file-text'
  },
  {
    label: 'Run',
    title: 'Keep the take moving',
    body: 'Step manually, autoplay, free-scroll, mirror, and tune display settings while the screen stays synced.',
    icon: 'i-lucide-sliders-horizontal'
  }
]

const sessionSpecs = [
  ['Room', 'Free launch in seconds', 'Share by QR or direct link'],
  ['Views', 'Controller + Display', 'Separate devices stay in lockstep'],
  ['Input', 'Markdown + Google Docs', 'Load the script from the controller'],
  ['Display', 'Comfort controls built in', 'Themes, mirroring, and readability stay available']
]

const labelClass = 'm-0 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-muted'
const sectionTitleClass = 'm-0 text-[clamp(1.25rem,2vw,1.8rem)] font-[780] leading-[1.05] tracking-normal text-highlighted'
const panelTextClass = 'm-0 leading-[1.6] text-toned'
const consoleSurfaceClass = 'grid gap-6 rounded-3xl border border-default bg-[linear-gradient(180deg,color-mix(in_oklch,var(--ui-bg)_82%,transparent),color-mix(in_oklch,var(--ui-bg-muted)_54%,transparent))] p-6 text-highlighted shadow-[0_24px_70px_color-mix(in_oklch,var(--ui-text-highlighted)_14%,transparent)] backdrop-blur-[18px] backdrop-saturate-[1.1] sm:p-10'
const panelSurfaceClass = 'grid min-h-60 content-start gap-4 rounded-2xl border border-default/60 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--ui-bg)_76%,transparent),color-mix(in_oklch,var(--ui-bg-muted)_46%,transparent))] p-6 backdrop-blur-[14px] backdrop-saturate-[1.08]'
const stepSurfaceClass = 'grid min-h-72 gap-6 rounded-2xl border border-default/60 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--ui-bg)_74%,transparent),color-mix(in_oklch,var(--ui-bg-muted)_42%,transparent))] p-6 backdrop-blur-[14px] backdrop-saturate-[1.08] first:border-default first:bg-[linear-gradient(180deg,color-mix(in_oklch,var(--ui-bg)_82%,transparent),color-mix(in_oklch,var(--ui-bg-muted)_54%,transparent))] max-lg:min-h-0'
</script>

<template>
  <main :class="[telePageClass, 'min-h-screen overflow-x-clip px-4 py-6 font-sans text-highlighted sm:px-6 lg:px-8']">
    <FloatingThemeMenu />

    <FloatingPillMenu
      aria-label="Homepage"
      :links="homeMenuLinks"
      action-label="Start free"
      :action-loading="creating"
      :action-disabled="!createSectionReady"
      @action="createRoom"
    />

    <div class="mx-auto mt-16 w-[min(100%,74rem)] sm:mt-24">
      <section id="launch" class="grid items-center gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(22rem,1fr)] lg:gap-16">
        <div class="grid gap-6">
          <p :class="labelClass">ompt.io · instant teleprompter · free to start</p>
          <h1 class="m-0 max-w-[11ch] text-[clamp(3rem,16vw,4.6rem)] font-[850] leading-[0.86] tracking-normal text-highlighted lg:text-[clamp(3.1rem,7vw,7.4rem)]">
            Start free before the camera rolls.
          </h1>
          <p class="m-0 max-w-[35rem] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-[1.7] text-toned">
            ompt spins up an instant teleprompter for your script. Put the display on a second screen, keep the
            controller in your hand, and start reading in seconds whether you are filming solo or running a lean crew.
          </p>
          <UButton size="lg" color="primary" variant="solid" class="w-full justify-center sm:w-fit" @click="startWorkbenchOpen = true">
            <UIcon name="i-lucide-play" class="size-4" />
            Start free now
          </UButton>
        </div>

        <section :class="[consoleSurfaceClass, 'hidden lg:grid']" aria-label="Session launch workbench">
          <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p :class="labelClass">Session workbench</p>
              <h2 :class="sectionTitleClass">Create or join</h2>
            </div>
            <div class="flex flex-wrap items-center gap-[0.35rem] font-mono text-[0.72rem] text-muted lg:justify-end">
              <span>Home</span>
              <UIcon name="i-lucide-chevron-right" class="size-4" />
              <span>Controller</span>
              <UIcon name="i-lucide-chevron-right" class="size-4" />
              <span>Display</span>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div :class="panelSurfaceClass">
              <div class="inline-flex items-center gap-3 font-[780] text-highlighted">
                <UIcon name="i-lucide-plus" class="size-4" />
                <span>Create</span>
              </div>
              <p :class="panelTextClass">Generate a free room and a QR code for the display device.</p>
              <UButton
                size="xl"
                :loading="creating || !createSectionReady"
                :disabled="!createSectionReady"
                class="mt-auto w-full justify-center"
                @click="createRoom"
              >
                Start Free Room
              </UButton>
            </div>

            <div :class="panelSurfaceClass">
              <div class="inline-flex items-center gap-3 font-[780] text-highlighted">
                <UIcon name="i-lucide-key-round" class="size-4" />
                <span>Join</span>
              </div>
              <p :class="panelTextClass">Already have a room code? Open the controller or display you need.</p>
              <UInput
                v-model="joinCode"
                placeholder="ABC123"
                size="xl"
                class="w-full"
                :ui="{ base: 'font-mono tracking-[0.24em] uppercase text-center' }"
              />
              <div class="flex flex-wrap gap-3">
                <UButton
                  :to="canJoin ? `/controller/${normalizedJoinCode}` : undefined"
                  :disabled="!canJoin"
                  size="lg"
                >
                  <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
                  Controller
                </UButton>
                <UButton
                  :to="canJoin ? `/display/${normalizedJoinCode}` : undefined"
                  :disabled="!canJoin"
                  size="lg"
                  color="neutral"
                  variant="soft"
                >
                  <UIcon name="i-lucide-monitor-play" class="size-4" />
                  Display
                </UButton>
              </div>
            </div>
          </div>

        </section>
      </section>

      <UModal
        v-model:open="startWorkbenchOpen"
        title="Start free"
        description="Create or join an instant ompt teleprompter."
        :ui="{
          overlay: 'bg-default/70 backdrop-blur-md',
          content: '!w-[calc(100vw-2rem)] !max-w-3xl !bg-transparent !shadow-none !ring-0 !divide-y-0 !overflow-visible data-[state=open]:animate-[slide-in-from-right_260ms_ease-out] data-[state=closed]:animate-[slide-out-to-right_180ms_ease-in]'
        }"
      >
        <template #content="{ close }">
          <section :class="[consoleSurfaceClass, 'relative max-h-[calc(100dvh-2rem)] overflow-y-auto']" aria-label="Start free session workbench">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-x"
              aria-label="Close start free modal"
              class="absolute right-4 top-4 z-10"
              @click="close"
            />

            <div class="grid items-start gap-6 pr-10 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p :class="labelClass">Session workbench</p>
                <h2 :class="sectionTitleClass">Create or join</h2>
              </div>
              <div class="flex flex-wrap items-center gap-[0.35rem] font-mono text-[0.72rem] text-muted lg:justify-end">
                <span>Home</span>
                <UIcon name="i-lucide-chevron-right" class="size-4" />
                <span>Controller</span>
                <UIcon name="i-lucide-chevron-right" class="size-4" />
                <span>Display</span>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <div :class="panelSurfaceClass">
                <div class="inline-flex items-center gap-3 font-[780] text-highlighted">
                  <UIcon name="i-lucide-plus" class="size-4" />
                  <span>Create</span>
                </div>
                <p :class="panelTextClass">Generate a free room and a QR code for the display device.</p>
                <UButton
                  size="xl"
                  :loading="creating || !createSectionReady"
                  :disabled="!createSectionReady"
                  class="mt-auto w-full justify-center"
                  @click="createRoom"
                >
                  Start Free Room
                </UButton>
              </div>

              <div :class="panelSurfaceClass">
                <div class="inline-flex items-center gap-3 font-[780] text-highlighted">
                  <UIcon name="i-lucide-key-round" class="size-4" />
                  <span>Join</span>
                </div>
                <p :class="panelTextClass">Already have a room code? Open the controller or display you need.</p>
                <UInput
                  v-model="joinCode"
                  placeholder="ABC123"
                  size="xl"
                  class="w-full"
                  :ui="{ base: 'font-mono tracking-[0.24em] uppercase text-center' }"
                />
                <div class="flex flex-wrap gap-3">
                  <UButton
                    :to="canJoin ? `/controller/${normalizedJoinCode}` : undefined"
                    :disabled="!canJoin"
                    size="lg"
                  >
                    <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
                    Controller
                  </UButton>
                  <UButton
                    :to="canJoin ? `/display/${normalizedJoinCode}` : undefined"
                    :disabled="!canJoin"
                    size="lg"
                    color="neutral"
                    variant="soft"
                  >
                    <UIcon name="i-lucide-monitor-play" class="size-4" />
                    Display
                  </UButton>
                </div>
              </div>
            </div>

          </section>
        </template>
      </UModal>

      <section id="flow" class="mt-16 grid gap-4 lg:grid-cols-3" aria-label="How the room runs">
        <article v-for="step in workbenchSteps" :key="step.label" :class="stepSurfaceClass">
          <div class="inline-flex size-10 items-center justify-center gap-3 rounded-full border border-default bg-[linear-gradient(180deg,color-mix(in_oklch,var(--ui-bg)_76%,transparent),color-mix(in_oklch,var(--ui-bg-muted)_46%,transparent))] font-[780] text-highlighted">
            <UIcon :name="step.icon" class="size-5" />
          </div>
          <div>
            <p :class="labelClass">{{ step.label }}</p>
            <h2 :class="sectionTitleClass">{{ step.title }}</h2>
            <p :class="panelTextClass">{{ step.body }}</p>
          </div>
        </article>
      </section>

      <section
        id="spec"
        class="mt-6 grid gap-8 rounded-[2rem] border border-default/80 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--ui-bg)_76%,transparent),color-mix(in_oklch,var(--ui-bg-muted)_44%,transparent))] px-6 py-8 shadow-[0_24px_70px_color-mix(in_oklch,var(--ui-text-highlighted)_10%,transparent)] backdrop-blur-[16px] backdrop-saturate-[1.08] sm:px-8 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start lg:gap-10"
        aria-label="ompt session capabilities"
      >
        <div class="grid gap-4 lg:pt-2">
          <h2 :class="sectionTitleClass">Built for fast reads, lean budgets, and real shoots.</h2>
          <p class="m-0 text-base leading-[1.6] text-toned">
            Use ompt when you need a teleprompter right now, whether you are creating alone, handing off between
            operator and talent, or keeping production simple without adding more gear or software.
          </p>
        </div>

        <div class="w-full overflow-hidden rounded-[1.5rem] border border-default/70 bg-default/35" role="table" aria-label="ompt session spec">
          <div
            v-for="row in sessionSpecs"
            :key="row[0]"
            class="grid gap-3 border-b border-default/60 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(5.5rem,0.52fr)_minmax(10rem,1fr)_minmax(12rem,1.15fr)] md:gap-5 md:px-5"
            role="row"
          >
            <p class="m-0 font-mono text-[0.82rem] uppercase leading-[1.6] text-muted" role="cell">{{ row[0] }}</p>
            <p class="m-0 leading-[1.6] text-toned" role="cell">{{ row[1] }}</p>
            <p class="m-0 leading-[1.6] text-toned" role="cell">{{ row[2] }}</p>
          </div>
        </div>
      </section>

      <footer class="mb-24 mt-10 flex flex-col justify-between gap-4 font-mono text-[0.8rem] text-muted sm:flex-row">
        <p class="m-0">ompt.io · instant teleprompter rooms · obair.tech 2026</p>
        <p class="m-0">Start free · control live · display anywhere</p>
      </footer>
    </div>
  </main>
</template>
