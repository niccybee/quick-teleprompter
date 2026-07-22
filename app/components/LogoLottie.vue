<script setup lang="ts">
import logoSvg from '~/assets/logo/logo.svg?raw'
import type { AnimationItem } from 'lottie-web'

const props = withDefaults(defineProps<{
  fill?: string
}>(), {
  fill: 'black'
})

const container = shallowRef<HTMLElement | null>(null)
let animation: AnimationItem | undefined

const logoUrl = computed(() => {
  const safeFill = props.fill.replace(/[<>"']/g, '')
  const svg = logoSvg.replaceAll('fill="black"', `fill="${safeFill}"`)

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
})

const createLogoAnimation = () => ({
  v: '5.13.0',
  fr: 60,
  ip: 0,
  op: 168,
  w: 1934,
  h: 632,
  nm: 'ompt logo reveal',
  ddd: 0,
  assets: [
    {
      id: 'logo',
      w: 1934,
      h: 632,
      u: '',
      p: logoUrl.value,
      e: 0
    }
  ],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 2,
      nm: 'Logo SVG',
      refId: 'logo',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [100], i: { x: [0.16], y: [1] }, o: { x: [0.4], y: [0] } },
            { t: 28, s: [100] }
          ]
        },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [967, 348, 0], e: [967, 316, 0], i: { x: [0.16], y: [1] }, o: { x: [0.4], y: [0] } },
            { t: 72, s: [967, 316, 0] }
          ]
        },
        a: { a: 0, k: [967, 316, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [96, 96, 100], e: [100, 100, 100], i: { x: [0.16], y: [1] }, o: { x: [0.4], y: [0] } },
            { t: 72, s: [100, 100, 100] },
            { t: 120, s: [100, 100, 100], e: [98, 98, 100], i: { x: [0.45], y: [1] }, o: { x: [0.4], y: [0] } },
            { t: 168, s: [98, 98, 100] }
          ]
        }
      },
      ao: 0,
      ip: 0,
      op: 168,
      st: 0,
      bm: 0
    }
  ],
  markers: []
})

const loadLogoAnimation = async () => {
  if (!container.value) {
    return
  }

  animation?.destroy()

  const { default: lottie } = await import('lottie-web/build/player/lottie_light')

  animation = lottie.loadAnimation({
    container: container.value,
    renderer: 'svg',
    loop: false,
    autoplay: true,
    animationData: createLogoAnimation()
  })
}

const play = () => {
  animation?.play()
}

const pause = () => {
  animation?.pause()
}

const stop = () => {
  animation?.stop()
}

const restart = () => {
  animation?.goToAndPlay(0, true)
}

defineExpose({
  play,
  pause,
  stop,
  restart
})

onMounted(async () => {
  await loadLogoAnimation()
})

watch(() => props.fill, async () => {
  await loadLogoAnimation()
})

onBeforeUnmount(() => {
  animation?.destroy()
})
</script>

<template>
  <div ref="container" class="aspect-[1934/632] w-[min(100%,54rem)]" aria-label="ompt logo animation" />
</template>
