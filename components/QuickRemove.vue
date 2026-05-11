<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')" />

      <div class="relative z-10 card w-full max-w-md shadow-2xl border-slate-600/40 flex flex-col max-h-[85vh] animate-zoom-in">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 class="font-bold text-white flex items-center gap-2">🔍 ค้นหาและจัดการรายชื่อ</h2>
            <p class="text-xs text-slate-400 mt-0.5">
              ในรายชื่อ <span class="text-violet-400 font-bold">{{ store.poolCount }}</span> คน
              · นำออกแล้ว <span class="text-red-400 font-bold">{{ store.removedStudents.length }}</span> คน
            </p>
          </div>
          <button @click="$emit('close')" class="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors">✕</button>
        </div>

        <!-- Search -->
        <div class="px-4 py-3 border-b border-slate-700/40 flex-shrink-0">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              v-model="query"
              type="text"
              placeholder="พิมพ์ชื่อเพื่อค้นหา..."
              class="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              autofocus
            />
            <button v-if="query" @click="query=''" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>
          </div>
        </div>

        <!-- Lists -->
        <div class="flex-1 overflow-y-auto min-h-0">
          <!-- Active pool -->
          <div v-if="filteredActive.length > 0">
            <p class="px-4 pt-3 pb-1 text-xs text-slate-500 uppercase tracking-wider font-semibold">อยู่ในรายชื่อสุ่ม</p>
            <div class="px-3 pb-2 space-y-1">
              <div
                v-for="p in filteredActive" :key="p.id"
                class="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-700/40 hover:bg-slate-700/70 transition-colors group"
              >
                <AvatarIcon :participant="p" :size="32" class="border border-slate-600/40 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-white font-medium truncate">{{ p.name }}</p>
                  <p class="text-xs text-slate-500">ID: {{ p.id }}</p>
                </div>
                <button
                  @click="store.removeFromPool(p.id)"
                  class="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 border border-red-600/30 transition-all opacity-0 group-hover:opacity-100"
                >
                  ❌ นำออก
                </button>
              </div>
            </div>
          </div>

          <!-- Removed -->
          <div v-if="filteredRemoved.length > 0">
            <p class="px-4 pt-3 pb-1 text-xs text-slate-500 uppercase tracking-wider font-semibold">นำออกแล้ว</p>
            <div class="px-3 pb-3 space-y-1">
              <div
                v-for="p in filteredRemoved" :key="p.id"
                class="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/50 transition-colors group opacity-60 hover:opacity-100"
              >
                <AvatarIcon :participant="p" :size="32" class="border border-slate-700/40 flex-shrink-0 grayscale" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-slate-400 font-medium truncate line-through">{{ p.name }}</p>
                  <p class="text-xs text-slate-600">ID: {{ p.id }}</p>
                </div>
                <button
                  @click="restoreParticipant(p.id)"
                  class="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 hover:text-emerald-300 border border-emerald-600/30 transition-all opacity-0 group-hover:opacity-100"
                >
                  ↩️ คืนกลับ
                </button>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="filteredActive.length === 0 && filteredRemoved.length === 0" class="text-center py-10 text-slate-500">
            <p class="text-3xl mb-2">🔍</p>
            <p class="text-sm">ไม่พบชื่อ "{{ query }}"</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-slate-700/40 flex-shrink-0">
          <button @click="$emit('close')" class="btn-primary w-full py-2.5">✅ เสร็จสิ้น</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const store = useStudentStore()
defineEmits<{ (e: 'close'): void }>()

const query = ref('')

const filteredActive = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return store.activePool
  return store.activePool.filter(p => p.name.toLowerCase().includes(q) || String(p.id).includes(q))
})

const filteredRemoved = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return store.removedStudents
  return store.removedStudents.filter(p => p.name.toLowerCase().includes(q) || String(p.id).includes(q))
})

function restoreParticipant(id: string | number) {
  const idx = store.removedStudents.findIndex(p => p.id === id)
  if (idx === -1) return
  const p = store.removedStudents[idx]
  store.removedStudents.splice(idx, 1)
  store.activePool.push(p)
}
</script>
