"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Price, Product, Subscription } from "@/types"

interface SubscriptionPlansProps {
  prices: Array<Price & { products: Product }>
  currentSubscription: Subscription | null
}

export function SubscriptionPlans({ prices, currentSubscription }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setLoading(null)
    }
  }

  const formatPrice = (price: Price) => {
    const amount = (price.unit_amount / 100).toFixed(2)
    return `$${amount}/${price.interval}`
  }

  const isCurrentPlan = (price: Price) => {
    if (!currentSubscription) return false
    return (
      currentSubscription.tier === price.product_id &&
      currentSubscription.status !== "canceled" &&
      !currentSubscription.cancel_at_period_end
    )
  }

  // Group prices by product
  const productPrices: Record<string, Array<Price & { products: Product }>> = {}
  prices.forEach((price) => {
    if (!productPrices[price.products.id]) {
      productPrices[price.products.id] = []
    }
    productPrices[price.products.id].push(price)
  })

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Object.entries(productPrices).map(([productId, productPrices]) => {
        const product = productPrices[0].products
        const price = productPrices[0] // Use the first price for now

        const features = product.metadata.features ? JSON.parse(product.metadata.features) : []

        return (
          <Card key={productId} className={isCurrentPlan(price) ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">{formatPrice(price)}</p>
              </div>
              <ul className="space-y-2">
                {features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscribe(price.id)}
                disabled={loading === price.id || isCurrentPlan(price)}
                className="w-full"
                variant={isCurrentPlan(price) ? "outline" : "default"}
              >
                {loading === price.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentPlan(price) ? (
                  "Current Plan"
                ) : (
                  "Subscribe"
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
