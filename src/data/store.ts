// ============================================================
// BANELLO PLATFORM — Central Data Store
// All transactions, expenses, farmers, products, financial data
// ============================================================

export type Category =
  | 'stock-banana' | 'stock-other' | 'transport-longhaul'
  | 'tricycle-hire' | 'rider-commission' | 'packaging'
  | 'wages' | 'momo-fees' | 'hub-rent' | 'airtime' | 'other';

export type PaymentMethod = 'mtn-momo' | 'airtel-money' | 'cash' | 'bank-transfer' | 'cheque';
export type Channel = 'kampala-premium' | 'kampala-subscription' | 'border-malaba' | 'border-busia' | 'delivery-fee';
export type Grade = 'A' | 'B' | 'C';
export type District = 'Bududa' | 'Manafwa' | 'Sironko' | 'Mbale';
export type TxStatus = 'confirmed' | 'pending' | 'overdue' | 'partial';

export interface Farmer {
  id: string;
  name: string;
  village: string;
  district: District;
  phone: string;
  momoNumber: string;
  momoNetwork: 'MTN' | 'Airtel';
  varieties: string[];
  typicalWeeklyBunches: number;
  gradeAYield: number; // percentage
  reliabilityScore: number; // 0-100
  qualityIncidents: number;
  totalLifetimeBunches: number;
  totalLifetimePaid: number;
  isActive: boolean;
  joinedDate: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface StockBatch {
  id: string;
  batchNumber: string;
  farmerId: string;
  farmerName: string;
  productId: string;
  purchaseDate: string;
  purchasedQty: number;
  gradeAQty: number;
  gradeBQty: number;
  gradeCQty: number;
  remainingQty: number;
  purchasePricePerUnit: number;
  totalPurchaseCost: number;
  transportCost: number;
  handlingCost: number;
  location: 'mbale-hub' | 'kampala-hub' | 'in-transit' | 'border' | 'delivered';
  expiresAt: string;
  status: 'in-stock' | 'allocated' | 'sold' | 'wasted' | 'grading';
  wasteQty: number;
  wasteCost: number;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: Category;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  attachedToBatch?: string;
  attachedToSale?: string;
  supplier?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  orderNumber: string;
  date: string;
  channel: Channel;
  customerName: string;
  customerType: 'office' | 'home' | 'hotel' | 'border-trader' | 'subscription';
  items: { productId: string; productName: string; grade: Grade; qty: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  status: TxStatus;
  linkedBatchId?: string;
  truckReg?: string;
  borderMarket?: string;
  invoiceNumber?: string;
  notes?: string;
}

// ─── FARMERS ────────────────────────────────────────────────
export const farmers: Farmer[] = [
  { id: 'F001', name: 'Moses Wanyama', village: 'Bududa Town', district: 'Bududa', phone: '+256772001001', momoNumber: '256772001001', momoNetwork: 'MTN', varieties: ['Bogoya', 'Nakitembe'], typicalWeeklyBunches: 55, gradeAYield: 78, reliabilityScore: 82, qualityIncidents: 1, totalLifetimeBunches: 330, totalLifetimePaid: 1485000, isActive: true, joinedDate: '2026-01-15' },
  { id: 'F002', name: 'Sarah Nabirye', village: 'Lwakhakha', district: 'Manafwa', phone: '+256701002002', momoNumber: '256701002002', momoNetwork: 'MTN', varieties: ['Bogoya'], typicalWeeklyBunches: 62, gradeAYield: 82, reliabilityScore: 95, qualityIncidents: 0, totalLifetimeBunches: 372, totalLifetimePaid: 1674000, isActive: true, joinedDate: '2026-01-15' },
  { id: 'F003', name: 'John Masaba', village: 'Sironko Hill', district: 'Sironko', phone: '+256782003003', momoNumber: '256782003003', momoNetwork: 'Airtel', varieties: ['Nfuuka', 'Bogoya'], typicalWeeklyBunches: 35, gradeAYield: 65, reliabilityScore: 70, qualityIncidents: 2, totalLifetimeBunches: 210, totalLifetimePaid: 945000, isActive: true, joinedDate: '2026-02-01' },
  { id: 'F004', name: 'Grace Chebet', village: 'Nkooko', district: 'Mbale', phone: '+256703004004', momoNumber: '256703004004', momoNetwork: 'MTN', varieties: ['Bogoya'], typicalWeeklyBunches: 48, gradeAYield: 85, reliabilityScore: 98, qualityIncidents: 0, totalLifetimeBunches: 288, totalLifetimePaid: 1296000, isActive: true, joinedDate: '2026-01-15' },
  { id: 'F005', name: 'Peter Khauka', village: 'Bukalasi', district: 'Bududa', phone: '+256772005005', momoNumber: '256772005005', momoNetwork: 'MTN', varieties: ['Nakitembe'], typicalWeeklyBunches: 40, gradeAYield: 71, reliabilityScore: 85, qualityIncidents: 1, totalLifetimeBunches: 240, totalLifetimePaid: 1080000, isActive: true, joinedDate: '2026-02-01' },
  { id: 'F006', name: 'Rose Nambozo', village: 'Bubulo', district: 'Manafwa', phone: '+256701006006', momoNumber: '256701006006', momoNetwork: 'Airtel', varieties: ['Bogoya', 'Nfuuka'], typicalWeeklyBunches: 28, gradeAYield: 74, reliabilityScore: 88, qualityIncidents: 0, totalLifetimeBunches: 168, totalLifetimePaid: 756000, isActive: true, joinedDate: '2026-02-15' },
  { id: 'F007', name: 'David Wekesa', village: 'Bulegeni', district: 'Sironko', phone: '+256782007007', momoNumber: '256782007007', momoNetwork: 'MTN', varieties: ['Bogoya'], typicalWeeklyBunches: 44, gradeAYield: 79, reliabilityScore: 90, qualityIncidents: 0, totalLifetimeBunches: 176, totalLifetimePaid: 792000, isActive: true, joinedDate: '2026-03-01' },
  { id: 'F008', name: 'Agnes Nabwire', village: 'Lwandeba', district: 'Mbale', phone: '+256703008008', momoNumber: '256703008008', momoNetwork: 'MTN', varieties: ['Bogoya'], typicalWeeklyBunches: 36, gradeAYield: 83, reliabilityScore: 93, qualityIncidents: 0, totalLifetimeBunches: 144, totalLifetimePaid: 648000, isActive: true, joinedDate: '2026-03-01' },
];

// ─── PRODUCTS ────────────────────────────────────────────────
export const products = [
  { id: 'P001', name: 'Bogoya banana — Grade A', category: 'banana', unit: 'bunch', sellPriceKampala: 17000, sellPriceBorder: 12500, shelfLifeHours: 72, reorderThreshold: 30, emoji: '🍌' },
  { id: 'P002', name: 'Bogoya banana — Grade B', category: 'banana', unit: 'bunch', sellPriceKampala: 13000, sellPriceBorder: 10000, shelfLifeHours: 60, reorderThreshold: 15, emoji: '🍌' },
  { id: 'P003', name: 'Nakitembe banana — Grade A', category: 'banana', unit: 'bunch', sellPriceKampala: 15000, sellPriceBorder: 11000, shelfLifeHours: 72, reorderThreshold: 10, emoji: '🍌' },
  { id: 'P004', name: 'Passion fruit', category: 'fruit', unit: 'kg', sellPriceKampala: 12000, sellPriceBorder: 9000, shelfLifeHours: 96, reorderThreshold: 5, emoji: '🌿' },
  { id: 'P005', name: 'Oranges', category: 'fruit', unit: 'kg', sellPriceKampala: 8000, sellPriceBorder: 5500, shelfLifeHours: 120, reorderThreshold: 5, emoji: '🍊' },
  { id: 'P006', name: 'Mangoes', category: 'fruit', unit: 'kg', sellPriceKampala: 10000, sellPriceBorder: 7000, shelfLifeHours: 96, reorderThreshold: 5, emoji: '🥭' },
  { id: 'P007', name: 'Irish potatoes', category: 'vegetable', unit: 'kg', sellPriceKampala: 7000, sellPriceBorder: 5000, shelfLifeHours: 168, reorderThreshold: 10, emoji: '🥔' },
  { id: 'P008', name: 'Tomatoes', category: 'vegetable', unit: 'kg', sellPriceKampala: 6000, sellPriceBorder: 4000, shelfLifeHours: 72, reorderThreshold: 5, emoji: '🍅' },
  { id: 'P009', name: 'Onions', category: 'vegetable', unit: 'kg', sellPriceKampala: 5000, sellPriceBorder: 3500, shelfLifeHours: 336, reorderThreshold: 5, emoji: '🧅' },
];

// ─── STOCK BATCHES ────────────────────────────────────────────
export const stockBatches: StockBatch[] = [
  { id: 'B061', batchNumber: '#061', farmerId: 'F004', farmerName: 'Grace Chebet', productId: 'P001', purchaseDate: '2026-05-17', purchasedQty: 48, gradeAQty: 41, gradeBQty: 5, gradeCQty: 2, remainingQty: 14, purchasePricePerUnit: 4500, totalPurchaseCost: 216000, transportCost: 105600, handlingCost: 14400, location: 'kampala-hub', expiresAt: '2026-05-20', status: 'in-stock', wasteQty: 0, wasteCost: 0 },
  { id: 'B060', batchNumber: '#060', farmerId: 'F002', farmerName: 'Sarah Nabirye', productId: 'P001', purchaseDate: '2026-05-16', purchasedQty: 62, gradeAQty: 51, gradeBQty: 9, gradeCQty: 2, remainingQty: 22, purchasePricePerUnit: 4500, totalPurchaseCost: 279000, transportCost: 136400, handlingCost: 18600, location: 'kampala-hub', expiresAt: '2026-05-19', status: 'in-stock', wasteQty: 1, wasteCost: 4500 },
  { id: 'B059', batchNumber: '#059', farmerId: 'F001', farmerName: 'Moses Wanyama', productId: 'P001', purchaseDate: '2026-05-15', purchasedQty: 55, gradeAQty: 43, gradeBQty: 8, gradeCQty: 4, remainingQty: 0, purchasePricePerUnit: 4500, totalPurchaseCost: 247500, transportCost: 121000, handlingCost: 16500, location: 'border', expiresAt: '2026-05-18', status: 'sold', wasteQty: 2, wasteCost: 9000 },
  { id: 'B058', batchNumber: '#058', farmerId: 'F005', farmerName: 'Peter Khauka', productId: 'P003', purchaseDate: '2026-05-14', purchasedQty: 40, gradeAQty: 28, gradeBQty: 10, gradeCQty: 2, remainingQty: 5, purchasePricePerUnit: 4200, totalPurchaseCost: 168000, transportCost: 88000, handlingCost: 12000, location: 'kampala-hub', expiresAt: '2026-05-17', status: 'in-stock', wasteQty: 1, wasteCost: 4200 },
  { id: 'B057', batchNumber: '#057', farmerId: 'F003', farmerName: 'John Masaba', productId: 'P002', purchaseDate: '2026-05-13', purchasedQty: 35, gradeAQty: 23, gradeBQty: 9, gradeCQty: 3, remainingQty: 0, purchasePricePerUnit: 4000, totalPurchaseCost: 140000, transportCost: 77000, handlingCost: 10500, location: 'delivered', expiresAt: '2026-05-16', status: 'sold', wasteQty: 3, wasteCost: 12000 },
  { id: 'B056', batchNumber: '#056', farmerId: 'F006', farmerName: 'Rose Nambozo', productId: 'P001', purchaseDate: '2026-05-11', purchasedQty: 28, gradeAQty: 22, gradeBQty: 5, gradeCQty: 1, remainingQty: 0, purchasePricePerUnit: 4500, totalPurchaseCost: 126000, transportCost: 61600, handlingCost: 8400, location: 'delivered', expiresAt: '2026-05-14', status: 'sold', wasteQty: 0, wasteCost: 0 },
  { id: 'B055', batchNumber: '#055', farmerId: 'F007', farmerName: 'David Wekesa', productId: 'P001', purchaseDate: '2026-05-10', purchasedQty: 44, gradeAQty: 35, gradeBQty: 7, gradeCQty: 2, remainingQty: 0, purchasePricePerUnit: 4500, totalPurchaseCost: 198000, transportCost: 96800, handlingCost: 13200, location: 'delivered', expiresAt: '2026-05-13', status: 'sold', wasteQty: 1, wasteCost: 4500 },
  { id: 'B054', batchNumber: '#054', farmerId: 'F008', farmerName: 'Agnes Nabwire', productId: 'P001', purchaseDate: '2026-05-08', purchasedQty: 36, gradeAQty: 30, gradeBQty: 5, gradeCQty: 1, remainingQty: 0, purchasePricePerUnit: 4500, totalPurchaseCost: 162000, transportCost: 79200, handlingCost: 10800, location: 'delivered', expiresAt: '2026-05-11', status: 'sold', wasteQty: 0, wasteCost: 0 },
];

// ─── EXPENSES (ALL) ───────────────────────────────────────────
export const expenses: Expense[] = [
  // Week 1 (May 1–7)
  { id: 'E001', date: '2026-05-01', category: 'stock-banana', description: 'Moses Wanyama — Batch #054', amount: 162000, paymentMethod: 'mtn-momo', paymentRef: 'MTN-XK5901', attachedToBatch: 'B054', supplier: 'Moses Wanyama', isRecurring: false, createdAt: '2026-05-01T08:14:00Z' },
  { id: 'E002', date: '2026-05-01', category: 'transport-longhaul', description: 'Shared truck Mbale→Kampala, 36 bunches', amount: 79200, paymentMethod: 'cash', attachedToBatch: 'B054', supplier: 'Driver Owino', isRecurring: false, createdAt: '2026-05-01T06:00:00Z' },
  { id: 'E003', date: '2026-05-02', category: 'rider-commission', description: 'Boda deliveries ×12 — Kampala zone', amount: 48000, paymentMethod: 'mtn-momo', paymentRef: 'MTN-XK5912', isRecurring: false, createdAt: '2026-05-02T11:00:00Z' },
  { id: 'E004', date: '2026-05-03', category: 'packaging', description: 'Branded paper bags ×200', amount: 28000, paymentMethod: 'cash', isRecurring: false, createdAt: '2026-05-03T09:00:00Z' },
  { id: 'E005', date: '2026-05-03', category: 'airtime', description: 'MTN data bundle — field agent + admin', amount: 18000, paymentMethod: 'mtn-momo', isRecurring: true, createdAt: '2026-05-03T10:00:00Z' },
  { id: 'E006', date: '2026-05-05', category: 'tricycle-hire', description: 'Tricycle — 2 days collection runs', amount: 50000, paymentMethod: 'cash', isRecurring: false, createdAt: '2026-05-05T07:00:00Z' },
  // Week 2 (May 8–14)
  { id: 'E007', date: '2026-05-08', category: 'stock-banana', description: 'Agnes Nabwire — Batch #055', amount: 198000, paymentMethod: 'mtn-momo', paymentRef: 'MTN-XK6001', attachedToBatch: 'B055', supplier: 'Agnes Nabwire', isRecurring: false, createdAt: '2026-05-08T08:30:00Z' },
  { id: 'E008', date: '2026-05-08', category: 'transport-longhaul', description: 'Truck Mbale→Kampala, 44 bunches', amount: 96800, paymentMethod: 'cash', attachedToBatch: 'B055', isRecurring: false, createdAt: '2026-05-08T06:00:00Z' },
  { id: 'E009', date: '2026-05-09', category: 'stock-banana', description: 'David Wekesa — Batch #056', amount: 126000, paymentMethod: 'airtel-money', paymentRef: 'AIR-PP3801', attachedToBatch: 'B056', supplier: 'David Wekesa', isRecurring: false, createdAt: '2026-05-09T08:00:00Z' },
  { id: 'E010', date: '2026-05-09', category: 'transport-longhaul', description: 'Truck Mbale→Kampala, 28 bunches', amount: 61600, paymentMethod: 'cash', attachedToBatch: 'B056', isRecurring: false, createdAt: '2026-05-09T06:00:00Z' },
  { id: 'E011', date: '2026-05-10', category: 'rider-commission', description: 'Boda deliveries ×15 — all zones', amount: 60000, paymentMethod: 'mtn-momo', isRecurring: false, createdAt: '2026-05-10T14:00:00Z' },
  { id: 'E012', date: '2026-05-12', category: 'momo-fees', description: 'MTN MoMo transaction fees — week 2', amount: 11200, paymentMethod: 'mtn-momo', isRecurring: true, createdAt: '2026-05-12T09:00:00Z' },
  { id: 'E013', date: '2026-05-13', category: 'tricycle-hire', description: 'Tricycle — 2 days Bududa/Manafwa', amount: 50000, paymentMethod: 'cash', isRecurring: false, createdAt: '2026-05-13T07:00:00Z' },
  { id: 'E014', date: '2026-05-13', category: 'stock-banana', description: 'John Masaba — Batch #057', amount: 140000, paymentMethod: 'mtn-momo', paymentRef: 'MTN-XK6201', attachedToBatch: 'B057', supplier: 'John Masaba', isRecurring: false, createdAt: '2026-05-13T08:00:00Z' },
  { id: 'E015', date: '2026-05-13', category: 'transport-longhaul', description: 'Truck Mbale→Malaba border, 35 bunches', amount: 77000, paymentMethod: 'cash', attachedToBatch: 'B057', isRecurring: false, createdAt: '2026-05-13T06:00:00Z' },
  // Week 3 (May 15–21)
  { id: 'E016', date: '2026-05-14', category: 'stock-banana', description: 'Peter Khauka — Batch #058', amount: 168000, paymentMethod: 'mtn-momo', paymentRef: 'MTN-XK6629', attachedToBatch: 'B058', supplier: 'Peter Khauka', isRecurring: false, createdAt: '2026-05-14T08:30:00Z' },
  { id: 'E017', date: '2026-05-14', category: 'transport-longhaul', description: 'Truck Mbale→Kampala, 40 bunches', amount: 88000, paymentMethod: 'cash', attachedToBatch: 'B058', isRecurring: false, createdAt: '2026-05-14T06:00:00Z' },
  { id: 'E018', date: '2026-05-14', category: 'rider-commission', description: 'Boda deliveries ×11 — Ntinda/Kiwatule', amount: 44000, paymentMethod: 'mtn-momo', isRecurring: false, createdAt: '2026-05-14T16:00:00Z' },
  { id: 'E019', date: '2026-05-15', category: 'stock-banana', description: 'Moses Wanyama — Batch #059', amount: 247500, paymentMethod: 'airtel-money', paymentRef: 'AIR-PP3901', attachedToBatch: 'B059', supplier: 'Moses Wanyama', isRecurring: false, createdAt: '2026-05-15T08:55:00Z' },
  { id: 'E020', date: '2026-05-15', category: 'transport-longhaul', description: 'Truck Mbale→Malaba, 55 bunches', amount: 121000, paymentMethod: 'cash', attachedToBatch: 'B059', isRecurring: false, createdAt: '2026-05-15T06:00:00Z' },
  { id: 'E021', date: '2026-05-15', category: 'tricycle-hire', description: 'Tricycle — 2 days Sironko/Mbale', amount: 50000, paymentMethod: 'cash', isRecurring: false, createdAt: '2026-05-15T07:00:00Z' },
  { id: 'E022', date: '2026-05-16', category: 'stock-banana', description: 'Sarah Nabirye — Batch #060', amount: 279000, paymentMethod: 'mtn-momo', paymentRef: 'MTN-XK6814', attachedToBatch: 'B060', supplier: 'Sarah Nabirye', isRecurring: false, createdAt: '2026-05-16T10:32:00Z' },
  { id: 'E023', date: '2026-05-16', category: 'transport-longhaul', description: 'Truck Mbale→Kampala, 62 bunches', amount: 136400, paymentMethod: 'cash', attachedToBatch: 'B060', isRecurring: false, createdAt: '2026-05-16T06:00:00Z' },
  { id: 'E024', date: '2026-05-16', category: 'rider-commission', description: 'Boda deliveries ×14 — Kololo/Naguru', amount: 56000, paymentMethod: 'mtn-momo', isRecurring: false, createdAt: '2026-05-16T17:00:00Z' },
  { id: 'E025', date: '2026-05-17', category: 'stock-banana', description: 'Grace Chebet — Batch #061', amount: 216000, paymentMethod: 'mtn-momo', paymentRef: 'MTN-XK7291', attachedToBatch: 'B061', supplier: 'Grace Chebet', isRecurring: false, createdAt: '2026-05-17T09:14:00Z' },
  { id: 'E026', date: '2026-05-17', category: 'transport-longhaul', description: 'Truck Mbale→Kampala, 48 bunches', amount: 105600, paymentMethod: 'cash', attachedToBatch: 'B061', isRecurring: false, createdAt: '2026-05-17T06:00:00Z' },
  { id: 'E027', date: '2026-05-17', category: 'rider-commission', description: 'Boda deliveries ×14 — 17 May', amount: 56000, paymentMethod: 'mtn-momo', isRecurring: false, createdAt: '2026-05-17T18:00:00Z' },
  { id: 'E028', date: '2026-05-17', category: 'momo-fees', description: 'MTN MoMo fees — week 3', amount: 11400, paymentMethod: 'mtn-momo', isRecurring: true, createdAt: '2026-05-17T09:00:00Z' },
  { id: 'E029', date: '2026-05-17', category: 'packaging', description: 'Twine, banana leaves, stickers', amount: 14000, paymentMethod: 'cash', isRecurring: false, createdAt: '2026-05-17T10:00:00Z' },
];

// ─── SALES ───────────────────────────────────────────────────
export const sales: Sale[] = [
  { id: 'S001', orderNumber: 'BNL-0241', date: '2026-05-01', channel: 'kampala-premium', customerName: 'Stanbic Bank Offices', customerType: 'office', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 6, unitPrice: 17000, lineTotal: 102000 }], subtotal: 102000, deliveryFee: 5000, totalAmount: 107000, paymentMethod: 'bank-transfer', status: 'confirmed', linkedBatchId: 'B054', invoiceNumber: 'INV-0088' },
  { id: 'S002', orderNumber: 'BNL-0242', date: '2026-05-01', channel: 'kampala-premium', customerName: 'Grace M. — Ntinda home', customerType: 'home', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 2, unitPrice: 17000, lineTotal: 34000 }], subtotal: 34000, deliveryFee: 5000, totalAmount: 39000, paymentMethod: 'mtn-momo', status: 'confirmed', linkedBatchId: 'B054', invoiceNumber: 'INV-0089' },
  { id: 'S003', orderNumber: 'BNL-0243', date: '2026-05-02', channel: 'kampala-premium', customerName: 'UNICEF Kampala', customerType: 'office', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 4, unitPrice: 17000, lineTotal: 68000 }, { productId: 'P004', productName: 'Passion fruit', grade: 'A', qty: 2, unitPrice: 12000, lineTotal: 24000 }], subtotal: 92000, deliveryFee: 0, totalAmount: 92000, paymentMethod: 'bank-transfer', status: 'confirmed', linkedBatchId: 'B054', invoiceNumber: 'INV-0090' },
  { id: 'S004', orderNumber: 'BNL-0244', date: '2026-05-05', channel: 'kampala-premium', customerName: 'Hotel Serena — Kitchen', customerType: 'hotel', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 8, unitPrice: 16000, lineTotal: 128000 }, { productId: 'P008', productName: 'Tomatoes', grade: 'A', qty: 5, unitPrice: 6000, lineTotal: 30000 }], subtotal: 158000, deliveryFee: 0, totalAmount: 158000, paymentMethod: 'bank-transfer', status: 'confirmed', linkedBatchId: 'B055', invoiceNumber: 'INV-0091' },
  { id: 'S005', orderNumber: 'BNL-0245', date: '2026-05-08', channel: 'kampala-premium', customerName: 'MTN Uganda Offices', customerType: 'office', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 5, unitPrice: 17000, lineTotal: 85000 }], subtotal: 85000, deliveryFee: 5000, totalAmount: 90000, paymentMethod: 'mtn-momo', status: 'confirmed', linkedBatchId: 'B055', invoiceNumber: 'INV-0092' },
  { id: 'S006', orderNumber: 'BNL-0246', date: '2026-05-10', channel: 'border-malaba', customerName: 'Trader Kamau — Kenya', customerType: 'border-trader', items: [{ productId: 'P002', productName: 'Bogoya B', grade: 'B', qty: 35, unitPrice: 10000, lineTotal: 350000 }], subtotal: 350000, deliveryFee: 0, totalAmount: 350000, paymentMethod: 'cash', status: 'confirmed', linkedBatchId: 'B056', truckReg: 'UBD 122X', borderMarket: 'Malaba' },
  { id: 'S007', orderNumber: 'BNL-0247', date: '2026-05-10', channel: 'kampala-premium', customerName: 'Acacia Mall Cafe', customerType: 'office', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 4, unitPrice: 17000, lineTotal: 68000 }, { productId: 'P006', productName: 'Mangoes', grade: 'A', qty: 3, unitPrice: 10000, lineTotal: 30000 }], subtotal: 98000, deliveryFee: 5000, totalAmount: 103000, paymentMethod: 'mtn-momo', status: 'confirmed', linkedBatchId: 'B056', invoiceNumber: 'INV-0093' },
  { id: 'S008', orderNumber: 'BNL-0248', date: '2026-05-13', channel: 'border-malaba', customerName: 'Trader Ochieng — Kenya', customerType: 'border-trader', items: [{ productId: 'P002', productName: 'Bogoya B', grade: 'B', qty: 35, unitPrice: 10000, lineTotal: 350000 }], subtotal: 350000, deliveryFee: 0, totalAmount: 350000, paymentMethod: 'cash', status: 'confirmed', linkedBatchId: 'B057', truckReg: 'UAP 443X', borderMarket: 'Malaba' },
  { id: 'S009', orderNumber: 'BNL-0249', date: '2026-05-15', channel: 'kampala-premium', customerName: 'UNICEF Kampala', customerType: 'office', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 4, unitPrice: 17000, lineTotal: 68000 }, { productId: 'P004', productName: 'Passion fruit', grade: 'A', qty: 2, unitPrice: 12000, lineTotal: 24000 }], subtotal: 92000, deliveryFee: 0, totalAmount: 92000, paymentMethod: 'bank-transfer', status: 'confirmed', linkedBatchId: 'B058', invoiceNumber: 'INV-0094' },
  { id: 'S010', orderNumber: 'BNL-0250', date: '2026-05-15', channel: 'kampala-premium', customerName: 'Stanbic Bank Offices', customerType: 'office', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 6, unitPrice: 17000, lineTotal: 102000 }, { productId: 'P008', productName: 'Tomatoes', grade: 'A', qty: 3, unitPrice: 6000, lineTotal: 18000 }], subtotal: 120000, deliveryFee: 0, totalAmount: 120000, paymentMethod: 'bank-transfer', status: 'overdue', linkedBatchId: 'B058', invoiceNumber: 'INV-0095' },
  { id: 'S011', orderNumber: 'BNL-0251', date: '2026-05-16', channel: 'border-malaba', customerName: 'Trader Kamau — Kenya', customerType: 'border-trader', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 55, unitPrice: 11000, lineTotal: 605000 }], subtotal: 605000, deliveryFee: 0, totalAmount: 605000, paymentMethod: 'cash', status: 'confirmed', linkedBatchId: 'B059', truckReg: 'UBJ 420X', borderMarket: 'Malaba' },
  { id: 'S012', orderNumber: 'BNL-0252', date: '2026-05-16', channel: 'kampala-premium', customerName: 'Grace M. — Ntinda home', customerType: 'home', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 2, unitPrice: 17000, lineTotal: 34000 }], subtotal: 34000, deliveryFee: 5000, totalAmount: 39000, paymentMethod: 'mtn-momo', status: 'pending', linkedBatchId: 'B060', invoiceNumber: 'INV-0096' },
  { id: 'S013', orderNumber: 'BNL-0253', date: '2026-05-17', channel: 'kampala-premium', customerName: 'UNICEF Kampala', customerType: 'office', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 4, unitPrice: 17000, lineTotal: 68000 }, { productId: 'P005', productName: 'Oranges', grade: 'A', qty: 3, unitPrice: 8000, lineTotal: 24000 }], subtotal: 92000, deliveryFee: 0, totalAmount: 92000, paymentMethod: 'bank-transfer', status: 'confirmed', linkedBatchId: 'B061', invoiceNumber: 'INV-0097' },
  { id: 'S014', orderNumber: 'BNL-0254', date: '2026-05-17', channel: 'kampala-premium', customerName: 'Centenary Bank HQ', customerType: 'office', items: [{ productId: 'P001', productName: 'Bogoya A', grade: 'A', qty: 5, unitPrice: 17000, lineTotal: 85000 }], subtotal: 85000, deliveryFee: 5000, totalAmount: 90000, paymentMethod: 'mtn-momo', status: 'confirmed', linkedBatchId: 'B061', invoiceNumber: 'INV-0098' },
  { id: 'S015', orderNumber: 'BNL-0255', date: '2026-05-17', channel: 'delivery-fee', customerName: 'Various — delivery fees', customerType: 'home', items: [{ productId: 'delivery', productName: 'Delivery fees ×14', grade: 'A', qty: 14, unitPrice: 5000, lineTotal: 70000 }], subtotal: 70000, deliveryFee: 0, totalAmount: 70000, paymentMethod: 'mtn-momo', status: 'confirmed' },
];

