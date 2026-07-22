<script setup lang="ts">
import logoSvgUrl from '~/assets/logo/logo.svg'

type FloatingPillMenuLink = {
  label: string
  to: string
}

const props = withDefaults(defineProps<{
  links?: FloatingPillMenuLink[]
  actionLabel?: string
  actionTo?: string
  actionLoading?: boolean
  actionDisabled?: boolean
  ariaLabel?: string
  class?: string
}>(), {
  links: () => [],
  actionLabel: '',
  actionTo: '',
  actionLoading: false,
  actionDisabled: false,
  ariaLabel: 'Primary navigation',
  class: ''
})

const emit = defineEmits<{
  action: []
}>()

const logoMaskStyle = {
  '--floating-pill-logo-mask': `url(${logoSvgUrl})`
}

const navClass = [
  'fixed left-1/2 top-4 z-40 grid min-h-[3.25rem] w-[min(100%,43rem)] -translate-x-1/2 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-full border border-[color-mix(in_oklch,var(--ui-border)_72%,transparent)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--ui-bg)_72%,transparent),color-mix(in_oklch,var(--ui-bg-muted)_64%,transparent))] px-3 py-2 text-highlighted shadow-[0_24px_70px_color-mix(in_oklch,var(--ui-text-highlighted)_12%,transparent),inset_0_1px_0_color-mix(in_oklch,var(--ui-text-inverted)_12%,transparent)] backdrop-blur-[24px] backdrop-saturate-[1.18]',
  'max-md:left-4 max-md:w-[calc(100%-4.5rem)] max-md:translate-x-0 max-md:grid-cols-[1fr_auto]'
]

const wordmarkClass = 'inline-flex min-h-9 w-[6.35rem] items-center justify-center text-inherit no-underline'
const logoClass = 'block h-[1.7rem] w-[5.5rem] bg-current [mask:var(--floating-pill-logo-mask)_center/contain_no-repeat] [-webkit-mask:var(--floating-pill-logo-mask)_center/contain_no-repeat]'
const linksClass = 'flex min-w-0 justify-center gap-3 text-sm text-muted max-md:hidden'
const linkClass = 'rounded-full px-[0.65rem] py-[0.45rem] text-inherit no-underline transition-[color,background] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-[1ms] hover:bg-[color-mix(in_oklch,var(--ui-bg-muted)_72%,var(--ui-text-highlighted)_5%)] hover:text-highlighted focus-visible:bg-[color-mix(in_oklch,var(--ui-bg-muted)_72%,var(--ui-text-highlighted)_5%)] focus-visible:text-highlighted [&.router-link-active]:bg-[color-mix(in_oklch,var(--ui-bg-muted)_72%,var(--ui-text-highlighted)_5%)] [&.router-link-active]:text-highlighted'
const actionWrapClass = 'inline-flex [&_[data-slot=base]]:rounded-full [&_[data-slot=base]]:px-4'

const handleAction = () => {
  if (!props.actionTo) {
    emit('action')
  }
}
</script>

<template>
  <nav :class="[navClass, props.class]" :aria-label="props.ariaLabel">
    <NuxtLink to="/" :class="wordmarkClass" aria-label="ompt home">
      <span :class="logoClass" :style="logoMaskStyle" aria-hidden="true" />
    </NuxtLink>

    <div v-if="links.length" :class="linksClass" aria-label="Page links">
      <NuxtLink v-for="link in links" :key="`${link.label}-${link.to}`" :to="link.to" :class="linkClass">
        {{ link.label }}
      </NuxtLink>
    </div>

    <span v-if="actionLabel" :class="actionWrapClass">
      <UButton
        size="sm"
        :to="actionTo || undefined"
        :loading="actionLoading"
        :disabled="actionDisabled"
        @click="handleAction"
      >
        {{ actionLabel }}
      </UButton>
    </span>
  </nav>
</template>
