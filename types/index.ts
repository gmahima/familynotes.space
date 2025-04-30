export type Note = {
  id: string
  title: string
  content: string | null
  folder_id: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export type Folder = {
  id: string
  name: string
  user_id: string
  archived: boolean
  created_at: string
  updated_at: string
}

export type SubscriptionTier = "free" | "pro" | "family"

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "unpaid"
  | "paused"

export type Subscription = {
  id: string
  user_id: string
  status: SubscriptionStatus
  tier: SubscriptionTier
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export type Price = {
  id: string
  product_id: string
  active: boolean
  description: string
  unit_amount: number
  currency: string
  type: "one_time" | "recurring"
  interval: "day" | "week" | "month" | "year" | null
  interval_count: number | null
  trial_period_days: number | null
  metadata: Record<string, string>
}

export type Product = {
  id: string
  active: boolean
  name: string
  description: string | null
  image: string | null
  metadata: Record<string, string>
}
