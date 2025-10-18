import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  action: string;
  resource?: string;
  scope?: string;
  status: "success" | "error";
  error_code?: string;
  latency_ms?: number;
  metadata?: Record<string, any>;
}

/**
 * Hook for logging audit events
 * Usage:
 * const { logAction } = useAuditLog();
 * await logAction({ action: "email_fetch", status: "success", latency_ms: 150 });
 */
export function useAuditLog() {
  const logAction = async (entry: AuditLogEntry): Promise<void> => {
    try {
      const startTime = Date.now();
      
      const { error } = await supabase.functions.invoke("audit-log", {
        body: {
          action: entry.action,
          resource: entry.resource,
          scope: entry.scope,
          status: entry.status,
          error_code: entry.error_code,
          latency_ms: entry.latency_ms || Date.now() - startTime,
          metadata: entry.metadata || {},
        },
      });

      if (error) {
        // Don't throw - audit logging should never break the app
        console.warn("Failed to log audit event:", error);
      }
    } catch (error) {
      console.warn("Failed to log audit event:", error);
    }
  };

  /**
   * Wrap an async function with automatic audit logging
   */
  const withAudit = async <T>(
    action: string,
    fn: () => Promise<T>,
    options?: {
      resource?: string;
      scope?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await fn();
      await logAction({
        action,
        resource: options?.resource,
        scope: options?.scope,
        status: "success",
        latency_ms: Date.now() - startTime,
        metadata: options?.metadata,
      });
      return result;
    } catch (error: any) {
      await logAction({
        action,
        resource: options?.resource,
        scope: options?.scope,
        status: "error",
        error_code: error.code || error.name || "UNKNOWN",
        latency_ms: Date.now() - startTime,
        metadata: { ...options?.metadata, error: error.message },
      });
      throw error;
    }
  };

  return { logAction, withAudit };
}
