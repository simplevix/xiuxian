import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SCENES } from '@/types/game'
import type { Scene } from '@/types/game'

export const useWorldStore = defineStore('world', () => {
  const scenes = ref<Scene[]>(SCENES)
  const currentSceneId = ref<string | null>(null)

  function getSceneById(id: string): Scene | undefined {
    return scenes.value.find(s => s.id === id)
  }

  function setCurrentScene(id: string) {
    currentSceneId.value = id
  }

  return {
    scenes,
    currentSceneId,
    getSceneById,
    setCurrentScene
  }
})
