/* ═══════════════════════════════════════════════════════════════
   RNVN OFFICIAL — JavaScript v2
   Features: Cart, Product Sliders, Hero Slider, About Slider,
             Testimonials, FAQ, Counter, Reveal, Filter, Forms
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmtPrice = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

function showToast(msg, type = 'default', duration = 2800) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = 'toast'; }, duration);
}

/* ══════════════════════════════════════════════════
   1. LOADER
══════════════════════════════════════════════════ */
const loader = $('#loader');
document.body.style.overflow = 'hidden';
window.addEventListener('load', () => {
  setTimeout(() => {
    if (loader) loader.classList.add('hidden');
    document.body.style.overflow = '';
  }, 2100);
});

/* ══════════════════════════════════════════════════
   2. CUSTOM CURSOR
══════════════════════════════════════════════════ */
const cur = $('#cursor');
const curF = $('#cursor-follower');
if (cur && curF) {
  let mx = 0, my = 0, fx = 0, fy = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px';
    cur.style.top = my + 'px';
  });
  (function loop() {
    fx += (mx - fx) * 0.11;
    fy += (my - fy) * 0.11;
    curF.style.left = fx + 'px';
    curF.style.top = fy + 'px';
    requestAnimationFrame(loop);
  })();
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a,button,[role=button]')) {
      cur.classList.add('big');
      curF.classList.add('big');
    } else {
      cur.classList.remove('big');
      curF.classList.remove('big');
    }
  });
}

/* ══════════════════════════════════════════════════
   3. NAVBAR
══════════════════════════════════════════════════ */
const navbar = $('#navbar');
const hamburger = $('#hamburger');
const navLinksEl = $('#nav-links');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinksEl.classList.toggle('open');
  document.body.style.overflow = navLinksEl.classList.contains('open') ? 'hidden' : '';
});

$$('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinksEl.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// Active nav on scroll
const sections = $$('section[id]');
new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      $$('.nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
      });
    }
  });
}, { threshold: 0.35 }).observe && sections.forEach(s =>
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + s.id));
    }
  }, { threshold: 0.35 }).observe(s)
);

/* ══════════════════════════════════════════════════
   4. SCROLL REVEAL
══════════════════════════════════════════════════ */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

$$('.reveal, .reveal-left, .reveal-right').forEach(el => revObs.observe(el));

/* ══════════════════════════════════════════════════
   5. COUNTER ANIMATION
══════════════════════════════════════════════════ */
new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.target;
    let cur = 0;
    const step = target / (1600 / 16);
    const iv = setInterval(() => {
      cur += step;
      if (cur >= target) { el.textContent = target.toLocaleString('id-ID'); clearInterval(iv); }
      else el.textContent = Math.floor(cur).toLocaleString('id-ID');
    }, 16);
    e.target._obs?.unobserve(e.target);
  });
}, { threshold: 0.5 }).observe && $$('.stat-num[data-target]').forEach(el => {
  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    const target = +el.dataset.target;
    let c = 0;
    const step = target / (1600 / 16);
    const iv = setInterval(() => {
      c += step;
      if (c >= target) { el.textContent = target.toLocaleString('id-ID'); clearInterval(iv); }
      else el.textContent = Math.floor(c).toLocaleString('id-ID');
    }, 16);
    obs.unobserve(el);
  }, { threshold: 0.5 });
  obs.observe(el);
});

/* ══════════════════════════════════════════════════
   6. GENERIC SLIDER FACTORY
   - slides: NodeList of .pslide / .hero-slide / etc
   - dots container: Element
   - dotClass: string
══════════════════════════════════════════════════ */
function createSlider({ slides, dotsEl, dotClass = 'dot', onSlide, auto = 0 }) {
  if (!slides || slides.length === 0) return;
  let current = 0;
  let autoTimer = null;

  // Build dots
  if (dotsEl) {
    dotsEl.innerHTML = '';
    slides.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = dotClass + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => { go(i); resetAuto(); });
      dotsEl.appendChild(d);
    });
  }

  function updateDots() {
    if (!dotsEl) return;
    $$('.' + dotClass, dotsEl).forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function go(idx) {
    slides[current].classList.remove('active');
    current = ((idx % slides.length) + slides.length) % slides.length;
    slides[current].classList.add('active');
    updateDots();
    onSlide && onSlide(current);
  }

  function next() { go(current + 1); }
  function prev() { go(current - 1); }

  function startAuto() {
    if (!auto) return;
    autoTimer = setInterval(next, auto);
  }
  function resetAuto() {
    if (!auto) return;
    clearInterval(autoTimer);
    startAuto();
  }

  // Touch support
  function addTouch(el) {
    if (!el) return;
    let sx = 0;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', e => {
      const diff = sx - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); resetAuto(); }
    }, { passive: true });
  }

  startAuto();
  return { go, next, prev, addTouch, getCurrent: () => current };
}

