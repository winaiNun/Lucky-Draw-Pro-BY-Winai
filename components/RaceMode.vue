<template>
  <div class="space-y-5">
    <div class="card overflow-hidden">
      <!-- Header -->
      <div class="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between bg-slate-800/80">
        <div class="flex items-center gap-3">
          <span class="text-xl">🏁</span>
          <div>
            <p class="font-bold text-white text-sm">สนามแข่งขัน</p>
            <p class="text-xs text-slate-400">{{ store.poolCount }} คนเข้าร่วม</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <div v-if="phase==='ready'"    class="flex items-center gap-1.5 text-slate-400"><span class="w-2 h-2 rounded-full bg-slate-500"></span>รอเริ่ม</div>
          <div v-if="phase==='racing'"   class="flex items-center gap-1.5 text-yellow-400 animate-pulse"><span class="w-2 h-2 rounded-full bg-yellow-400"></span>กำลังแข่ง!</div>
          <div v-if="phase==='settling'" class="flex items-center gap-1.5 text-orange-400 animate-pulse"><span class="w-2 h-2 rounded-full bg-orange-400"></span>เข้าสู่เส้นชัย!</div>
          <div v-if="phase==='done'"     class="flex items-center gap-1.5 text-emerald-400"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>เสร็จสิ้น</div>
        </div>
      </div>

      <!-- Track area -->
      <div class="p-3 bg-slate-900/60">
        <!-- Lane headers -->
        <div class="flex items-center mb-1 px-1" style="padding-left: 140px;">
          <div class="flex-1 relative h-4">
            <span class="absolute left-0 text-xs text-emerald-500/70 font-mono">START</span>
            <span class="absolute right-0 text-xs text-yellow-400/80 font-mono">🏁 FINISH</span>
          </div>
        </div>

        <!-- Race lanes (sorted by progress, smooth re-order) -->
        <div class="relative" :style="{ height: arenaH + 'px' }">
          <div
            v-for="(p, sortedIdx) in sortedParticipants"
            :key="p.id"
            class="absolute w-full flex items-center gap-2 transition-transform duration-300 ease-in-out"
            :style="{ transform: `translateY(${sortedIdx * ROW_H}px)`, height: ROW_H + 'px' }"
          >
            <!-- Left: rank + info -->
            <div class="flex items-center gap-2 flex-shrink-0" style="width:138px;">
              <div class="w-7 text-center flex-shrink-0">
                <span v-if="sortedIdx===0" class="text-lg">🥇</span>
                <span v-else-if="sortedIdx===1" class="text-lg">🥈</span>
                <span v-else-if="sortedIdx===2" class="text-lg">🥉</span>
                <span v-else class="text-xs font-bold text-slate-500">{{ sortedIdx+1 }}</span>
              </div>
              <AvatarIcon :participant="p" :size="30" class="border flex-shrink-0" :class="getAvatarBorder(sortedIdx)" />
              <span class="text-xs text-slate-300 truncate leading-tight" style="max-width:72px;">{{ p.name }}</span>
            </div>

            <!-- Track lane -->
            <div class="flex-1 relative" :style="{ height: (ROW_H-8)+'px' }">
              <!-- Lane background -->
              <div
                class="absolute inset-y-1 inset-x-0 rounded-lg"
                :class="getLaneBg(sortedIdx)"
              ></div>
              <!-- Start line -->
              <div class="absolute left-0 top-0 bottom-0 w-0.5 rounded-l bg-emerald-500/50"></div>
              <!-- Finish line -->
              <div class="absolute right-0 top-0 bottom-0 w-1 rounded-r" style="background: repeating-linear-gradient(180deg,#fbbf24 0px,#fbbf24 4px,#1e293b 4px,#1e293b 8px);"></div>

              <!-- Moving avatar -->
              <div
                class="absolute top-1/2 -translate-y-1/2 transition-all duration-100 ease-linear"
                :style="{ left: `calc(${clampProgress(p.id)}% * (100% - 44px) / 100%)` }"
              >
                <div class="relative">
                  <AvatarIcon
                    :participant="p"
                    :size="38"
                    class="border-2 shadow-lg"
                    :class="getAvatarBorder(sortedIdx)"
                    :style="{ filter: sortedIdx === 0 ? 'drop-shadow(0 0 6px rgba(250,204,21,0.8))' : 'none' }"
                  />
                  <!-- Speed trail -->
                  <div v-if="phase==='racing'||phase==='settling'"
                    class="absolute right-full top-1/2 -translate-y-1/2 flex gap-0.5 pr-1 opacity-60">
                    <div v-for="t in 3" :key="t" class="w-1 h-1 rounded-full"
                      :class="sortedIdx===0 ? 'bg-yellow-400' : sortedIdx===1 ? 'bg-slate-300' : sortedIdx===2 ? 'bg-orange-400' : 'bg-violet-400'"
                      :style="{ opacity: (4-t)/4, width: (4-t)*3+'px' }" />
                  </div>
                </div>
              </div>

              <!-- Finish flag for completed -->
              <div v-if="(progress[p.id]??0)>=100"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-sm animate-bounce">🏁</div>

              <!-- Speed label -->
              <div v-if="phase==='racing'||phase==='settling'"
                class="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono opacity-50"
                :class="sortedIdx===0?'text-yellow-400':sortedIdx===1?'text-slate-300':sortedIdx===2?'text-orange-400':'text-slate-500'">
                {{ getSpeedLabel(p.id) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Excitement -->
    <Transition name="fade">
      <div v-if="phase==='settling'" class="text-center">
        <p class="text-xl font-black text-yellow-400 animate-pulse tracking-wider">⚡ เข้าสู่เส้นชัย! ⚡</p>
      </div>
    </Transition>

    <!-- Controls -->
    <div class="flex flex-col items-center gap-3">
      <button
        @click="startRace"
        :disabled="phase==='racing'||phase==='settling'||store.poolCount<2"
        class="btn-primary px-12 py-4 text-lg"
      >
        <span v-if="phase==='racing'||phase==='settling'">🏎️ กำลังแข่ง...</span>
        <span v-else-if="phase==='done'">🔄 แข่งใหม่อีกครั้ง!</span>
        <span v-else>🏁 เริ่มการแข่งขัน!</span>
      </button>
      <p class="text-slate-400 text-sm">มีผู้เข้าร่วม {{ store.poolCount }} คน • สุ่มอันดับอัตโนมัติ</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Student } from '~/stores/students'

const emit  = defineEmits<{ (e: 'ranking', ranked: Student[]): void }>()
const store = useStudentStore()
const sound = useSound()

const ROW_H = 56
const arenaH = computed(() => store.activePool.length * ROW_H)

type Phase = 'ready' | 'racing' | 'settling' | 'done'
const phase         = ref<Phase>('ready')
const progress      = ref<Record<string | number, number>>({})
const speedMap: Record<string | number, number> = {}
const finalRanking  = ref<Student[]>([])

let speedTimer  = 0; let tickTimer  = 0
let raceEndTimer = 0; let settleTimer = 0
let stopEngine: (() => void) | null = null

const CHAOS_DURATION  = 5000
const SETTLE_DURATION = 3000
const TOTAL_DURATION  = CHAOS_DURATION + SETTLE_DURATION

const sortedParticipants = computed(() =>
  [...store.activePool].sort((a, b) => (progress.value[b.id] ?? 0) - (progress.value[a.id] ?? 0))
)

function clampProgress(id: string | number) {
  return Math.min(100, Math.max(0, progress.value[id] ?? 0))
}

function getSpeedLabel(id: string | number) {
  return Math.round((speedMap[id] ?? 1) * 80) + 'km'
}

function getLaneBg(idx: number) {
  if (idx === 0) return 'bg-yellow-500/8 border border-yellow-500/20'
  if (idx === 1) return 'bg-slate-400/8 border border-slate-400/15'
  if (idx === 2) return 'bg-orange-700/8 border border-orange-700/15'
  return 'bg-slate-800/40 border border-slate-700/15'
}

function getAvatarBorder(idx: number) {
  if (idx === 0) return 'border-yellow-400/80'
  if (idx === 1) return 'border-slate-300/60'
  if (idx === 2) return 'border-orange-500/60'
  return 'border-slate-600/40'
}

function clearTimers() {
  clearInterval(speedTimer); clearInterval(tickTimer)
  clearTimeout(raceEndTimer); clearTimeout(settleTimer)
  stopEngine?.(); stopEngine = null
}

function startRace() {
  if (store.activePool.length < 2) return
  clearTimers()
  finalRanking.value = store.getFullRanking()
  const n = finalRanking.value.length

  const initProg: Record<string | number, number> = {}
  store.activePool.forEach(p => { initProg[p.id] = 0; speedMap[p.id] = 0.8 + Math.random() * 0.8 })
  progress.value = initProg
  phase.value    = 'racing'

  sound.raceCountdown()
  stopEngine = sound.startEngine()

  // Chaos speed randomiser
  speedTimer = window.setInterval(() => {
    store.activePool.forEach(p => { speedMap[p.id] = 0.3 + Math.random() * 2.0 })
  }, 250)

  // Progress tick
  tickTimer = window.setInterval(() => {
    const np = { ...progress.value }
    store.activePool.forEach(p => { np[p.id] = Math.min(97, (np[p.id] ?? 0) + speedMap[p.id] * 0.6) })
    progress.value = np
  }, 50)

  // Settle phase
  settleTimer = window.setTimeout(() => {
    phase.value = 'settling'
    clearInterval(speedTimer)
    speedTimer = window.setInterval(() => {
      finalRanking.value.forEach((p, i) => {
        const rf = 1 - (i / Math.max(n - 1, 1))
        speedMap[p.id] = 0.2 + rf * 2.5 + Math.random() * 0.3
      })
    }, 200)
  }, CHAOS_DURATION)

  // End race
  raceEndTimer = window.setTimeout(() => {
    clearTimers()
    sound.raceFinish()
    const fp: Record<string | number, number> = {}
    finalRanking.value.forEach((p, i) => { fp[p.id] = 100 - i * (3 / Math.max(n - 1, 1)) })
    progress.value = fp
    phase.value    = 'done'
    setTimeout(() => emit('ranking', finalRanking.value), 600)
  }, TOTAL_DURATION)
}

onUnmounted(() => clearTimers())
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition:opacity 0.3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
