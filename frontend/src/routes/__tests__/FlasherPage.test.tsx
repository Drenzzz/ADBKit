import { describe, expect, it } from 'vitest'
import FlasherPage from '../FlasherPage'
import { renderRoute } from '@/test-utils'

describe('FlasherPage smoke', () => {
  it('renders without crashing', () => {
    renderRoute(<FlasherPage />)
    expect(document.body).toBeTruthy()
  })
})
