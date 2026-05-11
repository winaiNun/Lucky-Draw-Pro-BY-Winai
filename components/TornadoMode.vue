<template>
  <div class="space-y-5">
    <!-- Storm Arena -->
    <div
      ref="arenaRef"
      class="relative rounded-3xl overflow-hidden border border-slate-700/40 select-none"
      style="min-height: 500px; background: radial-gradient(ellipse at 50% 0%, #1b3800 0%, #0a1a00 35%, #050c00 70%, #020400 100%);"
    >
      <!-- Greenish sky pulse (tornado weather) -->
      <div class="absolute inset-0 pointer-events-none sky-pulse"></div>

      <!-- Tornado canvas (funnel + debris) -->
      <canvas ref="tornadoCanvas" class="absolute inset-0 pointer-events-none" style="z-index:4;"></canvas>

      <!-- Floating participant cards -->
      <template v-if="phase !== 'chaos' && phase !== 'done'">
        <div
          v-for="(p, idx) in store.activePool"
          :key="p.id"
          class="absolute participant-card"
          :class="[getFloatClass(idx), phase === 'ready' || phase === 'forming' ? 'card-float' : '']"
          :style="getCardStyle(idx, p.id)"
        >
          <div class="flex flex-col items-center gap-1">
            <AvatarIcon
              :participant="p"
              :size="avatarSize"
              class="border-2 border-emerald-800/40 shadow-md shadow-black/60"
            />
            <span
              class="text-white font-semibold bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-center"
              :style="{ fontSize: Math.max(8, avatarSize / 4.5) + 'px', maxWidth: (avatarSize + 16) + 'px' }"
            >
              {{ p.name.length > 9 ? p.name.slice(0, 8) + '…' : p.name }}
            </span>
          </div>
        </div>
      </template>

      <!-- Winner eject card -->
      <div
        v-if="(phase === 'ejecting' || phase === 'done') && winner"
        class="absolute winner-card"
        :style="winnerCardStyle"
      >
        <div class="flex flex-col items-center gap-2">
          <AvatarIcon
            :participant="winner"
            :size="72"
            class="border-4 border-yellow-400 shadow-2xl shadow-yellow-500/60"
            style="filter: drop-shadow(0 0 20px rgba(250,204,21,0.9));"
          />
          <span class="text-white font-black text-sm bg-yellow-500/20 border border-yellow-400/50 px-3 py-1 rounded-full backdrop-blur-sm">
            {{ winner.name }}
          </span>
        </div>
      </div>

      <!-- Phase overlays -->
      <Transition name="fade">
        <div
          v-if="phase === 'forming' || phase === 'sucking'"
          class="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none"
          style="z-index:8;"
        >
          <div class="bg-black/60 backdrop-blur-sm px-6 py-2 rounded-full border border-green-600/40">
            <p class="text-green-300 font-black text-base tracking-widest animate-pulse">
              {{ phase === 'forming' ? '🌪️ ทอร์นาโดก่อตัว...' : '🌀 กำลังดูดทุกคน...' }}
            </p>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div
          v-if="phase === 'chaos'"
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
          style="z-index:8;"
        >
          <p class="text-5xl font-black text-green-300 animate-pulse" style="text-shadow: 0 0 30px rgba(134,239,172,0.8);">
            🌪️
          </p>
        </div>
      </Transition>
    </div>

    <!-- Controls -->
    <div class="flex flex-col items-center gap-3">
      <button
        @click="startTornado"
        :disabled="phase !== 'ready' || store.poolCount === 0"
        class="relative overflow-hidden px-12 py-4 text-lg font-black rounded-2xl transition-all duration-200
               bg-gradient-to-r from-green-700 via-emerald-600 to-green-700
               hover:from-green-600 hover:to-emerald-500
               text-white shadow-xl shadow-green-900/60
               hover:shadow-green-700/60 hover:-translate-y-0.5
               disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <span v-if="phase === 'ready'">🌪️ เรียกทอร์นาโด!</span>
        <span v-else-if="phase === 'forming'">🌪️ ทอร์นาโดก่อตัว...</span>
        <span v-else-if="phase === 'sucking'">🌀 กำลังดูดทุกคน...</span>
        <span v-else-if="phase === 'chaos'">💨 ทอร์นาโดโหด!</span>
        <span v-else-if="phase === 'ejecting'">⚡ ระเด็นออกมา!</span>
        <span v-else>✅ เสร็จสิ้น — เรียกอีกครั้ง?</span>
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 btn-shimmer pointer-events-none"></div>
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

