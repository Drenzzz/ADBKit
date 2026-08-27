import { describe, expect, it } from 'vitest'
import TerminalPage from '../TerminalPage'
import { renderRoute } from '@/test-utils'

describe('TerminalPage smoke', () => {
  it('renders without crashing', () => {
    renderRoute(<TerminalPage />)
    expect(document.body).toBeTruthy()
  })
})
