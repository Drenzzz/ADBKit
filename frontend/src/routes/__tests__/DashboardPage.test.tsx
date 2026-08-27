import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import DashboardPage from '../DashboardPage'
import { renderRoute } from '@/test-utils'

describe('DashboardPage smoke', () => {
  it('renders without crashing', async () => {
    renderRoute(<DashboardPage />)
    expect(document.body).toBeTruthy()
  })
})
