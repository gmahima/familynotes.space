import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { BillingInfo } from "@/components/billing/billing-info"
import { SubscriptionPlans } from "@/components/billing/subscription-plans"
import type { Subscription } from "@/types"

export default async function BillingPage() {
  const supabase = createServerClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's current subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Get available plans
  const { data: prices } = await supabase
    .from("prices")
    .select("*, products(*)")
    .eq("active", true)
    .order("unit_amount", { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      <BillingInfo subscription={subscription as Subscription | null} />

      <div className="border-t pt-8">
        <h3 className="text-xl font-semibold mb-4">Available Plans</h3>
        <SubscriptionPlans prices={prices || []} currentSubscription={subscription as Subscription | null} />
      </div>
    </div>
  )
}
