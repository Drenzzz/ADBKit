import { describe, it, expect, beforeEach } from 'vitest'
import { useFlasherStore } from '../useFlasherStore'
import type { FlashPlan } from '@/lib/types'

describe('useFlasherStore', () => {
  beforeEach(() => {
    useFlasherStore.getState().reset()
  })

  it('starts with empty state', () => {
    const state = useFlasherStore.getState()
    expect(state.fastbootDevices).toEqual([])
    expect(state.selectedPartition).toBe('')
    expect(state.flashPlan).toBeNull()
    expect(state.error).toBeNull()
    expect(state.runningFlash).toBe(false)
  })

  it('sets fastboot devices', () => {
    const devices = [
      { serial: 'DEV001', state: 'fastboot' as const, mode: 'fastboot' as const },
    ]
    useFlasherStore.getState().setFastbootDevices(devices)
    expect(useFlasherStore.getState().fastbootDevices).toHaveLength(1)
  })

  it('sets selected partition and image', () => {
    useFlasherStore.getState().setSelectedPartition('boot')
    expect(useFlasherStore.getState().selectedPartition).toBe('boot')

    useFlasherStore.getState().setSelectedImagePath('/tmp/boot.img')
    expect(useFlasherStore.getState().selectedImagePath).toBe('/tmp/boot.img')
  })

  it('sets flash plan and creates steps', () => {
    const plan: FlashPlan = {
      folder_path: '/tmp/rom',
      steps: [
        { partition: 'boot', image_file: '/tmp/rom/boot.img' },
        { partition: 'system', image_file: '/tmp/rom/system.img' },
        { partition: 'vendor', image_file: '/tmp/rom/vendor.img' },
      ],
    }
    useFlasherStore.getState().setFlashPlan(plan)

    const state = useFlasherStore.getState()
    expect(state.flashPlan).not.toBeNull()
    expect(state.flashPlanSteps).toHaveLength(3)
    expect(state.selectedPartitions).toEqual(['boot', 'system', 'vendor'])
    expect(state.flashPlanSteps[0].status).toBe('idle')
  })

  it('clears flash plan when null', () => {
    const plan: FlashPlan = {
      folder_path: '/tmp/rom',
      steps: [{ partition: 'boot', image_file: '/tmp/boot.img' }],
    }
    useFlasherStore.getState().setFlashPlan(plan)
    useFlasherStore.getState().setFlashPlan(null)

    const state = useFlasherStore.getState()
    expect(state.flashPlan).toBeNull()
    expect(state.flashPlanSteps).toEqual([])
    expect(state.selectedPartitions).toEqual([])
  })

  it('updates flash plan step status', () => {
    const plan: FlashPlan = {
      folder_path: '/tmp/rom',
      steps: [{ partition: 'boot', image_file: '/tmp/boot.img' }],
    }
    useFlasherStore.getState().setFlashPlan(plan)
    useFlasherStore.getState().setFlashPlanStepStatus('boot', 'running')

    expect(useFlasherStore.getState().flashPlanSteps[0].status).toBe('running')
  })

  it('toggles partition selection', () => {
    const plan: FlashPlan = {
      folder_path: '/tmp/rom',
      steps: [
        { partition: 'boot', image_file: '/tmp/boot.img' },
        { partition: 'system', image_file: '/tmp/system.img' },
      ],
    }
    useFlasherStore.getState().setFlashPlan(plan)

    useFlasherStore.getState().togglePartitionSelection('boot')
    expect(useFlasherStore.getState().selectedPartitions).not.toContain('boot')

    useFlasherStore.getState().togglePartitionSelection('boot')
    expect(useFlasherStore.getState().selectedPartitions).toContain('boot')
  })

  it('selects and deselects all partitions', () => {
    const plan: FlashPlan = {
      folder_path: '/tmp/rom',
      steps: [
        { partition: 'boot', image_file: '/tmp/boot.img' },
        { partition: 'system', image_file: '/tmp/system.img' },
      ],
    }
    useFlasherStore.getState().setFlashPlan(plan)
    useFlasherStore.getState().deselectAllPartitions()
    expect(useFlasherStore.getState().selectedPartitions).toEqual([])

    useFlasherStore.getState().selectAllPartitions()
    expect(useFlasherStore.getState().selectedPartitions).toEqual(['boot', 'system'])
  })

  it('sets loading and running states', () => {
    useFlasherStore.getState().setRunningFlash(true)
    expect(useFlasherStore.getState().runningFlash).toBe(true)

    useFlasherStore.getState().setRunningWipe(true)
    expect(useFlasherStore.getState().runningWipe).toBe(true)

    useFlasherStore.getState().setLoadingDevices(true)
    expect(useFlasherStore.getState().loadingDevices).toBe(true)
  })

  it('sets and clears error', () => {
    useFlasherStore.getState().setError('flash failed')
    expect(useFlasherStore.getState().error).toBe('flash failed')

    useFlasherStore.getState().setError(null)
    expect(useFlasherStore.getState().error).toBeNull()
  })

  it('sets custom command and output', () => {
    useFlasherStore.getState().setCustomCommand('getvar:all')
    expect(useFlasherStore.getState().customCommand).toBe('getvar:all')

    useFlasherStore.getState().setCustomCommandOutput('result line 1\nresult line 2')
    expect(useFlasherStore.getState().customCommandOutput).toContain('result line 1')
  })

  it('resets to initial state', () => {
    useFlasherStore.getState().setSelectedPartition('boot')
    useFlasherStore.getState().setRunningFlash(true)
    useFlasherStore.getState().setError('error')

    useFlasherStore.getState().reset()

    const state = useFlasherStore.getState()
    expect(state.selectedPartition).toBe('')
    expect(state.runningFlash).toBe(false)
    expect(state.error).toBeNull()
  })
})
