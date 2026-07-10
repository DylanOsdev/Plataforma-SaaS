import { describe, it, expect } from 'vitest'
import type { SparePart } from '../types'

// countLowStockItems doesn't exist yet — import will fail (RED in TDD)
import { countLowStockItems } from '../sparePartsApi'

describe('countLowStockItems', () => {
  it('should count items where currentStock is less than minStock', () => {
    const items: SparePart[] = [
      { currentStock: 3, minStock: 5 } as SparePart,
      { currentStock: 10, minStock: 5 } as SparePart,
      { currentStock: 1, minStock: 2 } as SparePart,
    ]

    expect(countLowStockItems(items)).toBe(2)
  })

  it('should return 0 when all items have sufficient stock', () => {
    const items: SparePart[] = [
      { currentStock: 10, minStock: 5 } as SparePart,
      { currentStock: 7, minStock: 7 } as SparePart,
      { currentStock: 20, minStock: 10 } as SparePart,
    ]

    expect(countLowStockItems(items)).toBe(0)
  })

  it('should return 0 for empty array', () => {
    expect(countLowStockItems([])).toBe(0)
  })
})
