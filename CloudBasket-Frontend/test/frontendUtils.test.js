import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper utilities replicated from frontend logic for testing
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatINR(amount) {
  const num = Number(amount || 0);
  return `â‚¹${num.toLocaleString('en-IN')}`;
}

function calculateActivePercentage(activeCount, totalCount) {
  if (!totalCount || totalCount <= 0) return '0%';
  return `${Math.round((activeCount / totalCount) * 100)}% Active`;
}

function sanitizeUrl(url) {
  const fallback = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80';
  if (!url) return fallback;
  try {
    if (url.includes('amazonaws.com')) {
      const parsed = new URL(url);
      return `https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com${parsed.pathname}`;
    }
  } catch (e) {}
  return url;
}

function filterOrders(allOrders, filters) {
  const searchTerm = (filters.search || "").trim().toLowerCase();

  return allOrders.filter(order => {
    if (!order) return false;

    const orderId = String(order.id || "").toLowerCase();
    const custName = String(order.customerName || "").toLowerCase();
    const custEmail = String(order.customerEmail || "").toLowerCase();
    const prodName = String(order.productName || "").toLowerCase();

    const matchesSearch = !searchTerm || 
      orderId.includes(searchTerm) ||
      custName.includes(searchTerm) ||
      custEmail.includes(searchTerm) ||
      prodName.includes(searchTerm);

    const filterStatus = (filters.status || "").trim().toLowerCase();
    const orderStatus = String(order.status || "").toLowerCase();
    const matchesStatus = !filterStatus || orderStatus === filterStatus;

    const filterPaymentStatus = (filters.paymentStatus || "").trim().toLowerCase();
    const orderPaymentStatus = String(order.paymentStatus || "").toLowerCase();
    const matchesPaymentStatus = !filterPaymentStatus || orderPaymentStatus === filterPaymentStatus;

    const filterPaymentMethod = (filters.paymentMethod || "").trim().toLowerCase();
    const orderPaymentMethod = String(order.paymentMethod || "").toLowerCase();
    const matchesPaymentMethod = !filterPaymentMethod || 
      orderPaymentMethod === filterPaymentMethod ||
      orderPaymentMethod.replace(/_/g, ' ') === filterPaymentMethod.replace(/_/g, ' ') ||
      filterPaymentMethod.includes(orderPaymentMethod) ||
      orderPaymentMethod.includes(filterPaymentMethod);

    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod;
  });
}

function getLowStockItems(inventories, threshold = 5) {
  if (!Array.isArray(inventories)) return [];
  return inventories.filter(item => {
    const qty = Number(item.availableQuantity ?? item.quantity ?? 0);
    return qty <= threshold;
  });
}

function calculateCartTotals(items, discountPercent = 0, shippingCost = 25) {
  if (!Array.isArray(items)) return { subtotal: 0, discount: 0, shipping: 0, total: 0 };
  
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const discount = (subtotal * discountPercent) / 100;
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const total = taxableSubtotal + (taxableSubtotal > 0 ? shippingCost : 0);

  return { subtotal, discount, shipping: taxableSubtotal > 0 ? shippingCost : 0, total };
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

describe('Frontend Utility Functions Unit Tests', () => {
  test('escapeXml should safely escape HTML/XML reserved characters', () => {
    const input = 'Electronics & Gadgets <"Smart Watch">';
    const expected = 'Electronics &amp; Gadgets &lt;&quot;Smart Watch&quot;&gt;';
    assert.equal(escapeXml(input), expected);
  });

  test('formatINR should format numbers into Indian Rupee format', () => {
    assert.equal(formatINR(1500), 'â‚¹1,500');
    assert.equal(formatINR(100000), 'â‚¹1,00,000');
    assert.equal(formatINR(0), 'â‚¹0');
  });

  test('calculateActivePercentage should compute correct percentage text', () => {
    assert.equal(calculateActivePercentage(18, 20), '90% Active');
    assert.equal(calculateActivePercentage(0, 10), '0% Active');
    assert.equal(calculateActivePercentage(5, 0), '0%');
  });

  test('sanitizeUrl should convert S3 domain URLs to CloudFront domain URLs', () => {
    const s3Url = 'https://cloudbasket-products-images.s3.ap-southeast-1.amazonaws.com/products/24c75566-0044-45ca.webp';
    const expectedCloudFront = 'https://cloudbasket-products-personal-dhari.s3.ap-southeast-1.amazonaws.com/products/24c75566-0044-45ca.webp';
    assert.equal(sanitizeUrl(s3Url), expectedCloudFront);

    const normalUrl = 'https://images.unsplash.com/photo-1511707171634';
    assert.equal(sanitizeUrl(normalUrl), normalUrl);

    assert.ok(sanitizeUrl(null).includes('unsplash.com'));
  });

  test('filterOrders should perform case-insensitive search and status filtering', () => {
    const mockOrders = [
      { id: 'ORD-001', customerName: 'Raveen', customerEmail: 'raveen@example.com', productName: 'VIVO Y56', status: 'Pending', paymentStatus: 'Paid', paymentMethod: 'CREDIT_CARD' },
      { id: 'ORD-002', customerName: 'Dharineesh', customerEmail: 'dharineesh@example.com', productName: 'Laptop Stand', status: 'Delivered', paymentStatus: 'Paid', paymentMethod: 'UPI' }
    ];

    // Search by product name
    const searchResults = filterOrders(mockOrders, { search: 'vivo' });
    assert.equal(searchResults.length, 1);
    assert.equal(searchResults[0].id, 'ORD-001');

    // Case insensitive status match
    const pendingResults = filterOrders(mockOrders, { status: 'PENDING' });
    assert.equal(pendingResults.length, 1);

    // Payment method match (CREDIT_CARD vs Credit Card)
    const creditCardResults = filterOrders(mockOrders, { paymentMethod: 'Credit Card' });
    assert.equal(creditCardResults.length, 1);
    assert.equal(creditCardResults[0].id, 'ORD-001');
  });

  test('getLowStockItems should identify items at or below threshold', () => {
    const inventories = [
      { productId: 'P1', quantity: 2 },
      { productId: 'P2', quantity: 15 },
      { productId: 'P3', availableQuantity: 0 }
    ];

    const lowStock = getLowStockItems(inventories, 5);
    assert.equal(lowStock.length, 2);
    assert.equal(lowStock[0].productId, 'P1');
    assert.equal(lowStock[1].productId, 'P3');
  });

  test('calculateCartTotals should compute subtotal, discount, shipping, and total correctly', () => {
    const cartItems = [
      { price: 1000, quantity: 2 }, // 2000
      { price: 500, quantity: 1 }    // 500
    ];

    // 10% discount on 2500 = 250 discount, 2250 taxable + 25 shipping = 2275 total
    const result = calculateCartTotals(cartItems, 10, 25);
    assert.equal(result.subtotal, 2500);
    assert.equal(result.discount, 250);
    assert.equal(result.shipping, 25);
    assert.equal(result.total, 2275);
  });

  test('validateEmail should validate correct email formats', () => {
    assert.ok(validateEmail('dharineesh@gmail.com'));
    assert.ok(validateEmail('admin.user@cloudbasket.co.in'));
    assert.equal(validateEmail('invalid-email'), false);
    assert.equal(validateEmail(''), false);
    assert.equal(validateEmail(null), false);
  });
});

