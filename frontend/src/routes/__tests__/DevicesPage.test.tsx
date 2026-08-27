import { describe, expect, it } from 'vitest'
import DevicesPage from '../DevicesPage'
import { renderRoute } from '@/test-utils'

describe('DevicesPage smoke', () => {
  it('renders without crashing', () => {
    renderRoute(<DevicesPage />)
    expect(document.body).toBeTruthy()
  })
})
