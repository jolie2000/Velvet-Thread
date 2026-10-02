const products = [
  { id: 'alpine-scarf', name: 'The Alpine Ribbed Knit Scarf', price: 120, category: 'scarves', categoryLabel: 'Scarves & wraps', subtitle: '100% organic merino wool', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1000&q=85', alt: 'A soft knit scarf in a warm winter palette', badge: 'Bestseller', newest: false, colors: ['Oatmeal', 'Charcoal', 'Cream'], sizes: ['One size'], colorGroups: ['cream', 'black', 'cream'], description: 'A generously sized ribbed scarf that brings soft structure and lasting warmth to cold days.', materials: '100% traceable organic merino wool. Made with care in small batches.' },
  { id: 'nordic-beanie', name: 'Nordic Cashmere Beanie', price: 85, category: 'beanies', categoryLabel: 'Beanies', subtitle: 'Recycled cashmere blend', image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1000&q=85', alt: 'A soft wool beanie in a natural neutral shade', badge: '', newest: true, colors: ['Stone', 'Rose', 'Forest'], sizes: ['One size'], colorGroups: ['grey', 'brown', 'black'], description: 'A soft, easy-fitting beanie made for everyday warmth, with a clean silhouette and a gentle folded cuff.', materials: 'Recycled cashmere blend selected for softness and durability.' },
  { id: 'plush-mittens', name: 'Plush Fleece Lined Mittens', price: 65, category: 'mittens', categoryLabel: 'Mittens', subtitle: 'Water-resistant wool blend', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=85', alt: 'Winter accessories in muted natural colors', badge: '', newest: false, colors: ['Sand', 'Rust', 'Pine'], sizes: ['S', 'M', 'L'], colorGroups: ['cream', 'brown', 'black'], description: 'Cosy mittens with a plush lining and a weather-ready outer knit for crisp morning walks.', materials: 'Water-resistant wool blend with a soft recycled fleece lining.' },
  { id: 'hearth-wrap', name: 'Hearth Oversized Wrap', price: 160, category: 'wraps', categoryLabel: 'Scarves & wraps', subtitle: 'Ultra-soft alpaca fibre', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1000&q=85', alt: 'A textured oversized wrap in a warm neutral palette', badge: 'New', newest: true, colors: ['Cream', 'Blush', 'Slate'], sizes: ['One size'], colorGroups: ['cream', 'brown', 'grey'], description: 'A generous, versatile wrap with a softly brushed finish. Layer it over a coat or wear it indoors.', materials: 'Soft alpaca fibre from traceable sources.' }
];

const keys = { cart: 'velvet-thread-cart-v1', wishlist: 'velvet-thread-wishlist-v1', orders: 'velvet-thread-orders-v1' };
const readStore = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const writeStore = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep this session usable when storage is blocked. */ }
};

let cart = (Array.isArray(readStore(keys.cart, [])) ? readStore(keys.cart, []) : []).filter((item) => item && products.some((product) => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0);
let wishlist = (Array.isArray(readStore(keys.wishlist, [])) ? readStore(keys.wishlist, []) : []).filter((id) => products.some((product) => product.id === id));
let orders = (Array.isArray(readStore(keys.orders, [])) ? readStore(keys.orders, []) : []).filter((order) => order && typeof order.id === 'string');
let query = '';
let category = 'all';
let activePanel = null;
let restoreFocusTo = null;
let toastTimer;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const overlay = $('#page-overlay');
const drawer = $('#cart-drawer');
const searchModal = $('#search-modal');
const accountModal = $('#account-modal');
const grid = $('#product-grid');
const appView = $('#app-view');
const storefront = $('#storefront-content');
const searchInput = $('#search-input');
const toast = $('#toast');

function money(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function setPanel(panel, trigger) {
  if (activePanel) closePanel(false);
  activePanel = panel;
  restoreFocusTo = trigger || document.activeElement;
  panel.inert = false;
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('open');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-open-panel');
  const focusTarget = panel === drawer ? $('.close-btn', panel) : $('input', panel) || $('.close-btn', panel);
  focusTarget?.focus();
}

function closePanel(restoreFocus = true) {
  if (!activePanel) return;
  const closed = activePanel;
  activePanel = null;
  closed.classList.remove('open');
  closed.setAttribute('aria-hidden', 'true');
  closed.inert = true;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('has-open-panel');
  if (restoreFocus) restoreFocusTo?.focus();
  restoreFocusTo = null;
}

function openCart(trigger) {
  renderCart();
  setPanel(drawer, trigger);
}

function cartSubtotal() {
  return cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $('#cart-count').textContent = count;
  $('#drawer-count').textContent = count;
  $('#cart-total').textContent = money(cartSubtotal());
  $('#empty-cart').hidden = cart.length > 0;
  $('#checkout-btn').disabled = cart.length === 0;
  $('#cart-list').innerHTML = cart.map((item, index) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) return '';
    return `<article class="cart-item">
      <div class="cart-item-main"><p class="cart-item-name">${escapeHTML(product.name)}</p><p class="cart-item-variant">${escapeHTML(item.color)} · ${escapeHTML(item.size)}</p><p class="cart-item-price">${money(product.price)}</p></div>
      <div class="cart-quantity" aria-label="Quantity for ${escapeHTML(product.name)}"><button type="button" data-cart-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-cart-action="increase" data-index="${index}" aria-label="Increase quantity">+</button></div>
      <button class="remove-item" type="button" data-cart-action="remove" data-index="${index}">Remove</button>
    </article>`;
  }).join('');
}

function addToCart(product, color = product.colors[0], size = product.sizes[0], quantity = 1, openDrawer = true) {
  const existing = cart.find((item) => item.id === product.id && item.color === color && item.size === size);
  if (existing) existing.quantity += quantity;
  else cart.push({ id: product.id, color, size, quantity });
  writeStore(keys.cart, cart);
  renderCart();
  showToast(`${product.name} added to your bag ✓`);
  $('#cart-announcement').textContent = `${product.name} added to your bag.`;
  if (openDrawer) openCart(document.activeElement);
}

function isWishlisted(id) { return wishlist.includes(id); }

function toggleWishlist(id) {
  const product = products.find((entry) => entry.id === id);
  if (!product) return;
  if (isWishlisted(id)) wishlist = wishlist.filter((item) => item !== id);
  else wishlist.push(id);
  writeStore(keys.wishlist, wishlist);
  renderProducts();
  renderAccount();
  showToast(isWishlisted(id) ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
}

function productCard(product) {
  const saved = isWishlisted(product.id);
  return `<article class="product-card">
    <div class="product-image-box">
      ${product.badge ? `<span class="badge">${escapeHTML(product.badge)}</span>` : ''}
      <a class="product-open" href="#product/${product.id}" aria-label="View ${escapeHTML(product.name)}"><img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.alt)}" loading="lazy" /></a>
      <button class="wishlist-toggle ${saved ? 'is-saved' : ''}" type="button" data-wishlist="${product.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from' : 'Add to'} wishlist">${saved ? '♥' : '♡'}</button>
      <button class="quick-add" type="button" data-quick-add="${product.id}">Quick add · ${money(product.price)}</button>
    </div>
    <div class="product-details"><a class="product-title-link" href="#product/${product.id}"><h3>${escapeHTML(product.name)}</h3></a><p class="product-subtitle">${escapeHTML(product.subtitle)}</p><p class="product-price">${money(product.price)}</p><div class="swatches" aria-label="Available colors">${product.colors.map((color, index) => `<span class="swatch swatch-tone-${index + 1}" title="${escapeHTML(color)}"></span>`).join('')}</div></div>
  </article>`;
}

function filteredProducts() {
  const categoryValue = $('#category-filter').value;
  const priceValue = $('#price-filter').value;
  const colorValue = $('#color-filter').value;
  const sortValue = $('#sort-products').value;
  let result = products.filter((product) => {
    const haystack = `${product.name} ${product.categoryLabel} ${product.subtitle} ${product.description} ${product.colors.join(' ')}`.toLocaleLowerCase();
    const matchesText = !query || haystack.includes(query);
    const matchesCategory = categoryValue === 'all' || product.category === categoryValue || (categoryValue === 'scarves' && product.category === 'wraps') || (categoryValue === 'gifts' && ['mittens', 'wraps'].includes(product.category));
    const matchesPrice = priceValue === 'all' || (priceValue === 'under-75' && product.price < 75) || (priceValue === '75-125' && product.price >= 75 && product.price <= 125) || (priceValue === 'over-125' && product.price > 125);
    const matchesColor = colorValue === 'all' || product.colorGroups.includes(colorValue);
    return matchesText && matchesCategory && matchesPrice && matchesColor;
  });
  if (sortValue === 'price-low') result.sort((a, b) => a.price - b.price);
  if (sortValue === 'price-high') result.sort((a, b) => b.price - a.price);
  if (sortValue === 'newest') result.sort((a, b) => Number(b.newest) - Number(a.newest));
  return result;
}

function renderProducts() {
  const visible = filteredProducts();
  grid.innerHTML = visible.map(productCard).join('');
  $('#no-results').hidden = visible.length > 0;
  $('#search-results').textContent = query ? `${visible.length} ${visible.length === 1 ? 'piece' : 'pieces'} found` : '';
}

function renderAccount() {
  $('#wishlist-count').textContent = wishlist.length;
  const wishlistProducts = products.filter((product) => wishlist.includes(product.id));
  $('#wishlist-items').innerHTML = wishlistProducts.length
    ? wishlistProducts.map((product) => `<p><a href="#product/${product.id}" data-close-account>${escapeHTML(product.name)}</a> <span>${money(product.price)}</span></p>`).join('')
    : '<p>No saved pieces yet.</p>';
  $('#order-history').innerHTML = orders.length
    ? [...orders].reverse().map((order) => `<p><strong>${escapeHTML(order.id)}</strong><span>${escapeHTML(order.date)} · ${money(order.total)}</span></p>`).join('')
    : '<p>No orders yet.</p>';
}

function renderProductPage(id) {
  const product = products.find((entry) => entry.id === id);
  if (!product) return `<div class="route-message"><h1>Piece not found</h1><a class="btn btn-primary" href="#shop">Return to the collection</a></div>`;
  return `<div class="product-page container">
    <a class="back-link" href="#shop">← Back to the collection</a>
    <div class="product-page-grid">
      <div class="product-gallery"><img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.alt)}" /><div class="gallery-caption">${escapeHTML(product.categoryLabel)} · ${escapeHTML(product.subtitle)}</div></div>
      <div class="product-page-info"><p class="section-kicker">${escapeHTML(product.categoryLabel)}</p><h1>${escapeHTML(product.name)}</h1><p class="detail-price">${money(product.price)}</p><p class="product-description">${escapeHTML(product.description)}</p>
        <label for="detail-color">Color</label><select id="detail-color">${product.colors.map((color) => `<option>${escapeHTML(color)}</option>`).join('')}</select>
        <label for="detail-size">Size</label><select id="detail-size">${product.sizes.map((size) => `<option>${escapeHTML(size)}</option>`).join('')}</select>
        <div class="detail-quantity"><span>Quantity</span><button type="button" data-detail-quantity="-1" aria-label="Decrease quantity">−</button><output id="detail-quantity">1</output><button type="button" data-detail-quantity="1" aria-label="Increase quantity">+</button></div>
        <button type="button" class="btn btn-primary detail-add" data-add-product="${product.id}">Add to bag</button><button type="button" class="btn btn-secondary detail-buy" data-buy-product="${product.id}">Buy now</button>
        <button type="button" class="detail-wishlist ${isWishlisted(product.id) ? 'is-saved' : ''}" data-wishlist="${product.id}" aria-pressed="${isWishlisted(product.id)}">${isWishlisted(product.id) ? '♥ Saved to wishlist' : '♡ Save to wishlist'}</button>
        <details class="product-accordion" open><summary>Description</summary><p>${escapeHTML(product.description)}</p></details>
        <details class="product-accordion"><summary>Materials &amp; care</summary><p>${escapeHTML(product.materials)} Spot clean or follow the care label for best results.</p></details>
        <details class="product-accordion"><summary>Shipping &amp; returns</summary><p>Demo delivery options are shown at checkout. This prototype does not accept or fulfill real orders.</p></details>
        <details class="product-accordion"><summary>Customer notes</summary><p>Product ratings and reviews are not connected in this demo.</p></details>
      </div>
    </div>
  </div>`;
}

function checkoutMarkup() {
  if (!cart.length) return `<div class="route-message"><p class="section-kicker">Your bag is empty</p><h1>Start with something warm.</h1><a class="btn btn-primary" href="#shop">Explore the collection</a></div>`;
  return `<div class="checkout-page container"><a class="back-link" href="#shop">← Continue shopping</a><div class="checkout-heading"><p class="section-kicker">Secure demo checkout</p><h1>Delivery details</h1><p>No payment information is requested. This demo creates a local order confirmation only.</p></div>
    <form id="checkout-form" class="checkout-layout">
      <div class="checkout-fields">
        <fieldset><legend>1. Contact</legend><label>Email<input name="email" type="email" autocomplete="email" required /></label><label>Phone<input name="phone" type="tel" autocomplete="tel" required /></label></fieldset>
        <fieldset><legend>2. Shipping address</legend><div class="field-row"><label>First name<input name="firstName" autocomplete="given-name" required /></label><label>Last name<input name="lastName" autocomplete="family-name" required /></label></div><label>Street address<input name="address" autocomplete="street-address" required /></label><div class="field-row"><label>City<input name="city" autocomplete="address-level2" required /></label><label>Postal code<input name="postal" autocomplete="postal-code" required /></label></div><label>Country<select name="country" autocomplete="country-name" required><option value="">Choose a country</option><option>Uganda</option><option>Kenya</option><option>United States</option><option>United Kingdom</option><option>Canada</option></select></label></fieldset>
        <fieldset><legend>3. Delivery</legend><label class="radio-option"><input type="radio" name="delivery" value="standard" checked /> Standard · $8.00 <span>Arrives in 5–8 business days</span></label><label class="radio-option"><input type="radio" name="delivery" value="express" /> Express · $18.00 <span>Arrives in 2–3 business days · complimentary over $100</span></label></fieldset>
        <fieldset><legend>4. Payment</legend><p class="payment-demo">Demo payment only. No card details are collected and no transaction will be made.</p><label class="radio-option"><input type="radio" checked disabled /> Test payment · no charge</label></fieldset>
        <button class="btn btn-primary place-order" type="submit">Place demo order</button>
      </div>
      <aside class="order-summary"><h2>Order summary</h2><div id="checkout-items"></div><p class="summary-line"><span>Subtotal</span><span id="checkout-subtotal"></span></p><p class="summary-line"><span>Delivery</span><span id="checkout-shipping"></span></p><p class="summary-line summary-total"><span>Total</span><span id="checkout-total"></span></p></aside>
    </form>
  </div>`;
}

function renderOrderPage(id) {
  const order = orders.find((entry) => entry.id === id);
  if (!order) return `<div class="route-message"><h1>Order not found</h1><a class="btn btn-primary" href="#shop">Return to the collection</a></div>`;
  return `<div class="order-confirmation container"><span class="confirmation-mark" aria-hidden="true">✓</span><p class="section-kicker">Demo order confirmed</p><h1>Thank you for your order.</h1><p>Your demo order <strong>${escapeHTML(order.id)}</strong> is saved in this browser. No payment was made and no order was sent to a store.</p><div class="confirmation-summary"><h2>Order summary</h2>${order.items.map((item) => `<p>${escapeHTML(item.name)} · ${item.quantity} <span>${money(item.price * item.quantity)}</span></p>`).join('')}<p class="summary-total"><strong>Total</strong><strong>${money(order.total)}</strong></p></div><a class="btn btn-primary" href="#shop">Continue shopping</a></div>`;
}

function renderRoute() {
  const route = location.hash.replace(/^#/, '');
  const productMatch = route.match(/^product\/([a-z0-9-]+)$/);
  if (!productMatch && route !== 'checkout' && !route.startsWith('order/')) {
    storefront.hidden = false;
    appView.hidden = true;
    if (route === 'shop') {
      category = 'all';
      query = '';
      searchInput.value = '';
      $('#category-filter').value = 'all';
      $('#price-filter').value = 'all';
      $('#color-filter').value = 'all';
      $('#sort-products').value = 'featured';
      renderProducts();
    }
    return;
  }
  storefront.hidden = true;
  appView.hidden = false;
  if (productMatch) appView.innerHTML = renderProductPage(productMatch[1]);
  else if (route === 'checkout') {
    appView.innerHTML = checkoutMarkup();
    renderCheckoutTotals();
  } else appView.innerHTML = renderOrderPage(route.slice(6));
  const routeHeading = $('h1', appView);
  if (routeHeading) {
    routeHeading.tabIndex = -1;
    routeHeading.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCheckoutTotals() {
  if (!$('#checkout-form')) return;
  $('#checkout-items').innerHTML = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return product ? `<p>${escapeHTML(product.name)} · ${item.quantity}<span>${money(product.price * item.quantity)}</span></p>` : '';
  }).join('');
  const subtotal = cartSubtotal();
  const delivery = $('input[name="delivery"]:checked')?.value || 'standard';
    const shipping = delivery === 'express' ? (subtotal > 100 ? 0 : 18) : 8;
  $('#checkout-subtotal').textContent = money(subtotal);
  $('#checkout-shipping').textContent = shipping === 0 ? 'Complimentary' : money(shipping);
  $('#checkout-total').textContent = money(subtotal + shipping);
}

function openAccount(trigger) {
  renderAccount();
  setPanel(accountModal, trigger);
}

$('#open-cart').addEventListener('click', (event) => openCart(event.currentTarget));
$('#open-search').addEventListener('click', (event) => setPanel(searchModal, event.currentTarget));
$('#open-account').addEventListener('click', (event) => openAccount(event.currentTarget));
$('#open-wishlist').addEventListener('click', (event) => openAccount(event.currentTarget));
$('#close-cart').addEventListener('click', () => closePanel());
$('#close-search').addEventListener('click', () => closePanel());
$('#close-account').addEventListener('click', () => closePanel());
overlay.addEventListener('click', () => closePanel());
searchModal.addEventListener('click', (event) => { if (event.target === searchModal) closePanel(); });
accountModal.addEventListener('click', (event) => { if (event.target === accountModal) closePanel(); });

document.addEventListener('keydown', (event) => {
  if (!activePanel) return;
  if (event.key === 'Escape') closePanel();
  if (event.key === 'Tab') {
    const focusable = $$('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]', activePanel);
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  }
});

$('#mobile-menu-toggle').addEventListener('click', (event) => {
  const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!expanded));
  $('#main-navigation').classList.toggle('mobile-open', !expanded);
});

$('#main-navigation').addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = link.getAttribute('href').slice(1);
  if (target === 'shop') {
    storefront.hidden = false;
    appView.hidden = true;
    query = '';
    searchInput.value = '';
    $('#category-filter').value = 'all';
    $('#price-filter').value = 'all';
    $('#color-filter').value = 'all';
    $('#sort-products').value = 'featured';
    renderProducts();
    event.preventDefault();
    history.replaceState(null, '', '#shop');
    $('#shop').scrollIntoView({ behavior: 'smooth' });
  } else if (['scarves', 'beanies', 'gifts'].includes(target)) {
    storefront.hidden = false;
    appView.hidden = true;
    category = target;
    $('#category-filter').value = target;
    renderProducts();
    event.preventDefault();
    history.replaceState(null, '', '#shop');
    $('#shop').scrollIntoView({ behavior: 'smooth' });
  }
  $('#main-navigation').classList.remove('mobile-open');
  $('#mobile-menu-toggle').setAttribute('aria-expanded', 'false');
});

