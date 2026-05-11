<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal -->
      <div class="relative z-10 card max-w-xl w-full shadow-2xl border-yellow-500/20 animate-zoom-in overflow-hidden max-h-[90vh] flex flex-col">

        <!-- Header -->
        <div class="bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-transparent px-6 pt-6 pb-4 border-b border-yellow-500/20 flex-shrink-0">
          <button @click="$emit('close')" class="absolute top-4 right-4 text-slate-500 hover:text-white text-xl">✕</button>
          <div class="flex items-center gap-3">
            <span class="text-3xl">🏆</span>
            <div>
              <h2 class="text-xl font-black text-white">ผลการแข่งขัน</h2>
              <p class="text-slate-400 text-sm">ผู้เข้าแข่งขัน {{ ranking.length }} คน</p>
            </div>
          </div>
        </div>

        <!-- Podium Top 3 -->
        <div class="px-6 py-5 flex-shrink-0">
          <div class="flex items-end justify-center gap-3">
            <!-- 2nd place -->
            <div v-if="ranking[1]" class="flex flex-col items-center gap-2 animate-zoom-in" style="animation-delay:0.15s">
              <AvatarIcon :participant="ranking[1]" :size="56" class="border-2 border-slate-300/60 shadow-lg" />
              <p class="text-xs text-white font-semibold text-center max-w-16 truncate">{{ ranking[1].name }}</p>
              <div class="w-20 bg-slate-400/20 border border-slate-400/40 rounded-t-xl flex items-center justify-center py-3">
                <span class="text-2xl">🥈</span>
              </div>
            </div>

            <!-- 1st place -->
            <div v-if="ranking[0]" class="flex flex-col items-center gap-2 animate-zoom-in" style="animation-delay:0.05s">
              <div class="text-3xl text-center">👑</div>
              <AvatarIcon :participant="ranking[0]" :size="72" class="border-4 border-yellow-400/80 shadow-xl shadow-yellow-900/50 animate-pulse-glow" />
              <p class="text-sm text-white font-bold text-center max-w-20 truncate">{{ ranking[0].name }}</p>
              <div class="w-24 bg-yellow-500/20 border border-yellow-500/40 rounded-t-xl flex items-center justify-center py-5">
                <span class="text-2xl">🥇</span>
              </div>
            </div>

            <!-- 3rd place -->
            <div v-if="ranking[2]" class="flex flex-col items-center gap-2 animate-zoom-in" style="animation-delay:0.25s">
              <AvatarIcon :participant="ranking[2]" :size="48" class="border-2 border-orange-500/60 shadow-lg" />
              <p class="text-xs text-white font-semibold text-center max-w-16 truncate">{{ ranking[2].name }}</p>
              <div class="w-20 bg-orange-700/20 border border-orange-700/40 rounded-t-xl flex items-center justify-center py-2">
                <span class="text-2xl">🥉</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Full Ranking List -->
        <div class="px-6 pb-2 flex-1 overflow-y-auto min-h-0">
          <p class="text-xs text-slate-500 uppercase tracking-wider mb-3">อันดับทั้งหมด</p>
          <div class="space-y-1.5">
            <div
              v-for="(p, idx) in ranking"
              :key="p.id"
              class="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors"
              :class="idx < 3 ? 'bg-slate-700/60' : 'bg-slate-800/40 hover:bg-slate-700/40'"
            >
              <div class="w-7 text-center flex-shrink-0">
                <span v-if="idx === 0" class="text-base">🥇</span>
                <span v-else-if="idx === 1" class="text-base">🥈</span>
                <span v-else-if="idx === 2" class="text-base">🥉</span>
                <span v-else class="text-xs font-bold text-slate-500">{{ idx + 1 }}</span>
              </div>
              <AvatarIcon :participant="p" :size="32" class="border border-slate-600/40" />
              <span class="text-sm text-white font-medium flex-1 truncate">{{ p.name }}</span>
              <span class="text-xs text-slate-500">ID: {{ p.id }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="px-6 py-4 border-t border-slate-700/60 space-y-2 flex-shrink-0">
          <div class="grid grid-cols-2 gap-2">
            <button @click="$emit('removeTop1')" class="btn-danger text-sm py-2.5">
              ❌ นำอันดับ 1 ออก
            </button>
            <button @click="$emit('removeTop3')" :disabled="ranking.length < 3" class="btn-secondary text-sm py-2.5">
              ❌ นำ Top 3 ออก
            </button>
          </div>
          <button @click="$emit('close')" class="btn-primary w-full py-3">
            ✅ ปิดและเก็บรายชื่อไว้
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Student } from '~/stores/students'

defineProps<{ ranking: Student[] }>()
defineEmits<{
  (e: 'close'): void
  (e: 'removeTop1'): void
  (e: 'removeTop3'): void
}>()

const sound = useSound()

onMounted(() => {
  nextTick(() => {
    sound.podiumFanfare()
    try {
      if (typeof (window as any).confetti === 'function') {
        ;(window as any).confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#fbbf24', '#7c3aed', '#34d399', '#f472b6'],
        })
      }
    } catch (_) {}
  })
})
</script>
