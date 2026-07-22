<script setup lang="ts">
import { telePageClass } from '~/utils/tailwindSurfaces'

useHead({
  title: 'Pricing | ompt',
  meta: [
    {
      name: 'description',
      content: 'Start ompt for free today and use an instant teleprompter for creators, crews, and budget-friendly productions.'
    }
  ]
})

const pricingMenuLinks = [
  { label: 'Home', to: '/' },
  { label: 'Plans', to: '#plans' },
  { label: 'Compare', to: '#compare' },
  { label: 'FAQ', to: '#faq' }
]

const glassSurfaceClass = 'border border-[color-mix(in_oklab,var(--ui-border)_72%,transparent)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--ui-bg)_82%,transparent),color-mix(in_oklab,var(--ui-bg-muted)_54%,transparent))] shadow-[0_24px_80px_color-mix(in_oklab,var(--ui-text-highlighted)_12%,transparent)] backdrop-blur-[20px] backdrop-saturate-[1.12]'
const planCardRootClass = `rounded-[2rem] h-full ${glassSurfaceClass}`
const faqCardRootClass = `rounded-[1.75rem] h-full ${glassSurfaceClass}`

const plans = [
  {
    name: 'Launch',
    eyebrow: 'Available now',
    price: 'Free',
    detail: 'The instant teleprompter you can use right now.',
    description: 'Built for solo creators, interview setups, video teams, and anyone who wants a capable teleprompter without paying upfront.',
    ctaLabel: 'Start free now',
    to: '/',
    icon: 'i-lucide-radio-tower',
    features: [
      'Start unlimited controller + display rooms',
      'Live sync for playback and script changes',
      'Theme, mirror, and readability controls',
      'Quick QR handoff for display devices'
    ]
  },
  {
    name: 'Studio',
    eyebrow: 'Paid plan',
    price: 'Coming soon',
    detail: 'The first paid tier is in active design.',
    description: 'Made for teams that need more polish around collaboration, reusable setups, and premium production workflows.',
    ctaLabel: 'Coming soon',
    icon: 'i-lucide-sparkles',
    features: [
      'Shared presets and saved room setups',
      'Faster multi-operator handoffs',
      'Production-friendly controls for repeat sessions',
      'Priority access to upcoming workflow tools'
    ]
  }
] as const

const comparisonRows = [
  {
    label: 'Unlimited rooms',
    launch: true,
    studio: true
  },
  {
    label: 'Live controller and display sync',
    launch: true,
    studio: true
  },
  {
    label: 'Theme and readability controls',
    launch: true,
    studio: true
  },
  {
    label: 'Saved presets',
    launch: false,
    studio: 'Coming soon'
  },
  {
    label: 'Team-oriented workflow tools',
    launch: false,
    studio: 'Coming soon'
  },
  {
    label: 'Priority feature access',
    launch: false,
    studio: 'Planned'
  }
] as const

const faqs = [
  {
    question: 'Can I start using ompt for free today?',
    answer: 'Yes. Launch is live now, so you can open a teleprompter room and start reading without waiting for the paid tier.'
  },
  {
    question: 'Is the paid plan available yet?',
    answer: 'Not yet. Studio is intentionally marked as coming soon while the feature set is finalized.'
  },
  {
    question: 'Who is Launch best for?',
    answer: 'It fits solo creators, lean production teams, rehearsals, interviews, and budget-conscious shoots that still need live control and a second-screen display.'
  }
] as const

const availabilityTone = (value: boolean | string) => {
  if (value === true) {
    return 'text-highlighted'
  }

  return 'text-muted'
}

const availabilityLabel = (value: boolean | string) => {
  if (value === true) {
    return 'Included'
  }

  if (value === false) {
    return 'Not yet'
  }

  return value
}
</script>

