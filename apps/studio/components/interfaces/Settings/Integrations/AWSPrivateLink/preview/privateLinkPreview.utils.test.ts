import { describe, expect, it } from 'vitest'

import {
  getPrivateLinkPreviewScenarioConfig,
  isPrivateLinkPreviewScenario,
} from './privateLinkPreview.constants'
import { getPreviewAccounts } from './privateLinkPreview.mocks'

describe('isPrivateLinkPreviewScenario', () => {
  it('accepts known scenarios', () => {
    expect(isPrivateLinkPreviewScenario('vercel-initiated')).toBe(true)
    expect(isPrivateLinkPreviewScenario('b5-studio-copy')).toBe(true)
  })

  it('rejects unknown values', () => {
    expect(isPrivateLinkPreviewScenario('nope')).toBe(false)
  })
})

describe('getPreviewAccounts', () => {
  it('keeps Vercel and AWS-direct in one list for mixed rows', () => {
    const accounts = getPreviewAccounts('mixed-rows', 'abc')
    expect(accounts).toHaveLength(2)
    expect(accounts.some((account) => account.partner === 'vercel')).toBe(true)
    expect(accounts.some((account) => account.partner === undefined)).toBe(true)
  })

  it('omits a nickname on Vercel-initiated rows', () => {
    const [account] = getPreviewAccounts('vercel-initiated', 'abc')
    expect(account?.partner).toBe('vercel')
    expect(account?.account_name).toBeUndefined()
  })

  it('leaves marketplace without PrivateLink rows', () => {
    expect(getPreviewAccounts('marketplace')).toEqual([])
  })
})

describe('getPrivateLinkPreviewScenarioConfig', () => {
  it('marks B5 as Studio copy only', () => {
    const config = getPrivateLinkPreviewScenarioConfig('b5-studio-copy')
    expect(config.vercelCard).toBe('distinguish-billing')
    expect(config.b5Note).toMatch(/Vercel’s dashboard/)
  })
})
