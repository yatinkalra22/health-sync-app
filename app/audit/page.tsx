import AuditLogViewer from '@/components/audit/AuditLogViewer';
import { elasticsearch, getRecentAuditLogs } from '@/lib/services/elasticsearch';
import { getDemoAuditLogs } from '@/mock';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  let auditLogs;

  if (elasticsearch) {
    auditLogs = await getRecentAuditLogs(100);
    if (auditLogs.length === 0) {
      auditLogs = getDemoAuditLogs();
    }
  } else {
    auditLogs = getDemoAuditLogs();
  }

  return <AuditLogViewer logs={auditLogs} />;
}
