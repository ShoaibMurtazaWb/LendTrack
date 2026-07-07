const STORAGE_KEY = "lendtrack-notification-dismissals";

export type NotificationDismissals = {
  overdueKey: string | null;
  dueSoonIds: string[];
};

function read(): NotificationDismissals {
  if (typeof window === "undefined") {
    return { overdueKey: null, dueSoonIds: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { overdueKey: null, dueSoonIds: [] };
    const parsed = JSON.parse(raw) as Partial<NotificationDismissals>;
    return {
      overdueKey: parsed.overdueKey ?? null,
      dueSoonIds: Array.isArray(parsed.dueSoonIds) ? parsed.dueSoonIds : [],
    };
  } catch {
    return { overdueKey: null, dueSoonIds: [] };
  }
}

function write(state: NotificationDismissals) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getNotificationDismissals(): NotificationDismissals {
  return read();
}

export function dismissOverdueAlert(overdueCount: number) {
  const state = read();
  state.overdueKey = String(overdueCount);
  write(state);
}

export function dismissDueSoonAlert(loanId: string) {
  const state = read();
  if (!state.dueSoonIds.includes(loanId)) {
    state.dueSoonIds = [...state.dueSoonIds, loanId];
  }
  write(state);
}

export function clearNotificationDismissals() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isOverdueDismissed(overdueCount: number): boolean {
  if (overdueCount <= 0) return true;
  return read().overdueKey === String(overdueCount);
}

export function isDueSoonDismissed(loanId: string): boolean {
  return read().dueSoonIds.includes(loanId);
}
