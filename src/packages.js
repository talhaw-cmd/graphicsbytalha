// Starting prices in PKR (estimates for the Pakistan market; Talha can change these).
export const CATEGORIES = [
  { id: 'posters', name: 'Social media and posters', color: '#F2B600', tiers: [
    { id: 'basic', name: 'Basic', pkr: 3000, includes: '1 poster or post, one size', rev: 2, days: 2 },
    { id: 'standard', name: 'Standard', pkr: 8000, includes: '3 posts or posters in a matching style, 2 sizes', rev: 3, days: 4 },
    { id: 'premium', name: 'Premium', pkr: 20000, includes: '8 designs with a campaign look, all sizes, source files', rev: 5, days: 7 },
  ] },
  { id: 'thumbs', name: 'YouTube thumbnails', color: '#28C37B', tiers: [
    { id: 'basic', name: 'Basic', pkr: 1500, includes: '1 thumbnail', rev: 2, days: 1 },
    { id: 'standard', name: 'Standard', pkr: 5000, includes: '4 thumbnails in one consistent style', rev: 3, days: 3 },
    { id: 'premium', name: 'Premium', pkr: 11000, includes: '10 thumbnails, a template for the channel, source files', rev: 4, days: 6 },
  ] },
  { id: 'packaging', name: 'Packaging and labels', color: '#EE1C25', tiers: [
    { id: 'basic', name: 'Basic', pkr: 6000, includes: '1 label or sleeve, flat artwork', rev: 2, days: 3 },
    { id: 'standard', name: 'Standard', pkr: 15000, includes: '1 box or bottle with dieline and mockup', rev: 3, days: 6 },
    { id: 'premium', name: 'Premium', pkr: 35000, includes: '3 variants or a product range, mockups, print-ready files', rev: 4, days: 10 },
  ] },
  { id: 'mockups', name: 'Mockups and branding', color: '#0088FF', tiers: [
    { id: 'basic', name: 'Basic', pkr: 3500, includes: '3 mockup scenes using your design', rev: 1, days: 2 },
    { id: 'standard', name: 'Standard', pkr: 18000, includes: 'Logo, colours, type and 5 mockups', rev: 3, days: 7 },
    { id: 'premium', name: 'Premium', pkr: 40000, includes: 'Brand kit, 12 mockups, usage guide, source files', rev: 5, days: 14 },
  ] },
]

export const CURRENCIES = [
  { code: 'PKR', label: 'PKR, Pakistani rupee' }, { code: 'USD', label: 'USD, US dollar' },
  { code: 'GBP', label: 'GBP, British pound' }, { code: 'EUR', label: 'EUR, euro' },
  { code: 'AED', label: 'AED, UAE dirham' }, { code: 'SAR', label: 'SAR, Saudi riyal' },
  { code: 'CAD', label: 'CAD, Canadian dollar' }, { code: 'AUD', label: 'AUD, Australian dollar' },
]
// units of each currency per 1 USD, used only when the live rates cannot be loaded
export const FALLBACK_PER_USD = { USD: 1, PKR: 280, GBP: 0.79, EUR: 0.92, AED: 3.67, SAR: 3.75, CAD: 1.37, AUD: 1.53 }
