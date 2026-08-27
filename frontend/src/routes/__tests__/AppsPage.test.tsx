import { describe, expect, it } from 'vitest'
import AppsPage from '../AppsPage'
import { renderRoute } from '@/test-utils'

describe('AppsPage smoke', () => {
  it('renders without crashing', () => {
    renderRoute(<AppsPage />)
    expect(document.body).toBeTruthy()
  })
})