$('#product-grid').addEventListener('click', (event) => {
  const quickAdd = event.target.closest('[data-quick-add]');
  const wishlistButton = event.target.closest('[data-wishlist]');
  if (quickAdd) {
    const product = products.find((entry) => entry.id === quickAdd.dataset.quickAdd);
    if (product) addToCart(product);
  } else if (wishlistButton) toggleWishlist(wishlistButton.dataset.wishlist);
});

$('#app-view').addEventListener('click', (event) => {
  const wishlistButton = event.target.closest('[data-wishlist]');
  const detailQuantity = event.target.closest('[data-detail-quantity]');
  const cartAction = event.target.closest('[data-cart-action]');
  const addButton = event.target.closest('[data-add-product]');
  const buyButton = event.target.closest('[data-buy-product]');
  if (wishlistButton) toggleWishlist(wishlistButton.dataset.wishlist);
  if (detailQuantity) {
    const output = $('#detail-quantity');
    output.value = Math.max(1, Math.min(10, Number(output.value || output.textContent) + Number(detailQuantity.dataset.detailQuantity)));
    output.textContent = output.value;
  }
  if (cartAction) {
    const index = Number(cartAction.dataset.index);
    const item = cart[index];
    if (!item) return;
    if (cartAction.dataset.cartAction === 'increase') item.quantity = Math.min(10, item.quantity + 1);
    if (cartAction.dataset.cartAction === 'decrease') item.quantity -= 1;
    if (cartAction.dataset.cartAction === 'remove' || item.quantity < 1) cart.splice(index, 1);
    writeStore(keys.cart, cart);
    renderCart();
  }
  if (addButton || buyButton) {
    const button = addButton || buyButton;
    const product = products.find((entry) => entry.id === button.dataset.addProduct || entry.id === button.dataset.buyProduct);
    if (!product) return;
    const quantity = Number($('#detail-quantity').value || $('#detail-quantity').textContent || 1);
    addToCart(product, $('#detail-color').value, $('#detail-size').value, quantity, !buyButton);
    if (buyButton) location.hash = '#checkout';
  }
});

