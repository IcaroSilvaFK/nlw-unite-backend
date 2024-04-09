import { describe, it, expect } from 'vitest'
import { generateSlug } from './generateSlug'


describe("#generateSlug", () => {
  it("Should expect return slug valid", () => {
    const expected = "slug-test"
    const input = "Slug test"

    const result = generateSlug(input)

    expect(result).toBe(expected)
  })

  it("Should remove invalid characters from string for generate slug", () => {
    const input = "ínvalid character"
    const expected = "invalid-character"

    const result = generateSlug(input)

    expect(result).toBe(expected)
  })
})