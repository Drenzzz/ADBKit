import { beforeEach, describe, expect, it } from 'vitest'
import { useFlasherStore } from '../useFlasherStore'
import type { FlashPlan } from '@/lib/types'

const makePlan = (steps: { partition: string; image_file: string }[]): FlashPlan => ({
  steps,
})

const THREE_PARTITION_PLAN = makePlan([
  { partition: 'boot', image_file: '/boot.img' },
  { partition: 'system', image_file: '/system.img' },
  { partition: 'vendor', image_file: '/vendor.img' },
])

describe('Flash Plan state machine', () => {
  beforeEach(() => {
    useFlasherStore.getState().reset()
  })

  it('reset restores initial state', () => {
    useFlasherStore.getState().setFlashPlan(makePlan([
      { partition: 'boot', image_file: '/boot.img' },
    ]))
    useFlasherStore.getState().setRunningFlash(true)
    useFlasherStore.getState().setError('test error')
    useFlasherStore.getState().reset()
    const s = useFlasherStore.getState()
    expect(s.flashPlan).toBeNull()
    expect(s.flashPlanSteps).toEqual([])
    expect(s.selectedPartitions).toEqual([])
    expect(s.runningFlash).toBe(false)
    expect(s.error).toBeNull()
  })

  describe('setFlashPlan', () => {
    it('sets flashPlan and creates steps with idle status', () => {
      const plan = makePlan([
        { partition: 'boot', image_file: '/boot.img' },
        { partition: 'system', image_file: '/system.img' },
      ])
      useFlasherStore.getState().setFlashPlan(plan)
      const s = useFlasherStore.getState()
      expect(s.flashPlan).toEqual(plan)
      expect(s.flashPlanSteps).toHaveLength(2)
      expect(s.flashPlanSteps[0]).toMatchObject({
        partition: 'boot',
        imageFile: '/boot.img',
        status: 'idle',
        detail: null,
      })
      expect(s.flashPlanSteps[1]).toMatchObject({
        partition: 'system',
        imageFile: '/system.img',
        status: 'idle',
      })
    })

    it('selects all partitions by default when plan is set', () => {
      const plan = makePlan([
        { partition: 'boot', image_file: '/boot.img' },
        { partition: 'system', image_file: '/system.img' },
      ])
      useFlasherStore.getState().setFlashPlan(plan)
      expect(useFlasherStore.getState().selectedPartitions).toEqual(['boot', 'system'])
    })

    it('null plan clears flashPlan, steps, and selection', () => {
      useFlasherStore.getState().setFlashPlan(makePlan([
        { partition: 'boot', image_file: '/boot.img' },
      ]))
      useFlasherStore.getState().setFlashPlan(null)
      const s = useFlasherStore.getState()
      expect(s.flashPlan).toBeNull()
      expect(s.flashPlanSteps).toEqual([])
      expect(s.selectedPartitions).toEqual([])
    })
  })

  describe('setFlashPlanStepStatus', () => {
    it('updates step status and detail', () => {
      useFlasherStore.getState().setFlashPlan(makePlan([
        { partition: 'boot', image_file: '/boot.img' },
      ]))
      useFlasherStore.getState().setFlashPlanStepStatus('boot', 'running', 'Flashing boot…')
      const step = useFlasherStore.getState().flashPlanSteps[0]
      expect(step.status).toBe('running')
      expect(step.detail).toBe('Flashing boot…')
    })

    it('ignores unknown partition', () => {
      useFlasherStore.getState().setFlashPlan(makePlan([
        { partition: 'boot', image_file: '/boot.img' },
      ]))
      useFlasherStore.getState().setFlashPlanStepStatus('unknown', 'success', 'done')
      const step = useFlasherStore.getState().flashPlanSteps[0]
      expect(step.status).toBe('idle')
      expect(step.detail).toBeNull()
    })

    it('updates multiple steps independently', () => {
      useFlasherStore.getState().setFlashPlan(makePlan([
        { partition: 'boot', image_file: '/boot.img' },
        { partition: 'system', image_file: '/system.img' },
      ]))
      useFlasherStore.getState().setFlashPlanStepStatus('boot', 'success', 'OK')
      useFlasherStore.getState().setFlashPlanStepStatus('system', 'running', 'Flashing…')
      const [boot, system] = useFlasherStore.getState().flashPlanSteps
      expect(boot.status).toBe('success')
      expect(system.status).toBe('running')
    })
  })

  describe('partition selection', () => {
    it('togglePartitionSelection removes selected partition', () => {
      useFlasherStore.getState().setFlashPlan(THREE_PARTITION_PLAN)
      useFlasherStore.getState().togglePartitionSelection('boot')
      expect(useFlasherStore.getState().selectedPartitions).toEqual(['system', 'vendor'])
    })

    it('togglePartitionSelection adds unselected partition', () => {
      useFlasherStore.getState().setFlashPlan(THREE_PARTITION_PLAN)
      useFlasherStore.getState().togglePartitionSelection('boot')
      useFlasherStore.getState().togglePartitionSelection('boot')
      expect(useFlasherStore.getState().selectedPartitions).toEqual(['system', 'vendor', 'boot'])
    })

    it('selectAllPartitions selects all partitions', () => {
      useFlasherStore.getState().setFlashPlan(THREE_PARTITION_PLAN)
      useFlasherStore.getState().togglePartitionSelection('boot')
      useFlasherStore.getState().selectAllPartitions()
      expect(useFlasherStore.getState().selectedPartitions).toEqual(['boot', 'system', 'vendor'])
    })

    it('deselectAllPartitions clears selection', () => {
      useFlasherStore.getState().setFlashPlan(THREE_PARTITION_PLAN)
      useFlasherStore.getState().deselectAllPartitions()
      expect(useFlasherStore.getState().selectedPartitions).toEqual([])
    })
  })

  describe('running flags', () => {
    it('runningFlash can be set independently', () => {
      useFlasherStore.getState().setRunningFlash(true)
      expect(useFlasherStore.getState().runningFlash).toBe(true)
      useFlasherStore.getState().setRunningFlash(false)
      expect(useFlasherStore.getState().runningFlash).toBe(false)
    })

    it('runningBatchFlash can be set independently', () => {
      useFlasherStore.getState().setRunningBatchFlash(true)
      expect(useFlasherStore.getState().runningBatchFlash).toBe(true)
      useFlasherStore.getState().setRunningBatchFlash(false)
      expect(useFlasherStore.getState().runningBatchFlash).toBe(false)
    })

    it('runningSideload can be set independently', () => {
      useFlasherStore.getState().setRunningSideload(true)
      expect(useFlasherStore.getState().runningSideload).toBe(true)
    })

    it('runningWipe can be set independently', () => {
      useFlasherStore.getState().setRunningWipe(true)
      expect(useFlasherStore.getState().runningWipe).toBe(true)
    })

    it('multiple running flags can be true simultaneously', () => {
      useFlasherStore.getState().setRunningFlash(true)
      useFlasherStore.getState().setRunningWipe(true)
      const s = useFlasherStore.getState()
      expect(s.runningFlash).toBe(true)
      expect(s.runningWipe).toBe(true)
    })
  })
})
