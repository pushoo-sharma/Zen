export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: "$8.99",
    priceId: "price_1SIBwhH9Gpps3CaASnq3x4RS",
    productId: "prod_TEfHHCYld6RPRq",
    perUser: false,
    features: [
      "Up to 500 emails/month processed",
      "Smart sorting & daily summary digest",
      "1 linked account (Gmail or Outlook)"
    ]
  },
  pro: {
    name: "Pro",
    price: "$39.99",
    priceId: "price_1SIBykH9Gpps3CaAc8kbiNgj",
    productId: "prod_TEfJvmEfyCQUSc",
    perUser: false,
    features: [
      "Unlimited email processing",
      "Smart reply drafts in your tone",
      "Scheduling & reminders",
      "Priority inbox analytics"
    ]
  },
  team: {
    name: "Team",
    price: "$49.99",
    priceId: "price_1SIBzNH9Gpps3CaAzvSqKRm0",
    productId: "prod_TEfKyHE9p5vjDl",
    perUser: true,
    features: [
      "Team inbox collaboration (assign emails, shared tags)",
      "CRM-style contact enrichment",
      "AI summaries across threads",
      "Central dashboard for all agents"
    ]
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
