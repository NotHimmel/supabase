import { Edit, MoreVertical, Trash } from 'lucide-react'
import {
  Badge,
  Button,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { getConnectionStatusUi } from './AWSPrivateLink.utils'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { formatDatabaseID } from '@/data/read-replicas/replicas.utils'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

interface AWSPrivateLinkAccountItemProps {
  aws_account_id: string
  account_name?: string
  database_type?: 'PRIMARY' | 'READ_REPLICA'
  database_identifier?: string
  resource_access_manager_resource_config_id?: string
  resource_access_manager_resource_config_arn?: string
  resource_access_manager_share_arn?: string
  status:
    | 'CREATING'
    | 'READY'
    | 'ASSOCIATION_REQUEST_EXPIRED'
    | 'ASSOCIATION_ACCEPTED'
    | 'CREATION_FAILED'
    | 'DELETING'
  shared_at: string | null
  partner?: 'vercel'
  onEdit: () => void
  onDelete: () => void
}

export const AWSPrivateLinkAccountItem = ({
  aws_account_id,
  account_name,
  database_type,
  database_identifier,
  resource_access_manager_resource_config_id,
  resource_access_manager_resource_config_arn,
  resource_access_manager_share_arn,
  status,
  partner,
  onEdit,
  onDelete,
}: AWSPrivateLinkAccountItemProps) => {
  const databaseTarget =
    database_type === 'READ_REPLICA'
      ? `Read replica (ID: ${database_identifier ? formatDatabaseID(database_identifier) : 'Unknown identifier'})`
      : 'Primary database'
  const statusUi = getConnectionStatusUi(status)
  const vercelCue = partner === 'vercel' && (
    <PartnerIcon
      organization={{ managed_by: MANAGED_BY.VERCEL_MARKETPLACE }}
      tooltipText="Connected via Vercel"
      size="small"
    />
  )

  return (
    <CardContent className="flex items-center justify-between text-sm gap-4">
      <div className="flex-1">
        {account_name && (
          <div className="flex items-center gap-2">
            {vercelCue}
            <div className="font-medium text-foreground">{account_name}</div>
          </div>
        )}
        <div className="text-xs text-foreground-lighter">Database: {databaseTarget}</div>
        <div className="flex items-center gap-1.5 text-xs text-foreground-lighter">
          {!account_name && vercelCue}
          <span>Destination account: {aws_account_id}</span>
        </div>
        {resource_access_manager_resource_config_id && (
          <div className="flex items-center gap-x-1 text-xs text-foreground-lighter">
            <span>Resource configuration:</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono">{resource_access_manager_resource_config_id}</span>
              </TooltipTrigger>
              {(resource_access_manager_resource_config_arn ||
                resource_access_manager_share_arn) && (
                <TooltipContent side="bottom" className="max-w-xs break-all">
                  {resource_access_manager_resource_config_arn && (
                    <p>Resource config ARN: {resource_access_manager_resource_config_arn}</p>
                  )}
                  {resource_access_manager_share_arn && (
                    <p>Resource share ARN: {resource_access_manager_share_arn}</p>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </div>

      <Badge variant={statusUi.badgeVariant}>{statusUi.badge}</Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="text"
            className="px-1"
            icon={<MoreVertical />}
            aria-label="Connection actions"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onEdit} className="gap-x-2">
            <Edit size={14} />
            <span>View connection</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="gap-x-2">
            <Trash size={14} />
            <span>Delete connection</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardContent>
  )
}