/* ══════════════════════════════════════════════════
   7. HERO SLIDER
══════════════════════════════════════════════════ */
const heroSlides = $$('.hero-slide', $('#hero-slider') || document);
const hsDots = $('#hs-dots');
const hsCaptions = ['Galaxy Edition', 'Dark Series', 'Premium Line', 'Void Collection', 'Core Collection'];

const heroSlider = createSlider({
  slides: heroSlides,
  dotsEl: hsDots,
  dotClass: 'hs-dot',
  auto: 4500,
  onSlide: (i) => {
    const cap = $('#hs-caption');
    if (cap) cap.textContent = hsCaptions[i] || '';
  }
});

$('#hs-prev')?.addEventListener('click', () => { heroSlider.prev(); });
$('#hs-next')?.addEventListener('click', () => { heroSlider.next(); });
heroSlider.addTouch($('#hero-slider'));

/* ══════════════════════════════════════════════════
   8. ABOUT SLIDER
══════════════════════════════════════════════════ */
const aboutSlides = $$('.about-slide', $('#about-slider') || document);
const asDots = $('#as-dots');

const aboutSlider = createSlider({
  slides: aboutSlides,
  dotsEl: asDots,
  dotClass: 'as-dot',
  auto: 5500
});

$('#as-prev')?.addEventListener('click', () => aboutSlider.prev());
$('#as-next')?.addEventListener('click', () => aboutSlider.next());
aboutSlider.addTouch($('#about-slider'));

/* ══════════════════════════════════════════════════
   9. PRODUCT PHOTO SLIDERS
══════════════════════════════════════════════════ */
$$('.product-card').forEach(card => {
  const slides = $$('.pslide', card);
  if (slides.length <= 1) return;

  const dotsEl = $('.pslide-dots', card);

  const ps = createSlider({
    slides,
    dotsEl,
    dotClass: 'pslide-dot',
  });

  $('.pslide-btn.prev', card)?.addEventListener('click', e => { e.stopPropagation(); ps.prev(); });
  $('.pslide-btn.next', card)?.addEventListener('click', e => { e.stopPropagation(); ps.next(); });
  ps.addTouch($('.pslider', card));
});

/* ══════════════════════════════════════════════════
   10. SIZE SELECTOR
══════════════════════════════════════════════════ */
$$('.size-options').forEach(group => {
  $$('.size-opt', group).forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.size-opt', group).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

/* ══════════════════════════════════════════════════
   11. PRODUCT FILTER
══════════════════════════════════════════════════ */
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    $$('.product-card').forEach((card, i) => {
      const cats = card.dataset.category || '';
      const show = filter === 'all' || cats.includes(filter);
      card.style.transition = `opacity .3s ease ${i * 40}ms, transform .3s ease ${i * 40}ms`;
      if (show) {
        card.style.opacity = '1';
        card.style.transform = '';
        card.style.pointerEvents = '';
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(.94) translateY(8px)';
        card.style.pointerEvents = 'none';
      }
    });
  });
});

/* ══════════════════════════════════════════════════
   12. SHOPPING CART
══════════════════════════════════════════════════ */
let cart = JSON.parse(localStorage.getItem('rnvn_cart') || '[]');

function saveCart() { localStorage.setItem('rnvn_cart', JSON.stringify(cart)); }

function openCart() {
  $('#cart-sidebar').classList.add('open');
  $('#cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCart();
}

function closeCart() {
  $('#cart-sidebar').classList.remove('open');
  $('#cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
window.closeCart = closeCart;

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = $('#cart-badge');
  const badgeI = $('#cart-badge-inline');
  const countLabel = $('#cart-count-label');

  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
  if (badgeI) {
    badgeI.textContent = total;
    badgeI.style.display = total > 0 ? 'flex' : 'none';
  }
  if (countLabel) countLabel.textContent = total + ' item';
}

function renderCart() {
  const empty = $('#cart-empty');
  const itemsEl = $('#cart-items');
  const footer = $('#cart-footer');
  const subtotalEl = $('#cart-subtotal');
  const totalEl = $('#cart-total');

  if (cart.length === 0) {
    empty.style.display = 'flex';
    itemsEl.innerHTML = '';
    if (footer) footer.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  if (footer) footer.style.display = 'flex';

  itemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item" data-idx="${idx}">
      <div class="cart-item-img">
        <img src="${item.img}" alt="${item.name}" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          <span class="cart-item-size">Size: ${item.size}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="dec" data-idx="${idx}">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-idx="${idx}">+</button>
          </div>
          <span class="cart-item-price">${fmtPrice(item.price * item.qty)}</span>
        </div>
      </div>
      <button class="cart-item-remove" data-idx="${idx}" aria-label="Hapus">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');

  // Qty buttons
  $$('.qty-btn', itemsEl).forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.idx;
      if (btn.dataset.action === 'inc') {
        cart[idx].qty++;
      } else {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      }
      saveCart();
      updateCartBadge();
      renderCart();
    });
  });

  // Remove buttons
  $$('.cart-item-remove', itemsEl).forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.idx;
      cart.splice(idx, 1);
      saveCart();
      updateCartBadge();
      renderCart();
      showToast('Item dihapus dari keranjang');
    });
  });

  // Totals
  const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  if (subtotalEl) subtotalEl.textContent = fmtPrice(subtotal);
  if (totalEl) totalEl.textContent = fmtPrice(subtotal);
}

