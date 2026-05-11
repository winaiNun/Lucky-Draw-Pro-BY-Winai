<template>
  <div class="space-y-6">
    <div
      class="relative rounded-3xl overflow-hidden border border-slate-700/50"
      style="height: 520px; background: radial-gradient(ellipse at center, #0c1445 0%, #050a1e 60%, #000 100%);"
    >
      <!-- Stars -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          v-for="star in stars" :key="star.id"
          class="absolute rounded-full bg-white"
          :style="{ left: star.x+'%', top: star.y+'%', width: star.size+'px', height: star.size+'px', opacity: star.opacity }"
        ></div>
      </div>
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at 20% 50%, rgba(76,29,149,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(29,78,149,0.12) 0%, transparent 60%);"></div>

      <!-- Floating Avatars -->
      <TransitionGroup name="avatar">
        <div
          v-for="(student, idx) in store.activePool"
          :key="student.id"
          class="absolute avatar-card"
          :class="[getFloatClass(idx), { spinning: isRandomizing }]"
          :style="getAvatarStyle(idx)"
        >
          <div class="flex flex-col items-center gap-1">
            <AvatarIcon
              :participant="student"
              :size="avatarSize"
              class="border-2 border-violet-400/60 shadow-lg shadow-violet-900/50"
            />
            <span
              class="text-white text-center font-medium bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full"
              :style="{ fontSize: Math.max(8, avatarSize / 4.5) + 'px', maxWidth: (avatarSize + 20) + 'px' }"
            >
              {{ student.name.length > 10 ? student.name.slice(0, 9) + '…' : student.name }}
            </span>
          </div>
        </div>
      </TransitionGroup>

      <!-- Randomizing Overlay -->
      <Transition name="fade">
        <div v-if="isRandomizing" class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="text-center">
            <div class="text-6xl mb-3 animate-spin">✨</div>
            <p class="text-white font-bold text-xl tracking-wider animate-pulse">กำลังสุ่ม...</p>
          </div>
        </div>
      </Transition>
    </div>

    <div class="flex flex-col items-center gap-3">
      <button @click="randomize" :disabled="isRandomizing || store.poolCount === 0" class="btn-primary px-12 py-4 text-lg">
        <span v-if="isRandomizing">🌌 กำลังสุ่ม...</span>
        <span v-else>🚀 สุ่มผู้เข้าร่วม!</span>
      </button>
      <p class="text-slate-400 text-sm">มีผู้เข้าร่วมล่องลอยอยู่ {{ store.poolCount }} คน</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Student } from '~/stores/students'

const emit = defineEmits<{ (e: 'winner', student: Student): void }>()
const store = useStudentStore()
const sound = useSound()
const isRandomizing = ref(false)
let stopSuspense: (() => void) | null = null

const stars = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.7 + 0.1,
}))

const floatClasses = ['animate-float-1','animate-float-2','animate-float-3','animate-float-4','animate-float-5','animate-float-6']
const getFloatClass = (idx: number) => floatClasses[idx % floatClasses.length]

const avatarSize = computed(() => {
  const c = store.activePool.length
  if (c <= 6) return 64
  if (c <= 12) return 52
  if (c <= 20) return 44
  return 36
})

const positions = computed(() => {
  const pool = store.activePool
  const n = pool.length
  if (n === 0) return []
  const margin = 10
  const cols = Math.ceil(Math.sqrt(n * 1.6))
  const rows = Math.ceil(n / cols)
  return pool.map((_, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const cellW = (100 - margin * 2) / cols
    const cellH = (100 - margin * 2) / rows
    return {
      left: margin + col * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.4,
      top: margin + row * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.4,
    }
  })
})

function getAvatarStyle(idx: number) {
  const pos = positions.value[idx]
  if (!pos) return {}
  return {
    left: `calc(${pos.left}% - ${avatarSize.value / 2}px)`,
    top: `calc(${pos.top}% - ${avatarSize.value / 2 + 10}px)`,
    zIndex: 5,
    animationDelay: `${(idx * 0.7) % 3}s`,
  }
}

function randomize() {
  if (isRandomizing.value || store.activePool.length === 0) return
  if (store.activePool.length === 1) { emit('winner', store.activePool[0]); return }
  isRandomizing.value = true
  stopSuspense = sound.startSuspense()
  setTimeout(() => {
    stopSuspense?.()
    stopSuspense = null
    const winner = store.getRandomStudent()
    isRandomizing.value = false
    if (winner) setTimeout(() => emit('winner', winner), 200)
  }, 2500)
}

onUnmounted(() => { stopSuspense?.() })
</script>

<style scoped>
.avatar-enter-active, .avatar-leave-active { transition: all 0.4s ease; }
.avatar-enter-from, .avatar-leave-to { opacity: 0; transform: scale(0.5); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
