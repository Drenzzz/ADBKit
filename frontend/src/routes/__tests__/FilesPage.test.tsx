import { describe, expect, it } from 'vitest'
import FilesPage from '../FilesPage'
import { renderRoute } from '@/test-utils'

describe('FilesPage smoke', () => {
  it('renders without crashing', () => {
    renderRoute(<FilesPage />)
    expect(document.body).toBeTruthy()
  })
})
