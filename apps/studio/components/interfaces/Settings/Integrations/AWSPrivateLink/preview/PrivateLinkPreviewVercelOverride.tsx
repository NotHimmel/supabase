/**
 * Prototype-only Vercel card overrides. Not a fake Vercel dashboard.
 */

import { Card, CardContent } from 'ui'

import { usePrivateLinkPreview } from './privateLinkPreview.store'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

export const PrivateLinkPreviewVercelOverride = () => {
  const { vercelCard } = usePrivateLinkPreview()

  if (vercelCard === 'live') return null

  if (vercelCard === 'not-connected') {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-foreground-lighter">Install Vercel integration</p>
        </CardContent>
      </Card>
    )
  }

  if (vercelCard === 'marketplace') {
    return (
      <Card>
        <CardContent className="flex items-start gap-3">
          <PartnerIcon
            organization={{ managed_by: MANAGED_BY.VERCEL_MARKETPLACE }}
            showTooltip={false}
            size="medium"
          />
          <div className="space-y-1">
            <p className="text-sm text-foreground">Connected to acme-app</p>
            <p className="text-sm text-foreground-lighter">
              Managed via Vercel Marketplace. Billing and environment variables stay on Vercel.
            </p>
          </div>
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
