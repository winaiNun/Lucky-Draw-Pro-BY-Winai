<template>
  <div
    :class="['rounded-full overflow-hidden flex items-center justify-center flex-shrink-0', sizeClass]"
    :style="!participant.imageUrl && !participant.emoji ? { background: bgColor } : {}"
  >
    <img
      v-if="participant.imageUrl"
      :src="participant.imageUrl"
      :alt="participant.name"
      class="w-full h-full object-cover"
    />
    <span v-else-if="participant.emoji" :style="{ fontSize: emojiFontSize }">
      {{ participant.emoji }}
    </span>
    <span v-else class="font-bold text-white" :style="{ fontSize: letterFontSize }">
      {{ participant.name.charAt(0).toUpperCase() }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { Student } from '~/stores/students'
import { nameToHue } from '~/composables/useEmoji'

const props = defineProps<{
  participant: Student
  size?: number
}>()

const sz = computed(() => props.size ?? 48)

const sizeClass = computed(() => {
  const s = sz.value
  if (s <= 24) return 'w-6 h-6'
  if (s <= 32) return 'w-8 h-8'
  if (s <= 40) return 'w-10 h-10'
  if (s <= 48) return 'w-12 h-12'
  if (s <= 56) return 'w-14 h-14'
  if (s <= 64) return 'w-16 h-16'
  if (s <= 80) return 'w-20 h-20'
  if (s <= 96) return 'w-24 h-24'
  return 'w-28 h-28'
})

const emojiFontSize = computed(() => `${sz.value * 0.6}px`)
const letterFontSize = computed(() => `${sz.value * 0.4}px`)
const bgColor = computed(() => `hsl(${nameToHue(props.participant.name)}, 60%, 35%)`)
</script>
