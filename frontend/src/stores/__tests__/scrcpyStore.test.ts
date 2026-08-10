import { beforeEach, describe, expect, it } from 'vitest'
import { useScrcpyStore } from '../scrcpyStore'

describe('useScrcpyStore options', () => {
  beforeEach(() => {
    useScrcpyStore.getState().reset()
  })

  it('updates the active Scrcpy options', () => {
    useScrcpyStore.getState().setOptions({
      ...useScrcpyStore.getState().options,
      max_size: 1440,
      max_fps: 60,
    })

    expect(useScrcpyStore.getState().options.max_size).toBe(1440)
    expect(useScrcpyStore.getState().options.max_fps).toBe(60)
  })

  it('restores the default options on reset', () => {
    useScrcpyStore.getState().setOptions({
      ...useScrcpyStore.getState().options,
      max_size: 1440,
      no_audio: true,
    })

    useScrcpyStore.getState().reset()

    expect(useScrcpyStore.getState().options.max_size).toBe(0)
    expect(useScrcpyStore.getState().options.no_audio).toBe(false)
    expect(useScrcpyStore.getState().options.stay_awake).toBe(true)
  })
})