$('#cart-list').addEventListener('click', (event) => {
  const action = event.target.closest('[data-cart-action]');
  if (!action) return;
  const index = Number(action.dataset.index);
  const item = cart[index];
  if (!item) return;
  if (action.dataset.cartAction === 'increase') item.quantity = Math.min(10, item.quantity + 1);
  if (action.dataset.cartAction === 'decrease') item.quantity -= 1;
  if (action.dataset.cartAction === 'remove' || item.quantity < 1) cart.splice(index, 1);
  writeStore(keys.cart, cart);
  renderCart();
});

$('#checkout-btn').addEventListener('click', () => {
  closePanel(false);
  location.hash = '#checkout';
});

$('#view-search-results').addEventListener('click', () => {
  closePanel();
  storefront.hidden = false;
  appView.hidden = true;
  history.replaceState(null, '', '#shop');
  $('#shop').scrollIntoView({ behavior: 'smooth' });
});

searchInput.addEventListener('input', () => {
  query = searchInput.value.trim().toLocaleLowerCase();
  renderProducts();
});

$('#category-filter').addEventListener('change', renderProducts);
$('#price-filter').addEventListener('change', renderProducts);
$('#color-filter').addEventListener('change', renderProducts);
$('#sort-products').addEventListener('change', renderProducts);
$('#clear-filters').addEventListener('click', () => {
  query = '';
  searchInput.value = '';
  $('#category-filter').value = 'all';
  $('#price-filter').value = 'all';
  $('#color-filter').value = 'all';
  $('#sort-products').value = 'featured';
  renderProducts();
});

$('#app-view').addEventListener('change', (event) => {
  if (event.target.name === 'delivery') renderCheckoutTotals();
});

$('#app-view').addEventListener('submit', (event) => {
  if (event.target.id !== 'checkout-form') return;
  event.preventDefault();
  if (!event.target.reportValidity() || !cart.length) return;
  const data = new FormData(event.target);
  const subtotal = cartSubtotal();
  const shipping = data.get('delivery') === 'express' ? (subtotal > 100 ? 0 : 18) : 8;
  const order = {
    id: `VT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date()),
    items: cart.map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return { name: product.name, price: product.price, quantity: item.quantity };
    }),
    subtotal,
    shipping,
    total: subtotal + shipping
  };
  orders.push(order);
  writeStore(keys.orders, orders);
  cart = [];
  writeStore(keys.cart, cart);
  renderCart();
  renderAccount();
  location.hash = `#order/${order.id}`;
});

$('#contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  $('#contact-status').textContent = 'Thanks for the note. This demo does not send or save messages.';
  event.target.reset();
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-account]')) closePanel(false);
});

window.addEventListener('hashchange', renderRoute);
$('#category-filter').value = 'all';
renderProducts();
renderCart();
renderAccount();
renderRoute();
