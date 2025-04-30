"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Subscription } from "@/types"

interface BillingInfoProps {
  subscription: Subscription | null
}

export function BillingInfo({ subscription }: BillingInfoProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create billing portal session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error creating billing portal session:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "trialing":
        return "bg-blue-500"
      case "canceled":
        return "bg-yellow-500"
      case "past_due":
      case "incomplete":
      case "incomplete_expired":
      case "unpaid":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1)
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>You are currently on the free plan</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Upgrade to a paid plan to access premium features.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Subscription</CardTitle>
            <CardDescription>Manage your subscription and billing information</CardDescription>
          </div>
          <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">Plan</p>
          <p className="text-lg">{formatTier(subscription.tier)} Plan</p>
        </div>
        <div>
          <p className="font-medium">Billing Period</p>
          <p>
            {subscription.cancel_at_period_end
              ? `Ends on ${format(new Date(subscription.current_period_end), "MMMM d, yyyy")}`
              : `Renews on ${format(new Date(subscription.current_period_end), "MMMM d, yyyy")}`}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleManageSubscription} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Subscription
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
