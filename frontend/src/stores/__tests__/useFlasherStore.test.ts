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
    useFlasherStore.getState().setOperationStatus('flash', 'running')
    useFlasherStore.getState().setError('test error')
    useFlasherStore.getState().reset()
    const s = useFlasherStore.getState()
    expect(s.flashPlan).toBeNull()
    expect(s.flashPlanSteps).toEqual([])
    expect(s.selectedPartitions).toEqual([])
    expect(s.operations.flash).toBe('idle')
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

  describe('operation status', () => {
    it('starts every operation at idle', () => {
      const { operations } = useFlasherStore.getState()
      expect(operations).toEqual({
        flash: 'idle',
        batchFlash: 'idle',
        wipe: 'idle',
        sideload: 'idle',
        slotChange: 'idle',
        command: 'idle',
      })
    })

    it('tracks each operation independently', () => {
      useFlasherStore.getState().setOperationStatus('flash', 'running')
      const s = useFlasherStore.getState()
      expect(s.operations.flash).toBe('running')
      expect(s.operations.wipe).toBe('idle')
    })

    it('supports the full lifecycle per operation', () => {
      const transitions = ['pending', 'running', 'success'] as const
      for (const status of transitions) {
        useFlasherStore.getState().setOperationStatus('wipe', status)
        expect(useFlasherStore.getState().operations.wipe).toBe(status)
      }

      useFlasherStore.getState().setOperationStatus('wipe', 'error')
      expect(useFlasherStore.getState().operations.wipe).toBe('error')

      useFlasherStore.getState().setOperationStatus('wipe', 'cancelled')
      expect(useFlasherStore.getState().operations.wipe).toBe('cancelled')
    })

    it('does not let one operation reset another', () => {
      useFlasherStore.getState().setOperationStatus('flash', 'running')
      useFlasherStore.getState().setOperationStatus('sideload', 'running')
      useFlasherStore.getState().setOperationStatus('flash', 'idle')
      const s = useFlasherStore.getState()
      expect(s.operations.flash).toBe('idle')
      expect(s.operations.sideload).toBe('running')
    })

    it('reset returns all operations to idle', () => {
      useFlasherStore.getState().setOperationStatus('flash', 'running')
      useFlasherStore.getState().setOperationStatus('command', 'error')
      useFlasherStore.getState().reset()
      const { operations } = useFlasherStore.getState()
      expect(Object.values(operations).every((status) => status === 'idle')).toBe(true)
    })
  })
})