// ─── FINANCIAL SUMMARY ────────────────────────────────────────
export const financialSummary = {
  period: 'May 2026',
  revenue: {
    kampalaDelivery: 3062400,
    borderTrade: 1742400,
    deliveryFees: 475200,
    total: 5280000,
  },
  cogs: {
    stockBanana: 1980000,
    stockOther: 310000,
    total: 2290000,
  },
  grossProfit: 2990000,
  grossMargin: 56.6,
  operatingExpenses: {
    transportLongHaul: 850000,
    riderCommissions: 310000,
    tricycleHire: 200000,
    packaging: 60000,
    momoFees: 42000,
    airtime: 18000,
    wasteWriteOff: 60000,
    other: 40000,
    total: 1580000,
  },
  ebitda: 1410000,
  depreciation: 5000,
  ebit: 1405000,
  profitBeforeTax: 1570000,
  corporateIncomeTax: 471000, // 30% Uganda CIT
  netProfit: 1099000,
  netMargin: 20.8,
  cashBalance: 1620000,
  tradeReceivables: 234000,
  inventory: 391000,
  taxPayable: 471000,
  weeklyData: [
    { week: 'Wk1', revenue: 980000, costs: 680000, profit: 300000 },
    { week: 'Wk2', revenue: 1240000, costs: 820000, profit: 420000 },
    { week: 'Wk3', revenue: 1100000, costs: 760000, profit: 340000 },
    { week: 'Wk4', revenue: 1380000, costs: 900000, profit: 480000 },
    { week: 'Wk5', revenue: 1190000, costs: 810000, profit: 380000 },
    { week: 'Wk6', revenue: 1470000, costs: 970000, profit: 500000 },
    { week: 'Wk7', revenue: 1600000, costs: 1050000, profit: 550000 },
    { week: 'Wk8', revenue: 1280000, costs: 870000, profit: 410000 },
  ],
};

// ─── CATEGORY LABELS ──────────────────────────────────────────
export const categoryLabels: Record<Category, string> = {
  'stock-banana': 'Stock purchase — banana',
  'stock-other': 'Stock purchase — other produce',
  'transport-longhaul': 'Long-haul transport',
  'tricycle-hire': 'Tricycle / pikipiki hire',
  'rider-commission': 'Rider commission',
  'packaging': 'Packaging materials',
  'wages': 'Staff wages',
  'momo-fees': 'MTN / Airtel MoMo fees',
  'hub-rent': 'Hub rent',
  'airtime': 'Airtime and data',
  'other': 'Other operating cost',
};

export const paymentLabels: Record<PaymentMethod, string> = {
  'mtn-momo': 'MTN MoMo',
  'airtel-money': 'Airtel Money',
  'cash': 'Cash',
  'bank-transfer': 'Bank transfer',
  'cheque': 'Cheque',
};
