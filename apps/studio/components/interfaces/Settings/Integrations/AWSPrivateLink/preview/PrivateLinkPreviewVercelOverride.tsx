/**
 * Prototype-only Vercel card overrides. Not a fake Vercel dashboard.
 */

import { Card, CardContent, Input } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

import { usePrivateLinkPreview } from './privateLinkPreview.store'

export const PrivateLinkPreviewVercelOverride = () => {
  const { vercelCard } = usePrivateLinkPreview()

  if (vercelCard === 'live' || vercelCard === 'not-connected') return null

  if (vercelCard === 'marketplace') {
    return (
      <Card>
        <CardContent>
          <FormLayout
            layout="flex-row-reverse"
            label="Vercel project"
            description="Managed via Vercel Marketplace. Billing and environment variables stay on Vercel."
          >
            <div className="w-full md:w-64">
              <Input readOnly value="acme-app" onFocus={(e) => e.target.blur()} />
            </div>
          </FormLayout>
        </CardContent>
      </Card>
    )
  }

  if (vercelCard === 'initiated') {
    return (
      <Card>
        <CardContent className="space-y-1">
          <p className="text-sm text-foreground">Linked from Vercel</p>
          <p className="text-sm text-foreground-lighter">
            Billing and environment variables stay on Vercel. The private database path is in AWS
            PrivateLink below.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-sm text-foreground">Linked from Vercel</p>
        <p className="text-sm text-foreground-lighter">
          Marketplace manages billing. AWS PrivateLink below is the private database path. These are
          not the same connection.
        </p>
      </CardContent>
    </Card>
  )
}
