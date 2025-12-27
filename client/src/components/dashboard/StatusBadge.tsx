import { MaintenanceRequest } from '@/lib/dummyData';
import { Badge } from '@/components/ui/Badge';

function getStageVariant(stage: MaintenanceRequest['stage']): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'neutral' {
  switch (stage) {
    case 'new':
      return 'primary';
    case 'in_progress':
      return 'warning';
    case 'repaired':
      return 'success';
    case 'scrap':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export default function StatusBadge({ stage }: { stage: MaintenanceRequest['stage'] }) {
  return (
    <Badge variant={getStageVariant(stage)} size="sm">
      {stage.replace('_', ' ')}
    </Badge>
  );
}
