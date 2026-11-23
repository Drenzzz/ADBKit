import { describe, expect, it } from 'vitest'
import DashboardPage from '../DashboardPage'
import { renderRoute } from '@/test-utils'

describe('DashboardPage smoke', () => {
  it('renders the dashboard panels', async () => {
    renderRoute(<DashboardPage />)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(document.body.textContent).toContain('Wireless connection')
    expect(document.body.textContent).toContain('No device connected')
    expect(document.body.textContent).not.toContain('Live monitor')
  })
})
