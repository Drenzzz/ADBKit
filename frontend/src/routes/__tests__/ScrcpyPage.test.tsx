import { describe, expect, it } from 'vitest'
import ScrcpyPage from '../ScrcpyPage'
import { renderRoute } from '@/test-utils'

describe('ScrcpyPage smoke', () => {
  it('renders without crashing', () => {
    renderRoute(<ScrcpyPage />)
    expect(document.body).toBeTruthy()
  })
})
