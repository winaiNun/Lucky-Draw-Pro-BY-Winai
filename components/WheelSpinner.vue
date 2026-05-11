<template>
  <div class="space-y-6">
    <div class="flex flex-col items-center gap-8">
      <!-- Wheel -->
      <div class="relative flex items-center justify-center" style="width: 420px; max-width: 90vw;">
        <div class="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600 p-1 opacity-70 blur-sm"></div>
        <div class="wheel-container relative z-10" style="width: 400px; height: 400px; max-width: 88vw; max-height: 88vw;">
          <canvas
            ref="canvasRef"
            :width="canvasSize"
            :height="canvasSize"
            class="rounded-full shadow-2xl shadow-violet-900/60"
            style="max-width: 100%; max-height: 100%;"
          ></canvas>
          <button
            @click="spin"
            :disabled="isSpinning"
            class="absolute inset-0 m-auto rounded-full bg-slate-900 border-4 border-violet-500 text-white font-bold text-xs z-20 hover:bg-violet-900 transition-colors disabled:opacity-50 shadow-lg"
            style="width: 64px; height: 64px;"
          >
            {{ isSpinning ? '...' : 'หมุน' }}
          </button>
          <div class="wheel-pointer absolute z-20" style="top: 50%; right: -14px; transform: translateY(-50%);"></div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-col items-center gap-3">
        <button @click="spin" :disabled="isSpinning || store.poolCount < 2" class="btn-primary px-10 py-3 text-lg">
          <span v-if="isSpinning">🌀 กำลังหมุน...</span>
          <span v-else>🎡 หมุนวงล้อ!</span>
        </button>
        <p class="text-slate-400 text-sm">มีผู้เข้าร่วมในรายชื่อ {{ store.poolCount }} คน</p>
      </div>
    </div>

    <!-- Pool tags -->
    <div class="card p-5 max-w-2xl mx-auto">
      <h3 class="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">รายชื่อที่ยังอยู่</h3>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="s in store.activePool"
          :key="s.id"
          class="flex items-center gap-2 bg-slate-700/60 rounded-xl px-3 py-1.5"
        >
          <AvatarIcon :participant="s" :size="24" />
          <span class="text-xs text-slate-300">{{ s.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Student } from '~/stores/students'

const emit = defineEmits<{ (e: 'winner', student: Student): void }>()
const store = useStudentStore()

const sound = useSound()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isSpinning = ref(false)
const canvasSize = 400
let currentAngle = 0
let animationId: number | null = null
let lastSegmentIdx = -1
let lastTickTime = 0

const COLORS = [
  '#7c3aed','#2563eb','#0891b2','#059669',
  '#d97706','#dc2626','#be185d','#4338ca',
  '#0284c7','#047857','#b45309','#be123c',
]

function drawWheel(rotationAngle: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const students = store.activePool
  if (students.length === 0) return

  const cx = canvasSize / 2
  const cy = canvasSize / 2
  const radius = canvasSize / 2 - 4
  ctx.clearRect(0, 0, canvasSize, canvasSize)

  const sliceAngle = (2 * Math.PI) / students.length

  students.forEach((student, i) => {
    const startAngle = rotationAngle + i * sliceAngle
    const endAngle = startAngle + sliceAngle

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fill()
    ctx.strokeStyle = 'rgba(15,23,42,0.6)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw emoji or name
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(startAngle + sliceAngle / 2)

    const hasEmoji = student.emoji && !student.imageUrl
    const label = hasEmoji
      ? student.emoji
      : (student.name.length > 12 ? student.name.slice(0, 11) + '…' : student.name)

    ctx.textAlign = 'right'
    ctx.fillStyle = 'white'
    const fontSize = Math.max(10, Math.min(14, 200 / students.length))
    ctx.font = hasEmoji
      ? `${Math.max(12, Math.min(18, 200 / students.length))}px serif`
      : `bold ${fontSize}px Sarabun, sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 4
    ctx.fillText(label, radius - 12, 5)
    ctx.restore()
  })

  ctx.beginPath()
  ctx.arc(cx, cy, 32, 0, 2 * Math.PI)
  ctx.fillStyle = '#0f172a'
  ctx.fill()
  ctx.strokeStyle = '#7c3aed'
  ctx.lineWidth = 3
  ctx.stroke()
}

function getWinnerIndex(finalAngle: number): number {
  const students = store.activePool
  const sliceAngle = (2 * Math.PI) / students.length
  const normalized = (((-finalAngle) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  return Math.floor(normalized / sliceAngle) % students.length
}

function spin() {
  if (isSpinning.value || store.activePool.length === 0) return
  if (store.activePool.length === 1) { emit('winner', store.activePool[0]); return }

  isSpinning.value = true
  lastSegmentIdx = getWinnerIndex(currentAngle)
  sound.spinStart()

  const extraRotations = (5 + Math.random() * 5) * 2 * Math.PI
  const randomOffset = Math.random() * 2 * Math.PI
  const targetAngle = currentAngle - extraRotations - randomOffset
  const startAngle = currentAngle
  const duration = 4000 + Math.random() * 2000
  const startTime = performance.now()

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

  function animate(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    currentAngle = startAngle + (targetAngle - startAngle) * easeOut(progress)
    drawWheel(currentAngle)

    // Play tick sound when crossing a segment boundary (throttled)
    const seg = getWinnerIndex(currentAngle)
    if (seg !== lastSegmentIdx) {
      const timeSinceTick = now - lastTickTime
      // Speed determines min gap: fast spin = frequent ticks, slow = sparse
      const minGap = 40 + (1 - easeOut(progress)) * 120
      if (timeSinceTick >= minGap) {
        sound.tick()
        lastTickTime = now
      }
      lastSegmentIdx = seg
    }

    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      currentAngle = targetAngle
      drawWheel(currentAngle)
      isSpinning.value = false
      const winner = store.activePool[getWinnerIndex(currentAngle)]
      if (winner) setTimeout(() => emit('winner', winner), 300)
    }
  }
  animationId = requestAnimationFrame(animate)
}

onMounted(() => drawWheel(currentAngle))
watch(() => store.activePool, () => nextTick(() => drawWheel(currentAngle)), { deep: true })
onUnmounted(() => { if (animationId) cancelAnimationFrame(animationId) })
</script>
