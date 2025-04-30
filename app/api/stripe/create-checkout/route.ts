import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabase-server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(req: Request) {
  try {
    const supabase = createServerClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { priceId, successUrl, cancelUrl } = await req.json()

    if (!priceId || !successUrl || !cancelUrl) {
      return new NextResponse("Missing required parameters", { status: 400 })
    }

    // Check if user already has a Stripe customer ID
    const { data: userMetadata } = await supabase
      .from("users_metadata")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    let customerId: string

    if (userMetadata?.stripe_customer_id) {
      customerId = userMetadata.stripe_customer_id
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })

      customerId = customer.id

      // Save the customer ID to the database
      await supabase.from("users_metadata").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      })
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })

    return new NextResponse(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return new NextResponse("Error creating checkout session", { status: 500 })
  }
}
