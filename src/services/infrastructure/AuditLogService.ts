import { AuditLog, UserRole } from '@libraryos/shared';

const LOCAL_STORAGE_KEY = 'libraryos_audit_logs_v1';
const MAX_LOGS = 1000;

class AuditLogServiceClass {
  public getLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public log(entry: {
    action: string;
    entityType: string;
    entityId: string;
    performedBy: string;
    performerRole: UserRole;
    branchId?: string;
    details?: Record<string, any>;
  }): AuditLog {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      performedBy: entry.performedBy,
      performerRole: entry.performerRole,
      branchId: entry.branchId,
      details: entry.details,
    };

    const logs = this.getLogs();
    logs.unshift(newLog);

    // Keep within cap
    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to persist audit log to localStorage:', e);
    }

    return newLog;
  }
}

export const AuditLogService = new AuditLogServiceClass();