function addToCart(id, name, price, img, size) {
  const existing = cart.find(i => i.id === id && i.size === size);
  if (existing) {
    existing.qty++;
    showToast('✓ Jumlah bertambah — ' + name, 'success');
  } else {
    cart.push({ id, name, price: +price, img, size, qty: 1 });
    showToast('✓ Ditambahkan ke keranjang!', 'success');
  }
  saveCart();
  updateCartBadge();
}

// Cart button events
$('#nav-cart-btn')?.addEventListener('click', () => {
  renderCart();
  openCart();
});
$('#cart-close')?.addEventListener('click', closeCart);
$('#cart-overlay')?.addEventListener('click', closeCart);
$('#open-cart-contact')?.addEventListener('click', () => { renderCart(); openCart(); });

// Add to Cart buttons on product cards
$$('.add-to-cart-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const card = btn.closest('.product-card');
    const activeSizeBtn = card ? $('.size-opt.active', card) : null;
    const size = activeSizeBtn ? activeSizeBtn.dataset.size : 'M';

    addToCart(
      btn.dataset.id,
      btn.dataset.name,
      btn.dataset.price,
      btn.dataset.img,
      size
    );

    // Visual feedback
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg><span>Added!</span>`;
    btn.classList.add('added');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.remove('added');
    }, 1600);
  });
});

// Wishlist toggle
$$('.product-wishlist').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    btn.classList.toggle('active');
    showToast(btn.classList.contains('active') ? '♥ Ditambahkan ke wishlist' : '♡ Dihapus dari wishlist');
  });
});

// Checkout button
$('#checkout-btn')?.addEventListener('click', () => {
  if (cart.length === 0) return;
  const items = cart.map(i => `• ${i.name} (${i.size}) x${i.qty} = ${fmtPrice(i.price * i.qty)}`).join('%0A');
  const total = fmtPrice(cart.reduce((s, i) => s + i.price * i.qty, 0));
  const msg = `Halo RNVN! Saya mau order:%0A%0A${items}%0A%0A*Total: ${total}*%0A%0AMohon konfirmasi ketersediaan dan info pengiriman. Terima kasih!`;
  window.open(`https://wa.me/6208563122123?text=${msg}`, '_blank');
});

// Init badge on load
updateCartBadge();

/* ══════════════════════════════════════════════════
   13. SIZE GUIDE TOGGLE
══════════════════════════════════════════════════ */
const sizeToggle = $('#size-toggle');
const sizeTable = $('#size-table');
sizeToggle?.addEventListener('click', () => {
  const open = sizeTable.style.display !== 'none';
  sizeTable.style.display = open ? 'none' : 'block';
  sizeToggle.textContent = open ? 'Lihat Tabel Ukuran' : 'Tutup Tabel';
});

/* ══════════════════════════════════════════════════
   14. TESTIMONIALS SLIDER
══════════════════════════════════════════════════ */
(() => {
  const sliderEl = $('#testimonials-slider');
  if (!sliderEl) return;
  const cards = $$('.testimonial-card', sliderEl);
  const dotsEl = $('#testi-dots');
  let cur = 0;
  let cpv = getCPV();
  let autoT;

  function getCPV() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function totalSlides() { return Math.ceil(cards.length / cpv); }

  function buildDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < totalSlides(); i++) {
      const d = document.createElement('div');
      d.className = 'testi-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => go(i));
      dotsEl.appendChild(d);
    }
  }

  function updateDots() {
    $$('.testi-dot', dotsEl).forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  function go(idx) {
    cur = ((idx % totalSlides()) + totalSlides()) % totalSlides();
    const cardW = cards[0].offsetWidth + 20;
    sliderEl.style.transform = `translateX(-${cur * cardW * cpv}px)`;
    updateDots();
  }

  function next() { go(cur + 1); }
  function prev() { go(cur - 1); }

  $('#testi-prev')?.addEventListener('click', () => { prev(); resetAuto(); });
  $('#testi-next')?.addEventListener('click', () => { next(); resetAuto(); });

  function startAuto() { autoT = setInterval(next, 5000); }
  function resetAuto() { clearInterval(autoT); startAuto(); }

  // Touch
  let sx = 0;
  sliderEl.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  sliderEl.addEventListener('touchend', e => {
    const d = sx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 40) { d > 0 ? next() : prev(); resetAuto(); }
  }, { passive: true });

  window.addEventListener('resize', () => {
    const n = getCPV();
    if (n !== cpv) { cpv = n; cur = 0; buildDots(); go(0); }
  });

  buildDots();
  startAuto();
})();

