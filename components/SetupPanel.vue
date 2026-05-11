<template>
  <div class="space-y-8">
    <!-- Hero -->
    <div v-if="!store.hasStudents && store.totalCount === 0" class="text-center py-6">
      <div class="text-7xl mb-4 animate-bounce">🎯</div>
      <h2 class="text-4xl font-black text-white mb-3">Lucky Draw Pro</h2>
      <p class="text-slate-400 text-lg max-w-xl mx-auto">
        อัปโหลดรายชื่อผู้เข้าร่วม แล้วสุ่มได้ทันที — รองรับ Excel และโฟลเดอร์รูปภาพ
      </p>
    </div>

    <!-- Draw Title -->
    <div class="max-w-4xl mx-auto w-full">
      <div class="card p-5">
        <label class="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
          <span>📝</span> ชื่อหัวข้อ / รายการสุ่ม
          <span class="text-slate-500 font-normal text-xs">(แสดงตรงกลาง Navbar)</span>
        </label>
        <input
          v-model="titleProxy"
          type="text"
          maxlength="60"
          placeholder="เช่น สุ่มผู้นำเสนอ, จับฉลากรางวัล, เลือกกลุ่ม..."
          class="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
        />
      </div>
    </div>

    <div class="grid gap-5 md:grid-cols-2 max-w-4xl mx-auto">
      <!-- Step 1 -->
      <div class="card p-6 space-y-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">1</div>
          <h3 class="font-bold text-white">ดาวน์โหลดเทมเพลต</h3>
        </div>
        <p class="text-slate-400 text-sm">
          ไฟล์ Excel ต้นแบบ: <span class="text-white font-mono text-xs bg-slate-700 px-1.5 py-0.5 rounded">ID, Name, ImageFilename</span>
        </p>
        <button @click="downloadTemplate" class="btn-primary w-full">
          📥 ดาวน์โหลดเทมเพลต Excel
        </button>
      </div>

      <!-- Step 2 -->
      <div class="card p-6 space-y-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm">2</div>
          <h3 class="font-bold text-white">อัปโหลดรายชื่อ</h3>
        </div>
        <div
          class="upload-zone"
          :class="{ active: isDraggingExcel }"
          @click="excelInput?.click()"
          @dragover.prevent="isDraggingExcel = true"
          @dragleave="isDraggingExcel = false"
          @drop.prevent="onExcelDrop"
        >
          <div v-if="!excelFileName">
            <div class="text-3xl mb-2">📊</div>
            <p class="text-slate-300 font-medium">คลิกหรือลากไฟล์ Excel มาวางที่นี่</p>
            <p class="text-slate-500 text-xs mt-1">รองรับ .xlsx และ .xls</p>
          </div>
          <div v-else class="text-center">
            <div class="text-3xl mb-2">✅</div>
            <p class="text-emerald-400 font-semibold">{{ excelFileName }}</p>
            <p class="text-slate-400 text-sm">โหลดแล้ว {{ parsedList.length }} รายการ</p>
          </div>
        </div>
        <input ref="excelInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onExcelChange" />
        <p v-if="excelError" class="text-red-400 text-xs">{{ excelError }}</p>
      </div>

      <!-- Step 3 -->
      <div class="card p-6 space-y-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">3</div>
          <h3 class="font-bold text-white">อัปโหลดโฟลเดอร์รูปภาพ <span class="text-slate-500 font-normal text-xs">(ไม่บังคับ)</span></h3>
        </div>
        <p class="text-slate-400 text-sm">ชื่อไฟล์ต้องตรงกับคอลัมน์ <span class="text-white">ImageFilename</span> — ถ้าไม่มีรูปจะใช้อีโมจิแทน</p>
        <div class="upload-zone" @click="folderInput?.click()">
          <div v-if="imageFiles.length === 0">
            <div class="text-3xl mb-2">📁</div>
            <p class="text-slate-300 font-medium">คลิกเพื่อเลือกโฟลเดอร์รูปภาพ</p>
            <p class="text-slate-500 text-xs mt-1">รองรับ JPG, PNG, GIF, WEBP ฯลฯ</p>
          </div>
          <div v-else>
            <div class="text-3xl mb-2">🖼️</div>
            <p class="text-emerald-400 font-semibold">พบรูปภาพ {{ imageFiles.length }} ไฟล์</p>
            <p class="text-slate-400 text-sm">จับคู่ได้ {{ matchedCount }} คน</p>
          </div>
        </div>
        <!-- ไม่ใส่ accept เพื่อให้ browser ไม่กรองไฟล์ออก, กรองด้วย JS แทน -->
        <input ref="folderInput" type="file" webkitdirectory directory multiple class="hidden" @change="onFolderChange" />
      </div>

      <!-- Step 4 -->
      <div class="card p-6 space-y-4 flex flex-col">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">4</div>
          <h3 class="font-bold text-white">โหลดรายชื่อ</h3>
        </div>
        <p class="text-slate-400 text-sm flex-1">อัปโหลด Excel แล้วกดปุ่มด้านล่างเพื่อเริ่มใช้งาน</p>
        <button @click="loadParticipants" :disabled="parsedList.length === 0" class="btn-primary w-full">
          🚀 โหลด {{ parsedList.length }} รายการ
        </button>
        <button v-if="store.totalCount > 0" @click="store.clearAll()" class="btn-secondary w-full text-xs py-2">
          🗑️ ล้างทั้งหมด &amp; เริ่มใหม่
        </button>
      </div>
    </div>

    <!-- Preview -->
    <div v-if="parsedList.length > 0" class="max-w-4xl mx-auto">
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-white flex items-center gap-2">
            <span>👥</span> ตัวอย่างรายชื่อ
            <span class="text-sm font-normal text-slate-400">({{ parsedList.length }} รายการ)</span>
          </h3>
          <button
            @click="reshufflePreviewEmojis"
            class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            🎲 สุ่มอีโมจิใหม่
          </button>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-64 overflow-y-auto pr-1">
          <div
            v-for="s in parsedList"
            :key="s.id"
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-default"
          >
            <AvatarIcon :participant="s" :size="40" class="border-2" :class="s.imageUrl ? 'border-emerald-500/50' : 'border-slate-600/40'" />
            <p class="text-xs text-slate-300 text-center leading-tight truncate w-full">{{ s.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Current pool info (if already loaded) -->
    <div v-if="store.totalCount > 0 && parsedList.length === 0" class="max-w-4xl mx-auto">
      <div class="card p-5 flex items-center justify-between">
        <div>
          <p class="text-white font-semibold">📋 โหลดแล้ว {{ store.totalCount }} รายการ</p>
          <p class="text-slate-400 text-sm">ในรายชื่อ {{ store.poolCount }} คน • นำออกแล้ว {{ store.removedStudents.length }} คน</p>
        </div>
        <button @click="store.reshuffleEmojis()" class="btn-secondary text-xs py-2 px-3">🎲 สุ่มอีโมจิใหม่</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { randomEmoji } from '~/composables/useEmoji'
import type { Student } from '~/stores/students'

declare const XLSX: any

const store = useStudentStore()

// two-way proxy for drawTitle so v-model works with the store
const titleProxy = computed({
  get: () => store.drawTitle,
  set: (v: string) => store.setDrawTitle(v),
})

const excelInput = ref<HTMLInputElement | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)
const isDraggingExcel = ref(false)
const excelFileName = ref('')
const excelError = ref('')
const parsedList = ref<Student[]>([])
const imageFiles = ref<File[]>([])
const imageMap = ref<Map<string, string>>(new Map())

const matchedCount = computed(() =>
  parsedList.value.filter(s => imageMap.value.has(s.imageFilename?.toLowerCase())).length
)

function downloadTemplate() {
  if (typeof XLSX === 'undefined') {
    alert('กำลังโหลด SheetJS อยู่ กรุณารอสักครู่แล้วลองใหม่')
    return
  }
  const wb = XLSX.utils.book_new()
  const data = [
    ['ID', 'Name', 'ImageFilename'],
    [1, 'สมชาย ใจดี', 'somchai.jpg'],
    [2, 'มาลี สวยงาม', 'malee.jpg'],
    [3, 'วินัย เก่งมาก', 'winai.png'],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Participants')
  XLSX.writeFile(wb, 'lucky_draw_template.xlsx')
}

function parseExcel(file: File) {
  excelError.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      if (typeof XLSX === 'undefined') {
        excelError.value = 'ยังโหลด SheetJS ไม่เสร็จ กรุณารอสักครู่แล้วลองใหม่'
        return
      }
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

      parsedList.value = rows.map((row, idx) => ({
        id: row['ID'] ?? row['id'] ?? idx + 1,
        name: String(row['Name'] ?? row['name'] ?? `ผู้เข้าร่วม ${idx + 1}`).trim(),
        imageFilename: String(row['ImageFilename'] ?? row['imagefilename'] ?? row['image'] ?? '').trim(),
        imageUrl: null,
        emoji: randomEmoji(),
      }))
      excelFileName.value = file.name
      rebuildImageUrls()
    } catch {
      excelError.value = 'ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาใช้เทมเพลตที่ดาวน์โหลดไว้'
    }
  }
  reader.readAsArrayBuffer(file)
}

function onExcelChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) parseExcel(file)
}

function onExcelDrop(e: DragEvent) {
  isDraggingExcel.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) parseExcel(file)
}

const IMG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif', '.svg', '.tiff', '.tif'])

function onFolderChange(e: Event) {
  const all = Array.from((e.target as HTMLInputElement).files ?? [])
  const imgs = all.filter(f => {
    if (f.type.startsWith('image/')) return true
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    return IMG_EXTS.has(ext)
  })
  imageFiles.value = imgs
  imageMap.value = new Map(imgs.map(f => [f.name.toLowerCase().trim(), URL.createObjectURL(f)]))
  rebuildImageUrls()
}

function rebuildImageUrls() {
  parsedList.value = parsedList.value.map(s => ({
    ...s,
    imageUrl: imageMap.value.get(s.imageFilename?.toLowerCase()) ?? null,
  }))
}

function reshufflePreviewEmojis() {
  parsedList.value = parsedList.value.map(s => ({ ...s, emoji: randomEmoji() }))
}

function loadParticipants() {
  if (parsedList.value.length === 0) return
  store.loadStudents(parsedList.value)
}
</script>
