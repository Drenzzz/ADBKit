import { describe, expect, it } from 'vitest'
import SettingsPage from '../SettingsPage'
import { renderRoute } from '@/test-utils'

describe('SettingsPage smoke', () => {
  it('renders without crashing', () => {
    renderRoute(<SettingsPage />)
    expect(document.body).toBeTruthy()
  })
})
