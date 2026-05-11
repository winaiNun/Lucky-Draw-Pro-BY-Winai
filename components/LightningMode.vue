<template>
  <div class="space-y-5">
    <!-- Storm Arena -->
    <div
      ref="arenaRef"
      class="relative rounded-3xl overflow-hidden border border-slate-700/50 select-none"
      style="min-height: 480px; background: radial-gradient(ellipse at 30% 20%, #1a0535 0%, #07091a 55%, #000308 100%);"
    >
      <!-- Storm cloud layers -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="storm-cloud cloud-1"></div>
        <div class="storm-cloud cloud-2"></div>
        <div class="storm-cloud cloud-3"></div>
      </div>

      <!-- Stars -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden" style="z-index:1;">
        <div
          v-for="star in stars" :key="star.id"
          class="absolute rounded-full bg-white"
          :style="{ left: star.x+'%', top: star.y+'%', width: star.size+'px', height: star.size+'px', opacity: star.opacity }"
        />
      </div>

      <!-- Rain canvas -->
      <canvas ref="rainCanvas" class="absolute inset-0 pointer-events-none opacity-40" style="z-index:2;" />

      <!-- Lightning bolt canvas -->
      <canvas ref="boltCanvas" class="absolute inset-0 pointer-events-none" style="z-index:5;" />

      <!-- Screen flash -->
      <div class="absolute inset-0 pointer-events-none" style="z-index:8;"
        :class="isFlashing ? 'flash-active' : 'flash-idle'" />

      <!-- Floating participant avatars (absolute positioned, always shown unless striking canvas covers) -->
      <div
        v-for="(p, idx) in store.activePool"
        :key="p.id"
        :ref="(el) => { if (el) cardRefs[p.id] = el as HTMLElement }"
        class="absolute participant-card flex flex-col items-center gap-1 transition-all duration-100"
        :class="[getFloatClass(idx), getCardClass(p.id)]"
        :style="getAvatarStyle(idx)"
      >
        <AvatarIcon
          :participant="p"
          :size="avatarSize"
          class="border-2 shadow-lg"
          :class="highlighted === p.id || struck === p.id ? 'border-yellow-300' : 'border-violet-600/40'"
        />
        <span
          class="text-white font-semibold bg-black/55 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-center"
          :style="{ fontSize: Math.max(8, avatarSize/4.5)+'px', maxWidth: (avatarSize+16)+'px' }"
        >{{ p.name.length > 9 ? p.name.slice(0,8)+'…' : p.name }}</span>
      </div>

      <!-- Strike text -->
      <Transition name="fade">
        <div v-if="phase === 'striking'" class="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none" style="z-index:9;">
          <div class="bg-black/60 backdrop-blur-sm px-6 py-2 rounded-full border border-yellow-400/40">
            <p class="text-yellow-300 font-black text-base tracking-widest animate-pulse">⚡ กำลังฟ้าผ่า... ⚡</p>
          </div>
        </div>
      </Transition>

      <div v-if="phase === 'ready'" class="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none" style="z-index:4;">
        <p class="text-slate-500 text-sm">กด "ฟ้าผ่าสุ่ม!" เพื่อเริ่ม</p>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-col items-center gap-3">
      <button
        @click="doStrike"
        :disabled="phase === 'striking' || store.poolCount === 0"
        class="relative overflow-hidden px-12 py-4 text-lg font-black rounded-2xl transition-all duration-200
               bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500
               hover:from-yellow-400 hover:to-amber-400
               text-slate-900 shadow-xl shadow-yellow-500/40
               hover:shadow-yellow-400/60 hover:-translate-y-0.5
               disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <span v-if="phase === 'striking'">⚡ กำลังฟ้าผ่า...</span>
        <span v-else>⚡ ฟ้าผ่าสุ่ม!</span>
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 btn-shimmer pointer-events-none" />
      </button>
      <p class="text-slate-400 text-sm">มีผู้เข้าร่วม {{ store.poolCount }} คน</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Student } from '~/stores/students'

const emit = defineEmits<{ (e: 'winner', student: Student): void }>()
const store = useStudentStore()
const sound = useSound()

const arenaRef   = ref<HTMLElement | null>(null)
const rainCanvas = ref<HTMLCanvasElement | null>(null)
const boltCanvas = ref<HTMLCanvasElement | null>(null)
const cardRefs   = reactive<Record<string | number, HTMLElement | null>>({})

type Phase = 'ready' | 'striking' | 'done'
const phase       = ref<Phase>('ready')
const highlighted = ref<string | number | null>(null)
const struck      = ref<string | number | null>(null)
const isFlashing  = ref(false)

