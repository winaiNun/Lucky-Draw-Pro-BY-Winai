import { defineStore } from 'pinia'
import { randomEmoji } from '~/composables/useEmoji'

export interface Student {
  id: string | number
  name: string
  imageFilename: string
  imageUrl: string | null
  emoji: string
}

export const useStudentStore = defineStore('students', () => {
  const allStudents     = ref<Student[]>([])
  const activePool      = ref<Student[]>([])
  const removedStudents = ref<Student[]>([])
  const drawTitle       = ref('')

  function setDrawTitle(title: string) { drawTitle.value = title }

  const poolCount = computed(() => activePool.value.length)
  const totalCount = computed(() => allStudents.value.length)
  const hasStudents = computed(() => activePool.value.length > 0)

  function loadStudents(students: Student[]) {
    const withEmoji = students.map(s => ({ ...s, emoji: s.emoji || randomEmoji() }))
    allStudents.value = withEmoji
    activePool.value = [...withEmoji]
    removedStudents.value = []
  }

  function removeFromPool(id: string | number) {
    const student = activePool.value.find(s => s.id === id)
    if (student) {
      removedStudents.value.push(student)
      activePool.value = activePool.value.filter(s => s.id !== id)
    }
  }

  function keepInPool(_id: string | number) {}

  function resetPool() {
    activePool.value = [...allStudents.value]
    removedStudents.value = []
  }

  function clearAll() {
    allStudents.value = []
    activePool.value = []
    removedStudents.value = []
  }

  function getRandomStudent(): Student | null {
    if (activePool.value.length === 0) return null
    return activePool.value[Math.floor(Math.random() * activePool.value.length)]
  }

  function getFullRanking(): Student[] {
    const arr = [...activePool.value]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  function reshuffleEmojis() {
    const remap = (list: Student[]) => list.map(s => ({ ...s, emoji: randomEmoji() }))
    allStudents.value = remap(allStudents.value)
    activePool.value = remap(activePool.value)
  }

  function removeMultipleFromPool(ids: (string | number)[]) {
    ids.forEach(id => {
      const s = activePool.value.find(x => x.id === id)
      if (s) removedStudents.value.push(s)
    })
    activePool.value = activePool.value.filter(s => !ids.includes(s.id))
  }

  return {
    allStudents,
    activePool,
    removedStudents,
    drawTitle,
    setDrawTitle,
    poolCount,
    totalCount,
    hasStudents,
    loadStudents,
    removeFromPool,
    removeMultipleFromPool,
    keepInPool,
    resetPool,
    clearAll,
    getRandomStudent,
    getFullRanking,
    reshuffleEmojis,
  }
})
