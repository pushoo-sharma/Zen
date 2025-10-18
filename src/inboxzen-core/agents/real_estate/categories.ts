/**
 * Real Estate Categories
 * Defines inbox categories specific to real estate agents
 */

export type RealEstateCategory = 'ActiveDeals' | 'ClientLeads' | 'Showings' | 'Vendors' | 'Marketing';

export const CATEGORY_DEFS: Record<RealEstateCategory, {label: string; description: string}> = {
  ActiveDeals: { label: 'Active Deals', description: 'Escrow, offers, inspection, appraisal, title, escrow updates' },
  ClientLeads: { label: 'Client Leads', description: 'New buyer/seller inquiries from Zillow, Realtor.com, site forms' },
  Showings: { label: 'Showings', description: 'Scheduling, confirmations, reschedules, open house details' },
  Vendors: { label: 'Vendors', description: 'Lenders, title/escrow, inspectors, stagers, photographers' },
  Marketing: { label: 'Marketing', description: 'Newsletters, promos, non-urgent marketing' },
};

// Simple keyword seed map (extend later)
export const CATEGORY_KEYWORDS: Record<RealEstateCategory, string[]> = {
  ActiveDeals: ['escrow','offer','counter','disclosure','hoa','inspection','appraisal','title','wire','closing'],
  ClientLeads: ['interested','is it available','schedule a showing','pre-approved','cash buyer','listing'],
  Showings: ['showing','tour','appointment','open house','availability','time','schedule'],
  Vendors: ['lender','loan','escrow','title','inspector','photographer','contractor'],
  Marketing: ['newsletter','promo','unsubscribe','marketing'],
};
