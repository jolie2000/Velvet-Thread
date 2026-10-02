const cart = [];

const overlay = document.getElementById('page-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const searchModal = document.getElementById('search-modal');
const accountModal = document.getElementById('account-modal');
const cartCount = document.getElementById('cart-count');
const drawerCount = document.getElementById('drawer-count');
const cartList = document.getElementById('cart-list');
const emptyCart = document.getElementById('empty-cart');
const cartTotal = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-btn');
const checkoutNote = document.getElementById('checkout-note');
const announcement = document.getElementById('cart-announcement');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const noResults = document.getElementById('no-results');
const productCards = [...document.querySelectorAll('.product-card')];

let activePanel = null;
let restoreFocusTo = null;

function setPanel(panel, trigger) {
  if (activePanel) closePanel(false);

  activePanel = panel;
  restoreFocusTo = trigger;
  panel.inert = false;
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('open');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-open-panel');

  const focusTarget = panel === cartDrawer
    ? panel.querySelector('.close-btn')
    : panel.querySelector('input') ?? panel.querySelector('button:not(:disabled)');
  focusTarget?.focus();
}

function closePanel(restoreFocus = true) {
  if (!activePanel) return;

  const panelToClose = activePanel;
  activePanel = null;
  panelToClose.classList.remove('open');
  panelToClose.setAttribute('aria-hidden', 'true');
  panelToClose.inert = true;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('has-open-panel');

  if (restoreFocus) restoreFocusTo?.focus();
  restoreFocusTo = null;
}

function openCart(trigger) {
  setPanel(cartDrawer, trigger);
}

document.getElementById('open-cart').addEventListener('click', (event) => {
  openCart(event.currentTarget);
});

document.getElementById('open-search').addEventListener('click', (event) => {
  setPanel(searchModal, event.currentTarget);
});

document.getElementById('open-account').addEventListener('click', (event) => {
  setPanel(accountModal, event.currentTarget);
});

document.getElementById('close-cart').addEventListener('click', () => closePanel());
document.getElementById('close-search').addEventListener('click', () => closePanel());
document.getElementById('close-account').addEventListener('click', () => closePanel());
overlay.addEventListener('click', () => closePanel());
searchModal.addEventListener('click', (event) => {
  if (event.target === searchModal) closePanel();
});
accountModal.addEventListener('click', (event) => {
  if (event.target === accountModal) closePanel();
});

document.addEventListener('keydown', (event) => {
  if (!activePanel) return;

  if (event.key === 'Escape') {
    closePanel();
    return;
  }

  if (event.key === 'Tab') {
    const focusable = [...activePanel.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]')];
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

function addItemToCart(name, price) {
  cart.push({ name, price });
  updateCartUI();
  announcement.textContent = `${name} added to your bag.`;
  openCart(document.activeElement);
}

function updateCartUI() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartCount.textContent = String(cart.length);
  drawerCount.textContent = String(cart.length);
  cartTotal.textContent = formatPrice(total);
  emptyCart.hidden = cart.length > 0;
  checkoutButton.disabled = cart.length === 0;
  cartList.replaceChildren();

  cart.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const name = document.createElement('p');
    name.className = 'cart-item-name';
    name.textContent = item.name;

    const price = document.createElement('p');
    price.className = 'cart-item-price';
    price.textContent = formatPrice(item.price);

    const remove = document.createElement('button');
    remove.className = 'remove-item';
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${item.name} from your bag`);
    remove.addEventListener('click', () => {
      cart.splice(index, 1);
      updateCartUI();
      announcement.textContent = `${item.name} removed from your bag.`;
    });

    row.append(name, price, remove);
    cartList.append(row);
  });
}

function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

document.querySelectorAll('.quick-add').forEach((button) => {
  button.addEventListener('click', () => {
    addItemToCart(button.dataset.name, Number(button.dataset.price));
  });
});

checkoutButton.addEventListener('click', () => {
  if (cart.length) checkoutNote.textContent = 'Checkout is not connected in this storefront demo.';
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visibleCount = 0;

  productCards.forEach((card) => {
    const searchableText = `${card.dataset.search} ${card.textContent}`.toLocaleLowerCase();
    const matches = !query || searchableText.includes(query);
    card.hidden = !matches;
    if (matches) visibleCount += 1;
  });

  noResults.hidden = visibleCount > 0;
  searchResults.textContent = query ? `${visibleCount} ${visibleCount === 1 ? 'piece' : 'pieces'} found` : '';
});

document.getElementById('account-form').addEventListener('submit', (event) => {
  event.preventDefault();
  document.getElementById('account-status').textContent = 'Account sign-in is not connected in this storefront demo. No details were sent or saved.';
});