// ── Stars ────────────────────────────────────────────────────────────
const stars = Array.from({ length: 60 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 1.8 + 0.4, opacity: Math.random() * 0.5 + 0.1,
}))

// ── Float layout (same approach as SpaceMode) ────────────────────────
const floatClasses = ['animate-float-1','animate-float-2','animate-float-3','animate-float-4','animate-float-5','animate-float-6']
const getFloatClass = (idx: number) => floatClasses[idx % floatClasses.length]

const avatarSize = computed(() => {
  const n = store.activePool.length
  if (n <= 6)  return 60
  if (n <= 12) return 50
  if (n <= 20) return 42
  return 34
})

const positions = computed(() => {
  const pool = store.activePool
  const n    = pool.length
  if (n === 0) return []
  const margin = 10
  const cols   = Math.ceil(Math.sqrt(n * 1.6))
  const rows   = Math.ceil(n / cols)
  return pool.map((_, idx) => {
    const col   = idx % cols
    const row   = Math.floor(idx / cols)
    const cellW = (100 - margin * 2) / cols
    const cellH = (100 - margin * 2) / rows
    return {
      left: margin + col * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.4,
      top:  margin + row * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.4,
    }
  })
})

function getAvatarStyle(idx: number) {
  const pos = positions.value[idx]
  if (!pos) return {}
  return {
    left:           `calc(${pos.left}% - ${avatarSize.value / 2}px)`,
    top:            `calc(${pos.top}%  - ${avatarSize.value / 2 + 10}px)`,
    zIndex:         3,
    animationDelay: `${(idx * 0.7) % 3}s`,
  }
}

function getCardClass(id: string | number) {
  if (struck.value === id)      return 'card-struck'
  if (highlighted.value === id) return 'card-highlighted'
  return ''
}

// ── Canvas helpers ───────────────────────────────────────────────────
function resizeCanvases() {
  const arena = arenaRef.value; if (!arena) return
  const w = arena.clientWidth; const h = arena.clientHeight
  ;[rainCanvas, boltCanvas].forEach(c => {
    if (c.value) { c.value.width = w; c.value.height = h }
  })
}

function getCardCenter(id: string | number) {
  const card = cardRefs[id]; const arena = arenaRef.value
  if (!card || !arena) return null
  const cr = card.getBoundingClientRect(); const ar = arena.getBoundingClientRect()
  return { x: cr.left - ar.left + cr.width / 2, y: cr.top - ar.top + cr.height / 2 }
}

function drawBolt(targetId: string | number) {
  const canvas = boltCanvas.value; if (!canvas) return
  const ctx    = canvas.getContext('2d')!
  const target = getCardCenter(targetId); if (!target) return
  const startX = canvas.width * (0.3 + Math.random() * 0.4)

  const segs = 9
  const pts  = [{ x: startX, y: 0 }]
  for (let i = 1; i < segs; i++) {
    const t = i / segs
    pts.push({
      x: startX + (target.x - startX) * t + (Math.random() - 0.5) * 110 * (1 - t * 0.6),
      y: (target.y) * t + (Math.random() - 0.5) * 25,
    })
  }
  pts.push({ x: target.x, y: target.y })

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'

  // Outer glow
  ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.strokeStyle = 'rgba(167,139,250,0.35)'; ctx.lineWidth = 18
  ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 30; ctx.stroke()
  // Yellow core
  ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.strokeStyle = 'rgba(253,224,71,0.75)'; ctx.lineWidth = 5
  ctx.shadowColor = '#fde047'; ctx.shadowBlur = 18; ctx.stroke()
  // White core
  ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.stroke()
  ctx.shadowBlur = 0

  // Impact starburst
  ctx.beginPath(); ctx.arc(target.x, target.y, 14, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,180,0.65)'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 20
  ctx.fill(); ctx.shadowBlur = 0
}

function clearBolt() {
  const c = boltCanvas.value; if (!c) return
  c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
}

// ── Strike sequence ──────────────────────────────────────────────────
const JUMP_DELAYS = [55, 60, 60, 70, 80, 95, 115, 145, 185, 240, 320, 430, 580, 780]

