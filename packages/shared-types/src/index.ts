export type Plan = "free" | "premium";

export type LoanDirection = "lent_out" | "borrowed";

export type LoanStatus = "active" | "returned" | "overdue" | "lost";

export type ReminderType = "pre_due" | "overdue" | "weekly_digest";

export type SubscriptionStatus = "active" | "canceled" | "past_due";

export interface NotificationPrefs {
  email_reminders: boolean;
  weekly_digest: boolean;
  /** ISO date (YYYY-MM-DD) of the Monday for the last weekly digest sent. */
  last_weekly_digest_at?: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  notification_prefs: NotificationPrefs;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  linked_user_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Item {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  description: string | null;
  photo_url: string | null;
  archived: boolean;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  item_id: string;
  contact_id: string;
  direction: LoanDirection;
  loaned_at: string;
  expected_return_at: string;
  returned_at: string | null;
  status: LoanStatus;
  notes: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoanWithRelations extends Loan {
  item?: Item;
  contact?: Contact;
}

export interface DashboardSummary {
  active_count: number;
  overdue_count: number;
  locked_count: number;
  returned_count: number;
  lent_out_count: number;
  borrowed_count: number;
  upcoming_due: LoanWithRelations[];
  top_contacts: { id: string; name: string; score: number; loans: number }[];
}

export interface ContactTrust {
  trust_score: number | null;
  total_loans: number;
  completed_loans?: number;
  returned_on_time: number;
  returned_late?: number;
  overdue: number;
  lost: number;
  active: number;
  is_verified_neighbor: boolean;
  has_score?: boolean;
  rating_label: string;
}

export interface LoginSession {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_label: string | null;
  location_hint: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface Subscription {
  id: string;
  user_id: string;
  provider_subscription_id: string;
  status: SubscriptionStatus;
  current_period_end: string;
  created_at: string;
}

export interface BillingStatus {
  plan: Plan;
  subscription: Subscription | null;
}

export interface Conversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationPreview {
  conversation_id: string;
  other_user_id: string;
  contact_id: string | null;
  contact_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}