// ── Refs ────────────────────────────────────────────────────────────────
const arenaRef      = ref<HTMLElement | null>(null)
const tornadoCanvas = ref<HTMLCanvasElement | null>(null)

type Phase = 'ready' | 'forming' | 'sucking' | 'chaos' | 'ejecting' | 'done'
const phase  = ref<Phase>('ready')
const winner = ref<Student | null>(null)

// ── Timing (ms) ─────────────────────────────────────────────────────────
const T_FORMING  = 1400
const T_SUCKING  = 2200
const T_CHAOS    = 1800
const T_EJECTING = 1200

// ── Layout helpers ────────────────────────────────────────────────────
const avatarSize = computed(() => {
  const n = store.activePool.length
  if (n <= 6)  return 60
  if (n <= 12) return 50
  if (n <= 20) return 42
  return 34
})

const floatClasses = [
  'animate-float-1','animate-float-2','animate-float-3',
  'animate-float-4','animate-float-5','animate-float-6',
]
const getFloatClass = (idx: number) => floatClasses[idx % floatClasses.length]

// Pre-computed stable positions for "ready/forming" float phase
const positions = (() => {
  // Call once per component mount; pool may change but positions are stable
  const cache: Record<string, { left: number; top: number }[]> = {}
  return (n: number) => {
    if (cache[n]) return cache[n]
    const margin = 10
    const cols = Math.ceil(Math.sqrt(n * 1.5))
    const rows = Math.ceil(n / cols)
    cache[n] = Array.from({ length: n }, (_, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const cellW = (100 - margin * 2) / cols
      const cellH = (100 - margin * 2) / rows
      return {
        left: margin + col * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.45,
        top:  margin + row * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.45,
      }
    })
    return cache[n]
  }
})()

// Per-card suck transition config (randomised once when sucking starts)
const suckCfg = ref<Record<string | number, { dur: number; delay: number; rot: number }>>({})

function buildSuckCfg() {
  const cfg: typeof suckCfg.value = {}
  store.activePool.forEach(p => {
    cfg[p.id] = {
      dur:   1.3 + Math.random() * 0.7,
      delay: Math.random() * 0.5,
      rot:   540 + Math.floor(Math.random() * 3) * 360,
    }
  })
  suckCfg.value = cfg
}

function getCardStyle(idx: number, id: string | number) {
  const pool = store.activePool
  const pos  = positions(pool.length)[idx]

  if (phase.value === 'ready' || phase.value === 'forming') {
    return {
      left: `calc(${pos.left}% - ${avatarSize.value / 2}px)`,
      top:  `calc(${pos.top}%  - ${avatarSize.value / 2 + 10}px)`,
      transition: 'none',
      opacity: '1',
    }
  }

  if (phase.value === 'sucking') {
    const c = suckCfg.value[id] ?? { dur: 1.5, delay: 0, rot: 720 }
    return {
      left: '50%',
      top:  '44%',
      transform: `translate(-50%, -50%) scale(0.03) rotate(${c.rot}deg)`,
      opacity: '0',
      transition: `all ${c.dur}s cubic-bezier(0.55,0,1,0.55) ${c.delay}s`,
    }
  }

  return { display: 'none' }
}

// Winner card: eject animation via CSS custom property
const ejectVec   = ref({ x: 0, y: 0 })
const ejectPhase = ref(false) // true = flying out, false = settling back

const winnerCardStyle = computed(() => {
  const base = {
    left:      '50%',
    top:       '46%',
    zIndex:    '10',
    '--ex':    ejectVec.value.x + 'px',
    '--ey':    ejectVec.value.y + 'px',
  } as Record<string, string>

  if (phase.value === 'ejecting') {
    return { ...base, animation: 'tornadoEjectCard 1.1s cubic-bezier(0.34,1.56,0.64,1) forwards' }
  }
  // done phase — settled at center
  return { ...base, transform: 'translate(-50%,-50%) scale(1)', opacity: '1' }
})

// ── Tornado canvas ───────────────────────────────────────────────────────
interface Debris {
  angle: number; radius: number; yFrac: number
  speed: number; w: number; h: number; hue: number
}
let debris: Debris[] = []
let animId    = 0
let tornadoT  = 0        // animation time (seconds)
let intensity = 0        // 0–1

