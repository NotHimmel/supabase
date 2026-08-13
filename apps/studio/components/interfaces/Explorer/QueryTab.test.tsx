import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryTab } from './QueryTab'
import { explorerQueryState } from '@/state/explorer-query'
import { createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'

const testContext = vi.hoisted(() => ({
  flags: { otelLegacyLogs: true } as Record<string, boolean>,
  replicas: {
    data: [] as Array<{ identifier: string; connectionString: string }>,
    isPending: false,
  },
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => ({ ref: 'default', id: 'query-test' }),
    useFlag: (flag: string) => testContext.flags[flag] ?? false,
  }
})

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'default', connectionString: 'postgresql://primary' },
  }),
}))

vi.mock('@/data/read-replicas/replicas-query', () => ({
  useReadReplicasQuery: () => testContext.replicas,
}))

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: ({ value }: { value: string }) => (
    <textarea aria-label="SQL editor" value={value} readOnly />
  ),
}))

vi.mock('./ExplorerQuerySourceMenu', () => ({ ExplorerQuerySourceMenu: () => null }))

const renderQueryTab = () =>
  customRender(
    <TabsStateContext.Provider value={createTabsState('default')}>
      <QueryTab />
    </TabsStateContext.Provider>
  )

const createDraft = (
  source:
    | { id: 'database'; type: 'database'; parameters: { identifier?: string } }
    | {
        id: 'logs'
        type: 'logs'
        parameters: {
          time_range: { type: 'relative'; amount: number; unit: 'hour' }
        }
      }
) => {
  explorerQueryState.removeDraft({ id: 'query-test', projectRef: 'default' })
  explorerQueryState.createDraft({
    id: 'query-test',
    projectRef: 'default',
    sql: 'select 1',
    source,
  })
}

beforeEach(() => {
  setupSqlEditorMocks()
  testContext.flags.otelLegacyLogs = true
  testContext.replicas = { data: [], isPending: false }
  explorerQueryState.removeDraft({ id: 'query-test', projectRef: 'default' })
})

describe('QueryTab execution', () => {
  it('records an unavailable error and skips the logs endpoint when the flag is off', async () => {
    testContext.flags.otelLegacyLogs = false
    createDraft({
      id: 'logs',
      type: 'logs',
      parameters: { time_range: { type: 'relative', amount: 1, unit: 'hour' } },
    })
    const requests: Request[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: ({ request }) => {
        requests.push(request)
        return HttpResponse.json({ result: [] })
      },
    })

    renderQueryTab()
    await userEvent.click(await screen.findByRole('button', { name: 'Run' }))

    expect(
      await screen.findByText("Error: Querying logs isn't available for this project yet.")
    ).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('waits for replicas, then fails closed when the selected database is absent', async () => {
    testContext.replicas = { data: [], isPending: true }
    createDraft({
      id: 'database',
      type: 'database',
      parameters: { identifier: 'missing-replica' },
    })
    const requests: Request[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        requests.push(request)
        return HttpResponse.json([])
      },
    })

    const { rerender } = renderQueryTab()
    expect(await screen.findByRole('button', { name: 'Run' })).toBeDisabled()

    testContext.replicas = { data: [], isPending: false }
    rerender(
      <TabsStateContext.Provider value={createTabsState('default')}>
        <QueryTab />
      </TabsStateContext.Provider>
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Run' }))

    expect(
      await screen.findByText('Error: Unable to run query: Connection string is missing')
    ).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('resolves a relative logs range before sending the request', async () => {
    createDraft({
      id: 'logs',
      type: 'logs',
      parameters: { time_range: { type: 'relative', amount: 2, unit: 'hour' } },
    })
    const bodies: Array<{ iso_timestamp_start: string; iso_timestamp_end: string }> = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        bodies.push((await request.json()) as (typeof bodies)[number])
        return HttpResponse.json({ result: [] })
      },
    })

    renderQueryTab()
    await userEvent.click(await screen.findByRole('button', { name: 'Run' }))
    await waitFor(() => expect(bodies).toHaveLength(1))

    expect(
      new Date(bodies[0].iso_timestamp_end).getTime() -
        new Date(bodies[0].iso_timestamp_start).getTime()
    ).toBe(2 * 60 * 60 * 1000)
  })
})