/* ══════════════════════════════════════════════════
   15. FAQ ACCORDION
══════════════════════════════════════════════════ */
$$('.faq-item').forEach(item => {
  const q = $('.faq-question', item);
  const a = $('.faq-answer', item);
  q?.addEventListener('click', () => {
    const open = item.classList.contains('active');
    $$('.faq-item').forEach(i => {
      i.classList.remove('active');
      $('.faq-answer', i)?.classList.remove('open');
      $('.faq-question', i)?.setAttribute('aria-expanded', 'false');
    });
    if (!open) {
      item.classList.add('active');
      a?.classList.add('open');
      q.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ══════════════════════════════════════════════════
   16. CONTACT FORM
══════════════════════════════════════════════════ */
const orderForm = $('#order-form');
const formSuccess = $('#form-success');
const submitBtn = $('#submit-btn');

orderForm?.addEventListener('submit', e => {
  e.preventDefault();
  let valid = true;
  $$('[required]', orderForm).forEach(f => {
    if (!f.value.trim()) {
      valid = false;
      f.classList.add('error');
      f.addEventListener('input', () => f.classList.remove('error'), { once: true });
    }
  });
  if (!valid) {
    showToast('Mohon isi semua field yang wajib diisi', 'error');
    return;
  }

  submitBtn.innerHTML = '<span>Mengirim...</span>';
  submitBtn.disabled = true;

  setTimeout(() => {
    const name = $('#name').value;
    const phone = $('#phone').value;
    const product = $('#product').value;
    const size = $('#size').value;
    const qty = $('#qty').value;
    const address = $('#address').value;
    const notes = $('#notes').value;

    orderForm.style.display = 'none';
    formSuccess.style.display = 'flex';

    const msg = `Halo RNVN! Saya ingin order:%0A%0ANama: ${name}%0ATelp: ${phone}%0AProduk: ${product}%0AUkuran: ${size}%0AJumlah: ${qty}%0AAlamat: ${address}%0ACatatan: ${notes || '-'}`;
    setTimeout(() => window.open(`https://wa.me/6208563122123?text=${msg}`, '_blank'), 1200);
  }, 1400);
});

/* ══════════════════════════════════════════════════
   17. NEWSLETTER
══════════════════════════════════════════════════ */
$('#newsletter-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#newsletter-email').value;
  if (email) {
    $('#newsletter-msg').textContent = '✓ Berhasil! Terima kasih 🎉';
    e.target.reset();
    setTimeout(() => { $('#newsletter-msg').textContent = ''; }, 4000);
  }
});

/* ══════════════════════════════════════════════════
   18. SMOOTH ANCHOR SCROLL
══════════════════════════════════════════════════ */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = $(href);
    if (target) {
      e.preventDefault();
      const offset = navbar.offsetHeight + 16;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    }
  });
});

/* ══════════════════════════════════════════════════
   19. BACK TO TOP
══════════════════════════════════════════════════ */
const btt = $('#back-to-top');
window.addEventListener('scroll', () => btt?.classList.toggle('visible', window.scrollY > 400), { passive: true });
btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ══════════════════════════════════════════════════
   20. LOOKBOOK 3D TILT
══════════════════════════════════════════════════ */
$$('.lookbook-item').forEach(item => {
  item.addEventListener('mousemove', e => {
    const r = item.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    item.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.02)`;
  });
  item.addEventListener('mouseleave', () => {
    item.style.transform = '';
    item.style.transition = 'transform .5s ease';
    setTimeout(() => item.style.transition = '', 500);
  });
});

/* ══════════════════════════════════════════════════
   21. HERO PARALLAX
══════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  if (window.scrollY < window.innerHeight) {
    const heroWrap = $('.hero-slider-wrap');
    if (heroWrap) heroWrap.style.transform = `translateY(${window.scrollY * 0.06}px)`;
  }
}, { passive: true });

/* ══════════════════════════════════════════════════
   DEV LOG
══════════════════════════════════════════════════ */
console.log('%cRNVN OFFICIAL 🔥', 'font-size:22px;font-weight:bold;color:#1a3a8f;');
console.log('%cThink Beyond Limits.', 'font-size:13px;color:#9a9a9a;');
console.log('%cCart items:', 'color:#555;', cart);