<template>
  <main :class="[telePageClass, 'min-h-screen px-4 py-6 sm:px-6 lg:px-8']">
    <FloatingThemeMenu />
    <FloatingPillMenu
      aria-label="Pricing"
      :links="pricingMenuLinks"
      action-label="Open app"
      action-to="/"
    />

    <div class="mx-auto flex w-full max-w-7xl flex-col gap-10 pb-20 pt-16 lg:pt-20">
      <section class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,28rem)] lg:items-start">
        <div class="space-y-6">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-default/80 bg-default/75 px-3 py-1 text-sm text-toned shadow-sm backdrop-blur"
          >
            <UIcon name="i-lucide-badge-dollar-sign" class="size-4" />
            Free to start now, paid depth coming soon
          </div>

          <div class="space-y-4">
            <h1 class="max-w-4xl text-5xl font-semibold tracking-tight text-highlighted sm:text-6xl lg:text-7xl">
              Start free today. Upgrade later if your team needs more.
            </h1>
            <p class="max-w-2xl text-lg text-toned sm:text-xl">
              ompt gives you an instant teleprompter right now, with the free Launch plan ready for creators and crews
              and the first paid tier clearly marked as coming soon.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton to="/" size="xl">
              <UIcon name="i-lucide-play" class="size-4" />
              Start free with Launch
            </UButton>
            <UButton to="/" color="neutral" variant="soft" size="xl">
              <UIcon name="i-lucide-arrow-left" class="size-4" />
              Back to home
            </UButton>
          </div>
        </div>

        <div :class="['rounded-[2rem] p-6', glassSurfaceClass]">
          <div class="space-y-5">
            <div class="space-y-1">
              <p class="text-sm font-medium uppercase tracking-[0.24em] text-muted">Current status</p>
              <h2 class="text-2xl font-semibold text-highlighted">Start free now, keep an eye on Studio</h2>
            </div>

            <div class="grid gap-3">
              <div class="rounded-[1.5rem] border border-default/80 bg-default/60 p-4 shadow-sm">
                <p class="text-sm font-medium text-highlighted">Launch is ready</p>
                <p class="mt-1 text-sm text-muted">The current room builder, controller, and display flow is available right now for free.</p>
              </div>
              <div class="rounded-[1.5rem] border border-default/80 bg-default/60 p-4 shadow-sm">
                <p class="text-sm font-medium text-highlighted">Studio is intentionally marked coming soon</p>
                <p class="mt-1 text-sm text-muted">That keeps the offer honest while we shape a paid tier for teams that need more production depth.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" class="grid gap-4 xl:grid-cols-2">
        <UCard
          v-for="plan in plans"
          :key="plan.name"
          :ui="{ root: planCardRootClass, body: 'p-6 sm:p-7' }"
        >
          <div class="flex h-full flex-col gap-6">
            <div class="space-y-4">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <p class="text-xs uppercase tracking-[0.24em] text-muted">{{ plan.eyebrow }}</p>
                  <div class="flex items-center gap-3">
                    <div class="rounded-2xl border border-default/80 bg-default/70 p-3 shadow-sm">
                      <UIcon :name="plan.icon" class="size-5 text-highlighted" />
                    </div>
                    <div>
                      <h2 class="text-2xl font-semibold text-highlighted">{{ plan.name }}</h2>
                      <p class="text-sm text-muted">{{ plan.detail }}</p>
                    </div>
                  </div>
                </div>

                <div class="text-right">
                  <p class="text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">{{ plan.price }}</p>
                </div>
              </div>

              <p class="max-w-xl text-sm leading-6 text-toned">
                {{ plan.description }}
              </p>
            </div>

            <div class="grid gap-3">
              <div
                v-for="feature in plan.features"
                :key="feature"
                class="flex items-start gap-3 rounded-[1.25rem] border border-default/70 bg-default/55 p-3"
              >
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-highlighted" />
                <p class="text-sm text-toned">{{ feature }}</p>
              </div>
            </div>

            <div class="mt-auto">
              <UButton
                v-if="'to' in plan"
                :to="plan.to"
                size="lg"
                class="justify-center"
                block
              >
                {{ plan.ctaLabel }}
              </UButton>
              <UButton
                v-else
                size="lg"
                color="neutral"
                variant="soft"
                class="justify-center"
                block
                disabled
              >
                <UIcon name="i-lucide-clock-3" class="size-4" />
                {{ plan.ctaLabel }}
              </UButton>
            </div>
          </div>
        </UCard>
      </section>

      <section id="compare" :class="['rounded-[2rem] p-6 sm:p-8', glassSurfaceClass]">
        <div class="flex flex-col gap-6">
          <div class="space-y-2">
            <p class="text-sm font-medium uppercase tracking-[0.24em] text-muted">Compare plans</p>
            <h2 class="text-3xl font-semibold tracking-tight text-highlighted">What you get free now and what is coming soon</h2>
          </div>

          <div class="overflow-hidden rounded-[1.5rem] border border-default/80 bg-default/55">
            <div class="grid grid-cols-[minmax(0,1.3fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)] border-b border-default/80 px-4 py-3 text-sm font-medium text-muted sm:px-6">
              <p>Feature</p>
              <p class="text-center">Launch</p>
              <p class="text-center">Studio</p>
            </div>

            <div
              v-for="row in comparisonRows"
              :key="row.label"
              class="grid grid-cols-[minmax(0,1.3fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)] items-center border-b border-default/70 px-4 py-4 last:border-b-0 sm:px-6"
            >
              <p class="pr-4 text-sm text-toned">{{ row.label }}</p>
              <p class="text-center text-sm font-medium" :class="availabilityTone(row.launch)">
                {{ availabilityLabel(row.launch) }}
              </p>
              <p class="text-center text-sm font-medium" :class="availabilityTone(row.studio)">
                {{ availabilityLabel(row.studio) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" class="grid gap-4 lg:grid-cols-3">
        <UCard
          v-for="faq in faqs"
          :key="faq.question"
          :ui="{ root: faqCardRootClass, body: 'p-5' }"
        >
          <p class="text-base font-medium text-highlighted">{{ faq.question }}</p>
          <p class="mt-2 text-sm leading-6 text-muted">{{ faq.answer }}</p>
        </UCard>
      </section>
    </div>
  </main>
</template>
