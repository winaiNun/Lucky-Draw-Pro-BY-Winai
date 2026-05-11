// Shared state across all component instances
const soundEnabled = ref(true)
const musicEnabled = ref(false)
let _ctx: AudioContext | null = null
let _bgMusicStop: (() => void) | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (_ctx.state === 'suspended') _ctx.resume()
    return _ctx
  } catch { return null }
}

// ── Primitive: schedule a single tone ──────────────────────────────────────
function tone(
  c: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  vol = 0.25,
  type: OscillatorType = 'sine',
) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain); gain.connect(c.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + startAt)
  gain.gain.setValueAtTime(vol, c.currentTime + startAt)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startAt + duration)
  osc.start(c.currentTime + startAt)
  osc.stop(c.currentTime + startAt + duration + 0.01)
}

export function useSound() {
  // ── Wheel tick ─────────────────────────────────────────────────────────
  function tick() {
    const c = getCtx(); if (!c) return
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain); gain.connect(c.destination)
    osc.type = 'triangle'
    osc.frequency.value = 900
    gain.gain.setValueAtTime(0.12, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.04)
    osc.start(c.currentTime); osc.stop(c.currentTime + 0.05)
  }

  // ── Wheel spin whoosh ──────────────────────────────────────────────────
  function spinStart() {
    const c = getCtx(); if (!c) return
    tone(c, 200, 0, 0.15, 0.15, 'sawtooth')
    tone(c, 350, 0.1, 0.2, 0.1, 'sawtooth')
  }

  // ── Winner fanfare (wheel / space mode) ───────────────────────────────
  function winnerFanfare() {
    const c = getCtx(); if (!c) return
    // Ascending arpeggio C-E-G-C-E
    const melody = [523, 659, 784, 1047, 1319]
    melody.forEach((f, i) => tone(c, f, i * 0.11, 0.25, 0.28, 'sine'))
    tone(c, 1047, melody.length * 0.11, 0.7, 0.22, 'sine')
    // Harmony
    const harmony = [330, 415, 494, 659]
    harmony.forEach((f, i) => tone(c, f, i * 0.11, 0.22, 0.12, 'sine'))
  }

  // ── Space suspense (rising tremolo) ───────────────────────────────────
  function startSuspense(): () => void {
    const c = getCtx(); if (!c) return () => {}
    const osc = c.createOscillator()
    const lfo = c.createOscillator()
    const lfoGain = c.createGain()
    const master = c.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(140, c.currentTime)
    osc.frequency.linearRampToValueAtTime(520, c.currentTime + 2.5)

    lfo.frequency.value = 7
    lfoGain.gain.value = 0.08

    lfo.connect(lfoGain); lfoGain.connect(master.gain)
    osc.connect(master); master.connect(c.destination)
    master.gain.value = 0.14

    osc.start(); lfo.start()
    let stopped = false

    return () => {
      if (stopped) return; stopped = true
      master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25)
      setTimeout(() => { try { osc.stop(); lfo.stop() } catch (_) {} }, 300)
    }
  }

  // ── Race countdown (3-2-1-GO!) ────────────────────────────────────────
  function raceCountdown() {
    const c = getCtx(); if (!c) return
    // 3 low beeps
    ;[0, 0.9, 1.8].forEach(t => tone(c, 440, t, 0.2, 0.5, 'square'))
    // GO! — high horn blast
    tone(c, 880, 2.7, 0.08, 0.6, 'square')
    tone(c, 1100, 2.78, 0.5, 0.5, 'sawtooth')
    tone(c, 880, 2.78, 0.5, 0.35, 'sine')
  }

  // ── Race engine rumble ────────────────────────────────────────────────
  function startEngine(): () => void {
    const c = getCtx(); if (!c) return () => {}

    const master = c.createGain()
    master.gain.value = 0
    master.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.8)
    master.connect(c.destination)

    // Harmonic series: fundamental + overtones
    const basesFreqs = [85, 170, 255, 340]
    const oscs: OscillatorNode[] = basesFreqs.map((f, i) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = f
      g.gain.value = 0.8 / (i + 1)
      osc.connect(g); g.connect(master)
      osc.start()
      return osc
    })

    // Low-pass filter for rumble
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 400

    let variationId = 0
    const vary = () => {
      const rpm = 0.88 + Math.random() * 0.28
      basesFreqs.forEach((f, i) => {
        if (oscs[i])
          oscs[i].frequency.linearRampToValueAtTime(f * rpm, c.currentTime + 0.18)
      })
      variationId = window.setTimeout(vary, 180 + Math.random() * 120)
    }
    vary()

    let stopped = false
    return () => {
      if (stopped) return; stopped = true
      clearTimeout(variationId)
      master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6)
      setTimeout(() => { oscs.forEach(o => { try { o.stop() } catch (_) {} }) }, 700)
    }
  }

  // ── Race finish fanfare ───────────────────────────────────────────────
  function raceFinish() {
    const c = getCtx(); if (!c) return
    // Triumphant ascending chords
    const sequence = [
      [523, 659, 784],   // C major
      [659, 784, 1047],  // E chord
      [784, 1047, 1319], // G chord
      [1047, 1319, 1568], // High C
    ]
    sequence.forEach((chord, ci) => {
      chord.forEach(f => tone(c, f, ci * 0.18, 0.35, 0.2, 'sine'))
    })
    // Final sustained chord
    ;[523, 659, 784, 1047].forEach(f => tone(c, f, sequence.length * 0.18, 1.0, 0.18, 'sine'))
  }

  // ── Electric crackle (lightning jump) ────────────────────────────────
  function electricCrackle() {
    const c = getCtx(); if (!c) return
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain); gain.connect(c.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(3000 + Math.random() * 4000, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(180 + Math.random() * 100, c.currentTime + 0.07)
    gain.gain.setValueAtTime(0.18, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.09)
    osc.start(c.currentTime); osc.stop(c.currentTime + 0.1)
  }

  // ── Thunder boom (final lightning strike) ────────────────────────────
  function thunderBoom() {
    const c = getCtx(); if (!c) return
    // Initial sharp crack
    const crack = c.createOscillator()
    const crackGain = c.createGain()
    crack.connect(crackGain); crackGain.connect(c.destination)
    crack.type = 'square'
    crack.frequency.setValueAtTime(1200, c.currentTime)
    crack.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.08)
    crackGain.gain.setValueAtTime(0.7, c.currentTime)
    crackGain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12)
    crack.start(c.currentTime); crack.stop(c.currentTime + 0.15)

    // Deep rumble (noise-like using multiple detuned oscillators)
    ;[55, 63, 71, 80].forEach((f, i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.connect(g); g.connect(c.destination)
      o.type = 'sawtooth'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, c.currentTime + 0.05)
      g.gain.linearRampToValueAtTime(0.35 / (i + 1), c.currentTime + 0.15)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.4)
      o.start(c.currentTime + 0.05)
      o.stop(c.currentTime + 1.5)
    })

    // High zap flash
    tone(c, 900, 0, 0.04, 0.5, 'square')
    tone(c, 600, 0.03, 0.06, 0.35, 'sawtooth')
  }

  // ── Tornado wind (looping howl) ──────────────────────────────────────
  function startTornadoWind(): () => void {
    const c = getCtx(); if (!c) return () => {}
    const master = c.createGain()
    master.gain.value = 0
    master.connect(c.destination)

    // Multiple sawtooth layers for wind texture
    const freqs = [55, 90, 130, 180, 240]
    const oscs = freqs.map((f, i) => {
      const osc  = c.createOscillator()
      const filt = c.createBiquadFilter()
      const g    = c.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = f
      filt.type = 'bandpass'
      filt.frequency.value = f * 4
      filt.Q.value = 0.8
      g.gain.value = 0.7 / (i + 1)
      osc.connect(filt); filt.connect(g); g.connect(master)
      osc.start()
      return { osc, filt }
    })

    // Howling LFO
    const lfo = c.createOscillator()
    const lfoG = c.createGain()
    lfo.frequency.value = 0.4; lfoG.gain.value = 60
    lfo.connect(lfoG)
    oscs.forEach(({ filt }) => lfoG.connect(filt.frequency))
    lfo.start()

    // Build up to full intensity
    master.gain.linearRampToValueAtTime(0.15, c.currentTime + 1.2)
    master.gain.linearRampToValueAtTime(0.55, c.currentTime + 3.5)
    master.gain.linearRampToValueAtTime(0.7, c.currentTime + 5.0)

    let stopped = false
    return () => {
      if (stopped) return; stopped = true
      master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.2)
      setTimeout(() => {
        oscs.forEach(({ osc }) => { try { osc.stop() } catch (_) {} })
        try { lfo.stop() } catch (_) {}
      }, 1300)
    }
  }

  // ── Tornado eject (winner shoots out) ────────────────────────────────
  function tornadoEject() {
    const c = getCtx(); if (!c) return
    // Rising whoosh
    const osc = c.createOscillator()
    const g   = c.createGain()
    osc.connect(g); g.connect(c.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(2200, c.currentTime + 0.35)
    g.gain.setValueAtTime(0.5, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.45)
    osc.start(); osc.stop(c.currentTime + 0.5)
    // Impact thud
    ;[80, 110, 140].forEach((f, i) => {
      tone(c, f, 0.35 + i * 0.04, 0.35, 0.4 / (i + 1), 'sine')
    })
    // Victory ping
    tone(c, 1047, 0.6, 0.15, 0.3, 'sine')
    tone(c, 1319, 0.72, 0.2,  0.25, 'sine')
    tone(c, 1568, 0.85, 0.3,  0.2,  'sine')
  }

  // ── Background music (Web Audio API procedural compose) ──────────────
  function startBgMusic(): () => void {
    // Use raw AudioContext — not blocked by soundEnabled so music has its own toggle
    if (typeof window === 'undefined') return () => {}
    try {
      if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (_ctx.state === 'suspended') _ctx.resume()
    } catch { return () => {} }
    const c = _ctx

    const master = c.createGain()
    master.gain.value = 0.07          // soft background
    master.connect(c.destination)

    const BPM  = 126
    const bt   = 60 / BPM            // one beat (s) ≈ 0.476
    const LOOP = bt * 16             // 4 bars × 4 beats

    // ── Shared note scheduler ─────────────────────────────────
    function n(absT: number, freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
      const osc = c.createOscillator()
      const g   = c.createGain()
      osc.type = type; osc.frequency.value = freq
      g.gain.setValueAtTime(0.001, absT)
      g.gain.linearRampToValueAtTime(vol, absT + 0.015)
      g.gain.setValueAtTime(vol * 0.7, absT + dur - 0.04)
      g.gain.linearRampToValueAtTime(0.001, absT + dur)
      osc.connect(g); g.connect(master)
      osc.start(absT); osc.stop(absT + dur + 0.02)
    }

    // Sine-sweep kick drum
    function kick(absT: number) {
      const osc = c.createOscillator(); const g = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(170, absT)
      osc.frequency.exponentialRampToValueAtTime(42, absT + 0.14)
      g.gain.setValueAtTime(0.5, absT)
      g.gain.exponentialRampToValueAtTime(0.001, absT + 0.22)
      osc.connect(g); g.connect(master)
      osc.start(absT); osc.stop(absT + 0.26)
    }

    // Square-wave snare
    function snare(absT: number) {
      ;[220, 440, 880].forEach((f, i) => {
        const osc = c.createOscillator(); const g = c.createGain()
        osc.type = 'square'; osc.frequency.value = f
        g.gain.setValueAtTime(0.07 / (i + 1), absT)
        g.gain.exponentialRampToValueAtTime(0.001, absT + 0.07)
        osc.connect(g); g.connect(master)
        osc.start(absT); osc.stop(absT + 0.09)
      })
    }

    // High-square hi-hat
    function hat(absT: number, vol = 0.035) {
      ;[2200, 3300, 4400].forEach(f => {
        const osc = c.createOscillator(); const g = c.createGain()
        osc.type = 'square'; osc.frequency.value = f
        g.gain.setValueAtTime(vol / 3, absT)
        g.gain.exponentialRampToValueAtTime(0.001, absT + 0.022)
        osc.connect(g); g.connect(master)
        osc.start(absT); osc.stop(absT + 0.03)
      })
    }

    // ── Schedule one full loop ────────────────────────────────
    function scheduleLoop(t0: number) {
      // Chord progression: C – G – Am – F  (I V vi IV, 4 bars)
      const chordData: [number[], number][] = [
        [[130.81, 164.81, 196.00], 0],       // C3 E3 G3
        [[196.00, 246.94, 293.66], bt * 4],  // G3 B3 D4
        [[220.00, 261.63, 329.63], bt * 8],  // A3 C4 E4
        [[174.61, 220.00, 261.63], bt * 12], // F3 A3 C4
      ]
      chordData.forEach(([freqs, off]) =>
        freqs.forEach(f => n(t0 + off, f, bt * 3.85, 0.10, 'triangle'))
      )

      // Bass walk (sawtooth, one per beat, 16 beats)
      const bassLine = [
        65.41, 73.42, 65.41, 82.41,    // C bar
        98.00, 87.31, 98.00, 110.00,   // G bar
        110.00, 98.00, 110.00, 130.81, // Am bar
        87.31, 98.00, 87.31,  82.41,   // F bar
      ]
      bassLine.forEach((f, i) => n(t0 + i * bt, f, bt * 0.80, 0.28, 'sawtooth'))

      // Melody — 8th notes (2 per beat × 16 beats = 32 notes)
      const mel = [
        // C bar (arpeggiate C major up then partial down)
        523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 523.25, 392.00,
        // G bar
        493.88, 587.33, 783.99, 587.33, 493.88, 587.33, 493.88, 392.00,
        // Am bar
        440.00, 523.25, 659.25, 523.25, 440.00, 523.25, 440.00, 329.63,
        // F bar — resolve up to C
        349.23, 440.00, 523.25, 440.00, 349.23, 440.00, 523.25, 659.25,
      ]
      mel.forEach((f, i) => n(t0 + i * (bt / 2), f, bt * 0.42, 0.17, 'sine'))

      // Percussion — 16 beats
      for (let b = 0; b < 16; b++) {
        const t = t0 + b * bt
        const p = b % 4
        if (p === 0 || p === 2) kick(t)    // kick: beat 1 & 3
        if (p === 1 || p === 3) snare(t)   // snare: beat 2 & 4
        hat(t, 0.035)                       // hat: every beat
        hat(t + bt * 0.5, 0.025)           // hat: every off-beat
      }
    }

    // Loop management with lookahead scheduling
    let nextT     = c.currentTime + 0.15
    let loopTimer = 0
    let stopped   = false

    function loop() {
      if (stopped) return
      scheduleLoop(nextT)
      nextT += LOOP
      loopTimer = window.setTimeout(loop, Math.max(50, (nextT - c.currentTime - 0.5) * 1000))
    }
    loop()

    return () => {
      if (stopped) return; stopped = true
      window.clearTimeout(loopTimer)
      master.gain.linearRampToValueAtTime(0.001, c.currentTime + 1.5)
    }
  }

  function toggleMusic() {
    musicEnabled.value = !musicEnabled.value
    if (musicEnabled.value) {
      _bgMusicStop = startBgMusic()
    } else {
      _bgMusicStop?.()
      _bgMusicStop = null
    }
  }

  // ── Podium reveal (ranking modal) ─────────────────────────────────────
  function podiumFanfare() {
    const c = getCtx(); if (!c) return
    // Drum roll simulation (rapid noise bursts)
    for (let i = 0; i < 8; i++) {
      tone(c, 200 + i * 15, i * 0.06, 0.08, 0.15, 'square')
    }
    // Then main fanfare
    const melody = [392, 494, 587, 784, 987, 784, 1175]
    melody.forEach((f, i) => tone(c, f, 0.55 + i * 0.13, 0.25, 0.25, 'sine'))
    // Bass line
    ;[196, 247, 294].forEach((f, i) => tone(c, f, 0.55 + i * 0.26, 0.3, 0.2, 'sine'))
  }

  return {
    soundEnabled,
    musicEnabled,
    toggleMusic,
    tick,
    spinStart,
    winnerFanfare,
    startSuspense,
    raceCountdown,
    startEngine,
    raceFinish,
    podiumFanfare,
    electricCrackle,
    thunderBoom,
    startTornadoWind,
    tornadoEject,
  }
}
