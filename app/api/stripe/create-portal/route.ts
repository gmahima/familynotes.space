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

    const { returnUrl } = await req.json()

    if (!returnUrl) {
      return new NextResponse("Missing return URL", { status: 400 })
    }

    // Get the user's Stripe customer ID
    const { data: userMetadata } = await supabase
      .from("users_metadata")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (!userMetadata?.stripe_customer_id) {
      return new NextResponse("No Stripe customer found", { status: 404 })
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userMetadata.stripe_customer_id,
      return_url: returnUrl,
    })

    return new NextResponse(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return new NextResponse("Error creating portal session", { status: 500 })
  }
}
