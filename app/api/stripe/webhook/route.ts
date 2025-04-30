import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabase-server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get the user with this Stripe customer ID
        const { data: users } = await supabase
          .from("users_metadata")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .limit(1)

        if (!users || users.length === 0) {
          console.error("No user found with Stripe customer ID:", customerId)
          return new NextResponse("User not found", { status: 404 })
        }

        const userId = users[0].user_id

        // Get the product details
        const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string)

        // Determine the subscription tier from product metadata
        const tier = product.metadata.tier || "free"

        // Update or create subscription in your database
        const { error } = await supabase.from("subscriptions").upsert({
          id: subscription.id,
          user_id: userId,
          status: subscription.status,
          tier,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          created_at: new Date(subscription.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) {
          console.error("Error updating subscription:", error)
          return new NextResponse("Error updating subscription", { status: 500 })
        }

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        // Delete or mark as canceled in your database
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", subscription.id)

        if (error) {
          console.error("Error canceling subscription:", error)
          return new NextResponse("Error canceling subscription", { status: 500 })
        }

        break
      }
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new NextResponse("Webhook handler failed", { status: 500 })
  }
}
