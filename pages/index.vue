<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
        <!-- Left: Logo (always visible, inline style to guarantee gradient renders) -->
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-lg"
            style="background: linear-gradient(135deg, #eab308 0%, #7c3aed 100%); box-shadow: 0 4px 14px rgba(124,58,237,0.35);"
          >
            🎲
          </div>
          <div>
            <h1 class="text-base font-black text-white tracking-tight leading-tight">Lucky Draw Pro</h1>
            <p class="text-xs text-slate-400 leading-tight hidden sm:block">ระบบสุ่มอเนกประสงค์</p>
          </div>
        </div>

        <!-- Center: Draw title (absolute so it's truly centered) -->
        <div class="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-xs w-full px-2">
          <Transition name="title-fade" mode="out-in">
            <p v-if="store.drawTitle" :key="store.drawTitle"
               class="text-white font-bold text-sm leading-tight truncate">
              {{ store.drawTitle }}
            </p>
            <p v-else key="empty" class="text-slate-700 text-xs">—</p>
          </Transition>
        </div>
        <div class="flex items-center gap-2">
          <!-- Music toggle -->
          <button
            @click="sound.toggleMusic()"
            :title="sound.musicEnabled.value ? 'ปิดเพลง' : 'เปิดเพลงพื้นหลัง'"
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            :class="sound.musicEnabled.value ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400' : 'bg-slate-700/60 hover:bg-slate-700 text-slate-500'"
          >
            <span class="text-lg">{{ sound.musicEnabled.value ? '🎵' : '🔕' }}</span>
          </button>

          <!-- SFX toggle -->
          <button
            @click="sound.soundEnabled.value = !sound.soundEnabled.value"
            :title="sound.soundEnabled.value ? 'ปิดเอฟเฟกต์เสียง' : 'เปิดเอฟเฟกต์เสียง'"
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            :class="sound.soundEnabled.value ? 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-400' : 'bg-slate-700/60 hover:bg-slate-700 text-slate-500'"
          >
            <span class="text-lg">{{ sound.soundEnabled.value ? '🔊' : '🔇' }}</span>
          </button>

          <template v-if="store.hasStudents">
            <div class="text-right hidden sm:block">
              <p class="text-xs text-slate-500">ผู้เข้าร่วมในรายชื่อ</p>
              <p class="text-sm font-bold text-white">
                <span class="text-violet-400">{{ store.poolCount }}</span>
                / {{ store.totalCount }} คน
              </p>
            </div>
            <button
              @click="showQuickRemove = true"
              class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="ค้นหาและจัดการรายชื่อ"
            >
              🔍 จัดการ
            </button>
            <button @click="store.resetPool()" class="btn-secondary text-xs py-1.5 px-3">
              🔄 รีเซ็ต
            </button>
          </template>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-7xl mx-auto w-full px-4 py-8 relative z-10">
      <SetupPanel v-if="!store.hasStudents && store.totalCount === 0" />

      <div v-else class="space-y-6">
        <!-- Mode Tabs -->
        <div class="flex flex-wrap gap-1.5 p-1.5 bg-slate-800/60 rounded-2xl w-fit mx-auto border border-slate-700/50">
          <button
            v-for="tab in tabs" :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'text-slate-400 hover:text-white',
            ]"
          >
            <span class="mr-1.5">{{ tab.icon }}</span>{{ tab.label }}
          </button>
        </div>

        <!-- Empty Pool -->
        <div v-if="store.poolCount === 0" class="card p-10 text-center max-w-lg mx-auto">
          <div class="text-6xl mb-4">🎊</div>
          <h2 class="text-2xl font-bold text-white mb-2">ครบทุกคนแล้ว!</h2>
          <p class="text-slate-400 mb-6">นำออกจากรายชื่อไปแล้ว {{ store.removedStudents.length }} คน</p>
          <button @click="store.resetPool()" class="btn-primary">🔄 รีเซ็ตรายชื่อทั้งหมด</button>
        </div>

        <template v-else>
          <SetupPanel v-if="activeTab === 'setup'" class="mt-0" />
          <WheelSpinner v-if="activeTab === 'wheel'" @winner="handleWinner" />
          <SpaceMode   v-if="activeTab === 'space'" @winner="handleWinner" />
          <RaceMode      v-if="activeTab === 'race'"      @ranking="handleRanking" />
          <LightningMode v-if="activeTab === 'lightning'" @winner="handleWinner" />
          <TornadoMode   v-if="activeTab === 'tornado'"   @winner="handleWinner" />
        </template>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800/60 py-3 relative z-10">
      <p class="text-center text-slate-500 text-xs">
        พัฒนาโดย <span class="text-violet-400 font-semibold">Dev Winai Nunkratok</span>
      </p>
    </footer>

    <!-- Single Winner Modal -->
    <WinnerModal
      v-if="winner"
      :student="winner"
      :pool-count="store.poolCount"
      @keep="onKeep"
      @remove="onRemove"
      @close="winner = null"
    />

    <!-- Quick Remove Modal -->
    <QuickRemove v-if="showQuickRemove" @close="showQuickRemove = false" />

    <!-- Race Ranking Modal -->
    <RankingModal
      v-if="raceRanking.length > 0"
      :ranking="raceRanking"
      @close="raceRanking = []"
      @remove-top1="onRemoveTop(1)"
      @remove-top3="onRemoveTop(3)"
    />
  </div>
</template>

<style scoped>
.title-fade-enter-active, .title-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.title-fade-enter-from { opacity: 0; transform: translateY(-4px); }
.title-fade-leave-to   { opacity: 0; transform: translateY(4px); }
</style>

<script setup lang="ts">
import type { Student } from '~/stores/students'

const store = useStudentStore()
const sound = useSound()

const activeTab      = ref('setup')
const winner         = ref<Student | null>(null)
const raceRanking    = ref<Student[]>([])
const showQuickRemove = ref(false)

const tabs = [
  { id: 'wheel',     icon: '🎡', label: 'วงล้อสุ่ม' },
  { id: 'space',     icon: '🚀', label: 'อวกาศ' },
  { id: 'race',      icon: '🏁', label: 'แข่งขัน' },
  { id: 'lightning', icon: '⚡', label: 'สายฟ้าฟาด' },
  { id: 'tornado',   icon: '🌪️', label: 'ทอร์นาโด' },
  { id: 'setup',     icon: '⚙️', label: 'ตั้งค่า' },
]

watch(() => store.totalCount, (val) => {
  if (val > 0 && activeTab.value === 'setup') activeTab.value = 'wheel'
})

function handleWinner(student: Student) { winner.value = student }
function onKeep()   { store.keepInPool(winner.value!.id); winner.value = null }
function onRemove() { store.removeFromPool(winner.value!.id); winner.value = null }

function handleRanking(ranked: Student[]) { raceRanking.value = ranked }
function onRemoveTop(n: number) {
  store.removeMultipleFromPool(raceRanking.value.slice(0, n).map(p => p.id))
  raceRanking.value = []
}
</script>