function doStrike() {
  if (phase.value === 'striking' || store.activePool.length === 0) return
  if (store.activePool.length === 1) { emit('winner', store.activePool[0]); return }

  const winner = store.getRandomStudent()!
  const pool   = store.activePool
  phase.value  = 'striking'
  struck.value = null

  let step = 0
  function jump() {
    const isLast    = step === JUMP_DELAYS.length - 1
    const candidates = isLast ? [winner] : pool.filter(p => p.id !== highlighted.value)
    const target    = candidates[Math.floor(Math.random() * candidates.length)]
    highlighted.value = target.id
    drawBolt(target.id)
    sound.electricCrackle()
    setTimeout(clearBolt, JUMP_DELAYS[step] * 0.55)

    step++
    if (step < JUMP_DELAYS.length) {
      setTimeout(jump, JUMP_DELAYS[step - 1])
    } else {
      setTimeout(() => {
        drawBolt(winner.id)
        struck.value      = winner.id
        highlighted.value = null
        isFlashing.value  = true
        sound.thunderBoom()
        setTimeout(() => { isFlashing.value = false; clearBolt() }, 350)
        setTimeout(() => {
          phase.value  = 'ready'
          struck.value = null
          emit('winner', winner)
        }, 900)
      }, 120)
    }
  }
  jump()
}

// ── Rain animation ───────────────────────────────────────────────────
interface Drop { x: number; y: number; spd: number; len: number; op: number }
let drops: Drop[] = []; let rainId = 0

function initRain() {
  const c = rainCanvas.value; if (!c) return
  drops = Array.from({ length: 120 }, () => ({
    x: Math.random() * c.width, y: Math.random() * c.height,
    spd: 5 + Math.random() * 7, len: 8 + Math.random() * 18,
    op: 0.06 + Math.random() * 0.18,
  }))
}

function animateRain() {
  const canvas = rainCanvas.value
  if (!canvas) { rainId = requestAnimationFrame(animateRain); return }
  const ctx = canvas.getContext('2d')!
  const w = canvas.width; const h = canvas.height
  ctx.clearRect(0, 0, w, h)
  drops.forEach(d => {
    ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.spd * 0.25, d.y + d.len)
    ctx.strokeStyle = `rgba(180,210,255,${d.op})`; ctx.lineWidth = 1; ctx.stroke()
    d.y += d.spd; d.x -= d.spd * 0.25
    if (d.y > h) { d.y = -d.len; d.x = Math.random() * w }
  })
  rainId = requestAnimationFrame(animateRain)
}

onMounted(() => nextTick(() => { resizeCanvases(); initRain(); animateRain() }))
onUnmounted(() => cancelAnimationFrame(rainId))
</script>

<style scoped>
.storm-cloud { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; }
.cloud-1 { width:400px;height:200px;background:rgba(40,10,80,0.5);top:-60px;left:-80px;animation:driftCloud 18s ease-in-out infinite alternate; }
.cloud-2 { width:350px;height:180px;background:rgba(10,20,70,0.6);top:-40px;right:-60px;animation:driftCloud 22s ease-in-out infinite alternate-reverse; }
.cloud-3 { width:300px;height:150px;background:rgba(30,5,60,0.4);bottom:40px;left:30%;animation:driftCloud 15s ease-in-out infinite alternate; }
@keyframes driftCloud { 0%{transform:translateX(0) translateY(0);}100%{transform:translateX(40px) translateY(20px);} }

.participant-card { z-index: 3; }
.card-highlighted { filter: drop-shadow(0 0 12px rgba(250,220,30,0.9)); transform: scale(1.1) !important; }
.card-struck      { filter: drop-shadow(0 0 20px rgba(255,255,255,1)) drop-shadow(0 0 40px rgba(167,139,250,0.9)); animation: thunderShake 0.5s ease-out, winnerPulse 0.8s ease-in-out infinite alternate !important; }

.flash-idle   { background: transparent; }
.flash-active { animation: flashBurst 0.35s ease-out forwards; }
@keyframes flashBurst { 0%{background:rgba(255,255,200,0.75);}40%{background:rgba(220,200,255,0.45);}100%{background:transparent;} }
@keyframes thunderShake {
  0%,100%{transform:translate(0,0) scale(1.05);}
  15%{transform:translate(-7px,-4px) scale(1.1);}30%{transform:translate(7px,4px) scale(1.1);}
  45%{transform:translate(-5px,3px) scale(1.08);}60%{transform:translate(5px,-3px) scale(1.08);}
}
@keyframes winnerPulse {
  from{filter:drop-shadow(0 0 20px rgba(167,139,250,1)) drop-shadow(0 0 40px rgba(167,139,250,0.6));}
  to{filter:drop-shadow(0 0 30px rgba(255,220,50,1)) drop-shadow(0 0 60px rgba(255,220,50,0.5));}
}
@keyframes btnShimmer{0%{transform:translateX(-150%) skewX(-12deg);}100%{transform:translateX(250%) skewX(-12deg);}}
.btn-shimmer{animation:btnShimmer 2s infinite;}
.fade-enter-active,.fade-leave-active{transition:opacity 0.3s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>