function buildDebris() {
  debris = Array.from({ length: 45 }, () => ({
    angle:  Math.random() * Math.PI * 2,
    radius: 60 + Math.random() * 140,
    yFrac:  0.08 + Math.random() * 0.68,
    speed:  1.2 + Math.random() * 2.2,
    w:      5 + Math.random() * 12,
    h:      3 + Math.random() * 7,
    hue:    70 + Math.random() * 50,
  }))
}

function resizeCanvas() {
  const arena = arenaRef.value; if (!arena) return
  const c = tornadoCanvas.value; if (!c) return
  c.width  = arena.clientWidth
  c.height = arena.clientHeight
}

function drawTornadoFrame(ctx: CanvasRenderingContext2D, t: number, inten: number) {
  const W  = ctx.canvas.width
  const H  = ctx.canvas.height
  const cx = W / 2
  ctx.clearRect(0, 0, W, H)
  if (inten < 0.01) return

  const topY  = H * 0.01
  const tipY  = H * 0.78
  const topRx = W * 0.40 * inten
  const tipRx = W * 0.018

  const BANDS = 35

  // Draw bands bottom → top so upper bands render over lower
  for (let i = 0; i <= BANDS; i++) {
    const frac = i / BANDS               // 0 = tip, 1 = top
    const y    = tipY - (tipY - topY) * frac
    const rx   = (tipRx + (topRx - tipRx) * frac)
    const ry   = Math.max(4, rx * 0.13)
    const rot  = t * (2.5 + (1 - frac) * 7) + frac * Math.PI * 2.5

    const dark  = Math.floor(10 + frac * 25)
    const green = Math.floor(15 + frac * 35)
    const alpha = (0.25 + (1 - frac) * 0.55) * inten

    ctx.save()
    ctx.translate(cx, y)
    ctx.rotate(rot)
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.fillStyle   = `rgba(${dark},${green},${dark - 5},${alpha})`
    ctx.strokeStyle = `rgba(${dark + 30},${green + 30},${dark + 10},${Math.min(1, alpha + 0.15)})`
    ctx.lineWidth   = 1 + (1 - frac) * 2.5
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // Dark inner core (3 passes)
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i <= 12; i++) {
      const frac = i / 12
      const y    = tipY - (tipY - topY) * frac
      const rx   = (tipRx + (topRx - tipRx) * frac) * (0.28 - pass * 0.07)
      const ry   = Math.max(2, rx * 0.1)
      const rot  = t * (5 + (1 - frac) * 10 + pass * 3) + frac * Math.PI * 4

      ctx.save()
      ctx.translate(cx, y)
      ctx.rotate(rot)
      ctx.beginPath()
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(2,6,2,${(0.5 + pass * 0.15) * inten})`
      ctx.fill()
      ctx.restore()
    }
  }

  // Dust cloud at tornado base
  const dustR = topRx * 0.55 + Math.sin(t * 6) * topRx * 0.05
  const grad  = ctx.createRadialGradient(cx, tipY, 0, cx, tipY, dustR)
  grad.addColorStop(0,   `rgba(60,50,20,${0.55 * inten})`)
  grad.addColorStop(0.4, `rgba(45,38,15,${0.35 * inten})`)
  grad.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.beginPath()
  ctx.ellipse(cx, tipY, dustR, dustR * 0.32, 0, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  // Debris
  debris.forEach(d => {
    d.angle += d.speed * 0.025
    const r = d.radius * (0.4 + (1 - inten) * 0.6 + inten * 0.5 * Math.sin(d.angle * 0.3))
    const x = cx + Math.cos(d.angle) * r * inten
    const y = H * d.yFrac + Math.sin(d.angle * 0.5) * 18

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(d.angle * 4 + t * 2)
    ctx.fillStyle = `hsla(${d.hue},40%,${15 + inten * 20}%,${0.6 * inten})`
    ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h)
    ctx.restore()
  })
}

// ── Animation loop ────────────────────────────────────────────────────
let phaseStart = 0

function setPhase(p: Phase) {
  phase.value = p
  phaseStart  = performance.now()
}

function runAnimation() {
  const canvas = tornadoCanvas.value
  if (!canvas) { animId = requestAnimationFrame(runAnimation); return }
  const ctx = canvas.getContext('2d')!

  const elapsed = (performance.now() - phaseStart) / 1000
  tornadoT += 0.016

  switch (phase.value) {
    case 'forming':  intensity = Math.min(1, elapsed / (T_FORMING  / 1000)); break
    case 'sucking':  intensity = 1; break
    case 'chaos':    intensity = 1; break
    case 'ejecting': intensity = Math.max(0, 1 - elapsed / (T_EJECTING / 1000)); break
    default:         intensity = 0; break
  }

  drawTornadoFrame(ctx, tornadoT, intensity)

  if (phase.value !== 'ready' && phase.value !== 'done') {
    animId = requestAnimationFrame(runAnimation)
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

// ── Main trigger ─────────────────────────────────────────────────────
let stopWind: (() => void) | null = null
let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
  stopWind?.(); stopWind = null
}

function startTornado() {
  if (phase.value !== 'ready' || store.activePool.length === 0) return
  if (store.activePool.length === 1) { emit('winner', store.activePool[0]); return }

  clearTimers()
  winner.value = store.getRandomStudent()!
  buildDebris()

  // ── Phase: forming ───────────────────────────────────────────────
  setPhase('forming')
  stopWind = sound.startTornadoWind()
  cancelAnimationFrame(animId)
  runAnimation()

  // ── Phase: sucking ───────────────────────────────────────────────
  timers.push(setTimeout(() => {
    buildSuckCfg()
    setPhase('sucking')
  }, T_FORMING))

  // ── Phase: chaos ─────────────────────────────────────────────────
  timers.push(setTimeout(() => {
    setPhase('chaos')
  }, T_FORMING + T_SUCKING))

  // ── Phase: ejecting ──────────────────────────────────────────────
  timers.push(setTimeout(() => {
    stopWind?.(); stopWind = null
    sound.tornadoEject()
    // Pre-compute eject vector
    const angle = (Math.random() * 0.6 + 0.2) * Math.PI * 2
    const dist  = 130 + Math.random() * 80
    ejectVec.value = { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
    ejectPhase.value = true
    setPhase('ejecting')
  }, T_FORMING + T_SUCKING + T_CHAOS))

  // ── Phase: done → emit → reset to ready ─────────────────────────
  timers.push(setTimeout(() => {
    cancelAnimationFrame(animId)
    const ctx = tornadoCanvas.value?.getContext('2d')
    ctx?.clearRect(0, 0, tornadoCanvas.value!.width, tornadoCanvas.value!.height)
    const w = winner.value
    if (w) emit('winner', w)
    // Reset back to floating state after modal interaction time
    setTimeout(() => {
      phase.value  = 'ready'
      winner.value = null
    }, 600)
  }, T_FORMING + T_SUCKING + T_CHAOS + T_EJECTING))
}

onMounted(() => nextTick(() => {
  resizeCanvas()
}))

onUnmounted(() => {
  clearTimers()
  cancelAnimationFrame(animId)
})
</script>

<style scoped>
/* Stormy green sky pulse */
.sky-pulse {
  background: radial-gradient(ellipse at 50% 30%, rgba(30,80,0,0.12) 0%, transparent 70%);
  animation: skyPulse 3s ease-in-out infinite alternate;
}
@keyframes skyPulse {
  from { opacity: 0.5; }
  to   { opacity: 1; }
}

/* Floating participants */
.participant-card { position: absolute; z-index: 3; }
.card-float { will-change: transform; }

/* Winner eject animation */
.winner-card {
  position: absolute;
  z-index: 10;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
}
@keyframes tornadoEjectCard {
  0%  {
    transform: translate(-50%, -50%) scale(0.1) rotate(0deg);
    opacity: 0.2;
  }
  28% {
    transform:
      translate(calc(-50% + var(--ex)), calc(-50% + var(--ey)))
      scale(1.5) rotate(800deg);
    opacity: 1;
  }
  60% {
    transform:
      translate(calc(-50% + var(--ex) * 0.25), calc(-50% + var(--ey) * 0.25))
      scale(1.2) rotate(1200deg);
    opacity: 1;
  }
  80% {
    transform: translate(calc(-50% + 6px), calc(-50% - 6px)) scale(1.08) rotate(1260deg);
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(1080deg);
    opacity: 1;
  }
}

/* Button shimmer */
@keyframes btnShimmer {
  0%   { transform: translateX(-150%) skewX(-12deg); }
  100% { transform: translateX(250%)  skewX(-12deg); }
}
.btn-shimmer { animation: btnShimmer 2.2s infinite; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; }
</style>
