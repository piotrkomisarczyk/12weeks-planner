import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import type { PlanStatus } from '@/types';

interface BreadcrumbsProps {
  planTitle?: string;
  planStatus?: PlanStatus;
  currentPath: string;
}

interface BreadcrumbSegment {
  label: string;
  href?: string;
  isActive: boolean;
  type?: 'plan';
  planStatus?: PlanStatus;
}

/**
 * Get badge variant for plan status
 */
function getStatusBadgeVariant(status: PlanStatus) {
  switch (status) {
    case 'ready':
      return 'secondary';
    case 'active':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'archived':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Format plan status for display
 */
function formatStatus(status: PlanStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Parses the URL path and generates breadcrumb segments
 */
function parsePath(path: string, planTitle?: string, planStatus?: PlanStatus): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [];
  const parts = path.split('/').filter(Boolean);

  // Handle root path
  if (parts.length === 0) {
    return [{ label: 'Home', href: '/', isActive: true }];
  }

  // Build breadcrumbs based on path structure
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const pathUpToHere = '/' + parts.slice(0, i + 1).join('/');

    // Handle different path segments
    if (part === 'plans') {
      segments.push({
        label: 'Plans',
        href: isLast ? undefined : '/plans',
        isActive: isLast,
      });
    } else if (i > 0 && parts[i - 1] === 'plans' && part.match(/^[a-f0-9-]{36}$/i)) {
      // This is a plan ID, use plan title if available
      const title = planTitle || 'Plan';
      const truncatedTitle = title.length > 64 ? title.slice(0, 64) + '...' : title;
      segments.push({
        label: truncatedTitle,
        href: isLast ? undefined : pathUpToHere,
        isActive: isLast,
        type: 'plan',
        planStatus,
      });
    } else if (part === 'dashboard') {
      segments.push({
        label: 'Dashboard',
        href: isLast ? undefined : pathUpToHere,
        isActive: isLast,
      });
    } else if (part === 'hierarchy') {
      segments.push({
        label: 'Hierarchy',
        href: isLast ? undefined : pathUpToHere,
        isActive: isLast,
      });
    } else if (part === 'goals') {
      segments.push({
        label: 'Goals',
        href: isLast ? undefined : pathUpToHere,
        isActive: isLast,
      });
    } else if (part === 'week') {
      // Week segment - might be followed by week number
      if (i + 1 < parts.length && parts[i + 1].match(/^\d+$/)) {
        const weekNum = parts[i + 1];
        segments.push({
          label: `Week ${weekNum}`,
          href: isLast || i + 1 === parts.length - 1 ? undefined : `${pathUpToHere}/${weekNum}`,
          isActive: i + 1 === parts.length - 1,
        });
        i++; // Skip the next iteration as we've processed the week number
      } else {
        segments.push({
          label: 'Week',
          href: isLast ? undefined : pathUpToHere,
          isActive: isLast,
        });
      }
    } else if (part === 'day') {
      // Day segment - might be followed by day number
      if (i + 1 < parts.length && parts[i + 1].match(/^\d+$/)) {
        const dayNum = parts[i + 1];
        segments.push({
          label: `Day ${dayNum}`,
          href: isLast || i + 1 === parts.length - 1 ? undefined : `${pathUpToHere}/${dayNum}`,
          isActive: i + 1 === parts.length - 1,
        });
        i++; // Skip the next iteration
      } else {
        segments.push({
          label: 'Day',
          href: isLast ? undefined : pathUpToHere,
          isActive: isLast,
        });
      }
    } else if (part === 'review') {
      // Review segment - might be followed by week number
      if (i + 1 < parts.length && parts[i + 1].match(/^\d+$/)) {
        const weekNum = parts[i + 1];
        segments.push({
          label: `Review Week ${weekNum}`,
          href: isLast || i + 1 === parts.length - 1 ? undefined : `${pathUpToHere}/${weekNum}`,
          isActive: i + 1 === parts.length - 1,
        });
        i++; // Skip the next iteration
      } else {
        segments.push({
          label: 'Review',
          href: isLast ? undefined : pathUpToHere,
          isActive: isLast,
        });
      }
    } else if (part === 'wizard') {
      segments.push({
        label: 'Create Plan',
        href: isLast ? undefined : pathUpToHere,
        isActive: isLast,
      });
    } else if (!part.match(/^\d+$/) && !part.match(/^[a-f0-9-]{36}$/i)) {
      // Generic segment (not a number or UUID)
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      segments.push({
        label,
        href: isLast ? undefined : pathUpToHere,
        isActive: isLast,
      });
    }
  }

  return segments;
}

export function Breadcrumbs({ planTitle, planStatus, currentPath }: BreadcrumbsProps) {
  const breadcrumbs = parsePath(currentPath, planTitle, planStatus);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="contents">
            <BreadcrumbItem>
              {crumb.isActive ? (
                crumb.type === 'plan' && crumb.planStatus ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    <span>{crumb.label}</span>
                    <Badge variant={getStatusBadgeVariant(crumb.planStatus)}>
                      {formatStatus(crumb.planStatus)}
                    </Badge>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )
              ) : crumb.type === 'plan' && crumb.planStatus ? (
                <BreadcrumbLink href={crumb.href} className="flex items-center gap-2">
                  <span>{crumb.label}</span>
                  <Badge variant={getStatusBadgeVariant(crumb.planStatus)}>
                    {formatStatus(crumb.planStatus)}
                  </Badge>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
