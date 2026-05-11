<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')"></div>
      <div class="relative z-10 card p-8 max-w-sm w-full text-center animate-winner-reveal shadow-2xl border-violet-500/30">
        <button @click="$emit('close')" class="absolute top-4 right-4 text-slate-500 hover:text-white text-xl">✕</button>

        <div class="text-4xl mb-2">🎉</div>
        <h2 class="text-xl font-bold text-violet-400 uppercase tracking-widest mb-5">ผู้ถูกเลือก!</h2>

        <div class="flex justify-center mb-5">
          <div class="relative">
            <AvatarIcon
              :participant="student"
              :size="112"
              class="border-4 border-violet-500 shadow-xl shadow-violet-900/60 animate-pulse-glow"
            />
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">👑</div>
          </div>
        </div>

        <h3 class="text-2xl font-black text-white mb-1">{{ student.name }}</h3>
        <p class="text-slate-500 text-sm mb-5">รหัส: {{ student.id }}</p>

        <div class="bg-slate-700/50 rounded-xl px-4 py-2 mb-6 inline-flex items-center gap-2">
          <span class="text-slate-400 text-sm">ผู้เข้าร่วมที่เหลือ:</span>
          <span class="text-white font-bold">{{ poolCount }} คน</span>
        </div>

        <div class="flex gap-3">
          <button @click="$emit('keep')" class="btn-success flex-1 flex items-center justify-center gap-2">
            <span>✅</span><span>เก็บไว้ในรายชื่อ</span>
          </button>
          <button @click="$emit('remove')" class="btn-danger flex-1 flex items-center justify-center gap-2">
            <span>❌</span><span>นำออก</span>
          </button>
        </div>
        <p class="text-slate-500 text-xs mt-3">"นำออก" = จะไม่ถูกสุ่มซ้ำในรอบนี้</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Student } from '~/stores/students'

defineProps<{ student: Student; poolCount: number }>()
defineEmits<{ (e: 'keep'): void; (e: 'remove'): void; (e: 'close'): void }>()

const sound = useSound()

onMounted(() => {
  nextTick(() => {
    sound.winnerFanfare()
    try {
      if (typeof (window as any).confetti === 'function') {
        ;(window as any).confetti({
          particleCount: 120, spread: 80, origin: { y: 0.55 },
          colors: ['#7c3aed', '#2563eb', '#fbbf24', '#34d399', '#f472b6'],
        })
      }
    } catch (_) {}
  })
})
</script>
