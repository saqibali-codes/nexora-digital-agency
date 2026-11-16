/* ═══════════════════════════════════════════════════════════════
   NEXORA — app.js
   All interactive behaviour: dashboard, estimator, pricing,
   case studies, capabilities, booking modal, FAQ, etc.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Global State ────────────────────────────────────────────────
const STATE = {
  currency: 'USD',
  pricingMode: 'one-time',  // 'one-time' | 'retainer'
  projectType: 'business',
  addons: new Set(),
  timeframe: 30,
  caseFilter: 'all',
};

const PKR_RATE = 279;   // 1 USD = 279 PKR

// ── Utilities ───────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmt(usd) {
  if (STATE.currency === 'PKR') {
    const pkr = Math.round(usd * PKR_RATE);
    return 'PKR ' + pkr.toLocaleString('en-PK');
  }
  return '$' + usd.toLocaleString('en-US');
}

function fmtSmall(usd) {
  if (STATE.currency === 'PKR') {
    const pkr = Math.round(usd * PKR_RATE);
    if (pkr >= 1_000_000) return 'PKR ' + (pkr / 1_000_000).toFixed(1) + 'M';
    return 'PKR ' + (pkr / 1_000).toFixed(0) + 'K';
  }
  if (usd >= 1_000) return '$' + (usd / 1_000).toFixed(0) + 'K';
  return '$' + usd;
}

function fmtPkr(usd) {
  const pkr = Math.round(usd * PKR_RATE);
  return '≈ PKR ' + pkr.toLocaleString('en-PK');
}

function animateValue(el, target, suffix = '') {
  if (!el) return;
  el.classList.add('animating');
  setTimeout(() => el.classList.remove('animating'), 400);
}

// ── 1. Scroll Reveal ────────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  $$('.reveal').forEach(el => observer.observe(el));
}

// ── 2. Navbar ───────────────────────────────────────────────────
function initNavbar() {
  const navbar = $('#navbar');
  const mobileBtn = $('#mobileMenuBtn');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  mobileBtn.addEventListener('click', () => {
    const open = navbar.classList.toggle('menu-open');
    mobileBtn.setAttribute('aria-expanded', open);
  });

  // Smooth scroll
  $$('.smooth-scroll').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = $(a.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        navbar.classList.remove('menu-open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

// ── 3. Currency Switcher ─────────────────────────────────────────
function initCurrencySwitcher() {
  $$('.cur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.cur-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      STATE.currency = btn.dataset.cur;
      updateEstimator();
      updatePricingCards();
      updateDashboardMetrics();
      updateAddonPriceLabels();
    });
  });
}

// ── 4. Hero Dashboard ───────────────────────────────────────────
const DASHBOARD_DATA = {
  30: {
    conversion: '+184%',
    speed: '99/100',
    revenue: 47000,
    projects: 127,
    bars: [28, 34, 39, 42, 50, 54, 61, 55, 63, 70, 75, 80],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
  90: {
    conversion: '+231%',
    speed: '99/100',
    revenue: 139000,
    projects: 127,
    bars: [45, 52, 58, 61, 72, 78, 82, 86, 90, 95, 97, 102],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
  365: {
    conversion: '+310%',
    speed: '99/100',
    revenue: 621000,
    projects: 127,
    bars: [22, 30, 36, 44, 51, 60, 68, 76, 82, 88, 96, 108],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
};

function buildBarChart(data) {
  const svg = $('#barChart');
  const group = $('#barsGroup');
  if (!group) return;

  const bars = data.bars;
  const maxVal = Math.max(...bars);
  const chartH = 74;   // usable height (from y=8 to y=74+8=82)
  const startX = 24;
  const totalW = 296;
  const barW = Math.floor((totalW / bars.length) * 0.65);
  const gap = totalW / bars.length;

  // Remove old bars
  group.innerHTML = '';

  bars.forEach((val, i) => {
    const pct = val / maxVal;
    const barH = Math.max(4, pct * chartH);
    const x = startX + i * gap;
    const y = 82 - barH;

    // Bar rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barW);
    rect.setAttribute('height', barH);
    rect.setAttribute('rx', '2');
    rect.setAttribute('fill', i === bars.length - 1 ? 'url(#barGradHigh)' : 'url(#barGrad)');
    rect.setAttribute('opacity', '0');

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x + barW / 2);
    text.setAttribute('y', 90);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'JetBrains Mono');
    text.setAttribute('font-size', '7');
    text.setAttribute('fill', '#94A3B8');
    text.textContent = data.months[i].slice(0, 1);

    group.appendChild(rect);
    group.appendChild(text);

    // Animate bars in
    setTimeout(() => {
      rect.setAttribute('opacity', '1');
      rect.style.transition = 'height 0.6s cubic-bezier(0.4,0,0.2,1)';
    }, i * 50);
  });

  // Sparkline
  const spark = $('#sparkLine');
  if (spark) {
    const pts = bars.map((val, i) => {
      const pct = val / maxVal;
      const barH = Math.max(4, pct * chartH);
      const x = startX + i * gap + barW / 2;
      const y = 82 - barH;
      return `${x},${y}`;
    }).join(' ');
    spark.setAttribute('points', pts);
  }
}

function updateDashboardMetrics() {
  const data = DASHBOARD_DATA[STATE.timeframe];
  const convEl = $('#metricConversion');
  const speedEl = $('#metricSpeed');
  const revEl = $('#metricRevenue');

  if (convEl) { animateValue(convEl); convEl.textContent = data.conversion; }
  if (speedEl) { animateValue(speedEl); speedEl.textContent = data.speed; }
  if (revEl) {
    animateValue(revEl);
    revEl.textContent = STATE.currency === 'PKR'
      ? fmtSmall(data.revenue)
      : '$' + (data.revenue >= 1000 ? (data.revenue/1000).toFixed(0) + 'K' : data.revenue);
  }
  buildBarChart(data);
}

function initDashboard() {
  updateDashboardMetrics();

  $$('.tf-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.tf-pill').forEach(p => { p.classList.remove('active'); p.setAttribute('aria-pressed', 'false'); });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
      STATE.timeframe = Number(pill.dataset.tf);
      updateDashboardMetrics();
    });
  });
}

// ── 5. Capabilities Tabs ─────────────────────────────────────────
const CAPABILITY_PREVIEWS = {
  platforms: `
    <div class="mp-scaler">
      <div class="mp-inner-cap">
        <div class="mp-nav">
          <div class="mp-nav-logo">
            <div class="mp-nav-logo-icon">▲</div>
            TechCorp Pro
          </div>
          <div class="mp-nav-links">
            <span class="mp-nav-link">Overview</span>
            <span class="mp-nav-link">Solutions</span>
            <span class="mp-nav-link">Pricing</span>
            <span class="mp-nav-cta">Get Started</span>
          </div>
        </div>
        <div class="mp-hero">
          <div class="mp-eyebrow-badge"><span class="mp-eyebrow-dot"></span>+184% Pipeline Lift ↑</div>
          <div class="mp-h1">Scale Enterprise<br>Operations Faster</div>
          <div class="mp-h2">Automate workflows, unify data, and accelerate growth across your entire enterprise ecosystem with zero-friction deployment.</div>
          <div class="mp-cta-row">
            <span class="mp-btn-primary">Request Demo</span>
            <span class="mp-btn-ghost">View Pricing →</span>
          </div>
        </div>
        <div class="mp-features">
          <div class="mp-feat-card">
            <div class="mp-feat-icon-wrap" style="background:#EFF6FF;">⚡</div>
            <div class="mp-feat-title">Fast Deploy</div>
            <div class="mp-feat-desc">Ship to production in days, not months with managed infra</div>
          </div>
          <div class="mp-feat-card">
            <div class="mp-feat-icon-wrap" style="background:#ECFDF5;">🔒</div>
            <div class="mp-feat-title">Enterprise Security</div>
            <div class="mp-feat-desc">SOC 2 Type II &amp; ISO 27001 certified. SSO ready</div>
          </div>
          <div class="mp-feat-card">
            <div class="mp-feat-icon-wrap" style="background:#EDE9FE;">📈</div>
            <div class="mp-feat-title">Advanced Analytics</div>
            <div class="mp-feat-desc">Real-time dashboards and predictive insights built-in</div>
          </div>
        </div>
      </div>
    </div>`,
  ecomm: `
    <div class="mp-scaler">
      <div class="mp-inner-cap">
        <div class="mp-ecomm-layout">
          <div class="mp-product-side">
            <div class="mp-product-img-wrap">
              <svg viewBox="0 0 200 140" width="200" height="140" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="140" fill="#EFF6FF" rx="10"/>
                <ellipse cx="100" cy="72" rx="42" ry="28" fill="none" stroke="#2563EB" stroke-width="10" stroke-linecap="round"/>
                <rect x="56" y="52" width="16" height="30" rx="8" fill="#1D4ED8"/>
                <rect x="128" y="52" width="16" height="30" rx="8" fill="#1D4ED8"/>
                <path d="M57 55 C57 24 143 24 143 55" fill="none" stroke="#93C5FD" stroke-width="8" stroke-linecap="round"/>
                <circle cx="100" cy="72" r="8" fill="#BFDBFE"/>
                <circle cx="100" cy="72" r="3" fill="#2563EB"/>
              </svg>
            </div>
            <div class="mp-product-brand">STUDIO PRO · ANC Series</div>
            <div class="mp-product-name">Studio ANC Headphones</div>
            <div class="mp-product-price">$249</div>
            <div class="mp-color-dots">
              <span class="mp-color-dot selected" style="background:#1E293B;"></span>
              <span class="mp-color-dot" style="background:#2563EB;"></span>
              <span class="mp-color-dot" style="background:#E2E8F0;border:1.5px solid #CBD5E1;"></span>
            </div>
            <span class="mp-btn-primary" style="display:block;text-align:center;margin-top:6px;">Add to Bag →</span>
          </div>
          <div class="mp-checkout-side">
            <div class="mp-checkout-title">Order Summary</div>
            <div class="mp-checkout-line"><span>Studio ANC Headphones</span><span style="font-weight:800;">$249</span></div>
            <div class="mp-checkout-line"><span>Colour: Midnight Black</span><span>×1</span></div>
            <div class="mp-checkout-line"><span>Express Shipping</span><span style="color:#059669;font-weight:700;">Free</span></div>
            <div class="mp-checkout-line total"><span>Total</span><span>$249.00</span></div>
            <div class="mp-payment-badges">
              <span class="mp-pay-badge stripe">Stripe</span>
              <span class="mp-pay-badge">JazzCash</span>
              <span class="mp-pay-badge">COD</span>
            </div>
            <div class="mp-confirmed">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Order Confirmed ✓
            </div>
          </div>
        </div>
      </div>
    </div>`,
  design: `
    <div class="mp-scaler">
      <div class="mp-inner-cap">
        <div class="mp-ds-layout">
          <div class="mp-ds-header">
            <div class="mp-ds-title">Design System — Nexora DS</div>
            <div class="mp-ds-version">v2.1.0 · Figma + Code</div>
          </div>
          <div>
            <div class="mp-ds-section-label">Color Tokens</div>
            <div class="mp-color-tokens">
              <div class="mp-color-token">
                <div class="mp-token-swatch" style="background:#2563EB;"></div>
                <div><div class="mp-token-name">Primary</div><div class="mp-token-hex">#2563EB</div></div>
              </div>
              <div class="mp-color-token">
                <div class="mp-token-swatch" style="background:#059669;"></div>
                <div><div class="mp-token-name">Success</div><div class="mp-token-hex">#059669</div></div>
              </div>
              <div class="mp-color-token">
                <div class="mp-token-swatch" style="background:#0B0F19;"></div>
                <div><div class="mp-token-name">Ink</div><div class="mp-token-hex">#0B0F19</div></div>
              </div>
            </div>
          </div>
          <div>
            <div class="mp-ds-section-label">Typography Scale</div>
            <div class="mp-type-scale">
              <div class="mp-type-item">
                <span class="mp-type-aa" style="font-size:34px;">Aa</span>
                <div><div class="mp-token-name">Heading · 800</div><div class="mp-token-hex">32px · −0.04em tracking</div></div>
              </div>
              <div class="mp-type-item">
                <span class="mp-type-aa" style="font-size:22px;font-weight:400;">Aa</span>
                <div><div class="mp-token-name">Body · 400</div><div class="mp-token-hex">16px · 1.65 line-height</div></div>
              </div>
            </div>
          </div>
          <div>
            <div class="mp-ds-section-label">Button States</div>
            <div class="mp-btn-states">
              <span class="mp-btn-primary">Primary</span>
              <span class="mp-btn-ghost">Secondary</span>
              <span style="font-size:14px;font-weight:600;color:#2563EB;text-decoration:underline;cursor:pointer;">Ghost Link</span>
            </div>
          </div>
          <div>
            <div class="mp-ds-section-label">Components</div>
            <div class="mp-toggle-switches">
              <div class="mp-toggle on"></div>
              <div class="mp-toggle"></div>
              <div class="mp-input-box">Search components...</div>
              <div class="mp-badge-blue">Beta</div>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  apps: `
    <div class="mp-scaler">
      <div class="mp-inner-cap">
        <div class="mp-saas-layout">
          <div class="mp-saas-sidebar">
            <div class="mp-saas-logo">
              <div class="mp-saas-logo-dot">⚡</div>
              NexusOS
            </div>
            <div class="mp-saas-nav-item active">
              <span>📊</span> Dashboard
            </div>
            <div class="mp-saas-nav-item">
              <span>📈</span> Analytics
            </div>
            <div class="mp-saas-nav-item">
              <span>👥</span> Customers
            </div>
            <div class="mp-saas-nav-item">
              <span>💳</span> Billing
            </div>
          </div>
          <div class="mp-saas-main">
            <div class="mp-saas-topbar">
              <div class="mp-saas-page-title">Operational Overview</div>
              <div style="display:flex;gap:8px;">
                <span class="mp-btn-sm-ghost">Export</span>
                <span class="mp-btn-sm">+ New Action</span>
              </div>
            </div>
            <div class="mp-kpi-pills">
              <div class="mp-kpi-pill">
                <span class="mp-kpi-val">$48.2K MRR</span>
                <span class="mp-kpi-label">Monthly Recurring Revenue</span>
              </div>
              <div class="mp-kpi-pill">
                <span class="mp-kpi-val">1,420 Active Users</span>
                <span class="mp-kpi-label">Platform Engagement</span>
              </div>
              <div class="mp-kpi-pill green">
                <span class="mp-kpi-val">99.98%</span>
                <span class="mp-kpi-label">System SLA</span>
              </div>
            </div>
            <div class="mp-mini-table">
              <div class="mp-table-header">
                <span>Customer / Account</span>
                <span>Plan</span>
                <span>Status</span>
              </div>
              <div class="mp-table-row">
                <span>Apex Global Tech</span>
                <span>Enterprise</span>
                <div><span class="mp-status-pill active">Active</span></div>
              </div>
              <div class="mp-table-row">
                <span>Vanguard Logistics</span>
                <span>Growth Tier</span>
                <div><span class="mp-status-pill paid">Paid</span></div>
              </div>
              <div class="mp-table-row">
                <span>Horizon Media UK</span>
                <span>Scale Plan</span>
                <div><span class="mp-status-pill active">Active</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`
};

function initCapabilities() {
  // Ensure all 4 preview panels are injected with high-definition code components
  const panelMap = {
    platforms: '#tab-platforms .browser-body',
    ecomm: '#tab-ecomm .browser-body',
    design: '#tab-design .browser-body',
    apps: '#tab-apps .browser-body'
  };

  Object.entries(panelMap).forEach(([key, selector]) => {
    const el = $(selector);
    if (el && CAPABILITY_PREVIEWS[key]) {
      el.innerHTML = CAPABILITY_PREVIEWS[key];
    }
  });

  $$('.cap-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      $$('.cap-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      $$('.cap-panel').forEach(p => { p.classList.remove('active'); p.hidden = true; });
      const panel = $(`#tab-${target}`);
      if (panel) {
        panel.classList.add('active');
        panel.hidden = false;
      }
    });
  });
}

// ── 6. Case Studies ──────────────────────────────────────────────
const CASE_STUDIES = [
  {
    id: 1,
    title: 'TechFlow MENA Platform',
    category: 'SaaS',
    filter: 'saas',
    client: 'TechFlow MENA',
    outcome: '+210% Qualified Leads',
    desc: 'Full rebrand and Next.js platform for a UAE-based B2B SaaS company targeting enterprise accounts.',
    challenge: 'TechFlow\'s legacy WordPress site generated almost zero inbound pipeline. The site loaded in 5.4s, lacked structured messaging, and had a 78% bounce rate. Sales was entirely outbound.',
    solution: 'We architected a Next.js 14 platform with a programmatic SEO layer, conversion-optimised landing pages, and a Hubspot-integrated lead qualification funnel. All content managed via Sanity CMS.',
    techStack: ['Next.js 14', 'TypeScript', 'Sanity CMS', 'Tailwind CSS', 'HubSpot', 'Vercel'],
    metrics: [
      { val: '+210%', lbl: 'Qualified Leads' },
      { val: '0.9s', lbl: 'Page Load Time' },
      { val: '99', lbl: 'Lighthouse Score' },
    ],
    color: '#FFFFFF',
    accentColor: '#2563EB',
    previewType: 'techflow',
  },
  {
    id: 2,
    title: 'CartPeak Commerce Store',
    category: 'E-Commerce',
    filter: 'ecommerce',
    client: 'CartPeak Commerce',
    outcome: '+340% Month-1 Revenue',
    desc: 'End-to-end Shopify Plus storefront with Stripe & Payoneer integration for a lifestyle brand launching in 3 markets.',
    challenge: 'CartPeak was launching a new DTC brand in UAE, UK, and Pakistan simultaneously. They needed a single storefront handling multi-currency, regional payment gateways, and fast-loading product pages.',
    solution: 'We delivered a Shopify Plus headless storefront with regional checkout flows, Stripe for USD/GBP and Payoneer for PKR, abandoned cart recovery via Klaviyo, and a custom product discovery experience.',
    techStack: ['Shopify Plus', 'React', 'Stripe', 'Payoneer', 'Klaviyo', 'Node.js'],
    metrics: [
      { val: '+340%', lbl: 'Month-1 Revenue' },
      { val: '1.1s', lbl: 'LCP Score' },
      { val: '94%', lbl: 'Checkout Completion' },
    ],
    color: '#FFFFFF',
    accentColor: '#059669',
    previewType: 'cartpeak',
  },
  {
    id: 3,
    title: 'Meridian Analytics Dashboard',
    category: 'SaaS',
    filter: 'saas',
    client: 'Meridian Analytics',
    outcome: '0.7s Load Time / -38% Bounce',
    desc: 'Full-stack Next.js SaaS dashboard and marketing site for a data analytics startup targeting UK mid-market.',
    challenge: 'Meridian\'s product dashboard was a monolithic PHP application. The marketing site was a dated WordPress install. Both were failing to retain trials and convert them to paid plans.',
    solution: 'We rebuilt the marketing site in Next.js with Framer Motion animations, and re-architected the dashboard in React + Node.js with real-time WebSocket data, RBAC, and a coded design system.',
    techStack: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Prisma', 'Framer Motion'],
    metrics: [
      { val: '-38%', lbl: 'Bounce Rate' },
      { val: '0.7s', lbl: 'Load Time' },
      { val: '+67%', lbl: 'Trial-to-Paid' },
    ],
    color: '#0B0F19',
    accentColor: '#7C3AED',
    previewType: 'meridian',
  },
  {
    id: 4,
    title: 'ZenithCo Corporate Website',
    category: 'Corporate',
    filter: 'corporate',
    client: 'ZenithCo Holdings',
    outcome: '+180% Investor Enquiries',
    desc: 'Premium corporate web presence for a Dubai-based holding group targeting institutional investors and partners.',
    challenge: 'ZenithCo had no digital presence credible enough to support their enterprise sales process. Investor introductions required lengthy offline presentations.',
    solution: 'We delivered an editorial-grade corporate site with an investor relations portal, PDF-based capability deck generator, and a password-protected data room for due diligence materials.',
    techStack: ['Astro', 'TypeScript', 'Contentful', 'Cloudflare Pages', 'PDF.js'],
    metrics: [
      { val: '+180%', lbl: 'Investor Enquiries' },
      { val: '100', lbl: 'Lighthouse Score' },
      { val: '3.2wk', lbl: 'Delivery Time' },
    ],
    color: '#0B0F19',
    accentColor: '#D97706',
    previewType: 'zenith',
  },
  {
    id: 5,
    title: 'NovaSpark Talent Platform',
    category: 'SaaS',
    filter: 'saas',
    client: 'NovaSpark HR',
    outcome: '+290% User Activation',
    desc: 'Custom web application for a talent marketplace connecting Pakistani tech talent with European clients.',
    challenge: 'NovaSpark\'s MVP was a no-code tool that couldn\'t scale. Matching logic was manual, and the onboarding flow had a 70% drop-off rate. They needed a scalable, custom-built web app.',
    solution: 'We built a full-stack Next.js web app with algorithmic talent matching, automated onboarding sequences, Stripe-based subscription billing, and a talent video profile system.',
    techStack: ['Next.js 15', 'Node.js', 'PostgreSQL', 'Redis', 'Stripe', 'AWS S3'],
    metrics: [
      { val: '+290%', lbl: 'User Activation' },
      { val: '-70%', lbl: 'Onboard Drop-off' },
      { val: '8wk', lbl: 'Ship to Launch' },
    ],
    color: '#F8FAFC',
    accentColor: '#DC2626',
    previewType: 'novaspark',
  },
  {
    id: 6,
    title: 'Pulsify Brand Website',
    category: 'Corporate',
    filter: 'corporate',
    client: 'Pulsify Media',
    outcome: '+165% Agency Pipeline',
    desc: 'Award-calibre agency website for a Lahore-based creative studio expanding into the GCC market.',
    challenge: 'Pulsify\'s previous site was a generic template that undersold their creative capability. It generated zero inbound despite significant ad spend driving traffic.',
    solution: 'We delivered a bespoke, animation-rich marketing site with a case study system, interactive service explorer, and a friction-free brief submission tool — all in 4 weeks.',
    techStack: ['Next.js', 'Framer Motion', 'GSAP', 'Sanity CMS', 'TypeScript'],
    metrics: [
      { val: '+165%', lbl: 'Agency Pipeline' },
      { val: '4wk', lbl: 'Delivery Time' },
      { val: '98', lbl: 'Lighthouse Score' },
    ],
    color: '#0B0F19',
    accentColor: '#16A34A',
    previewType: 'pulsify',
  },
];

function buildCasePreview(cs) {
  const div = document.createElement('div');
  div.className = 'mp-scaler';
  div.innerHTML = buildPreviewContent(cs);
  return div;
}

function buildPreviewContent(cs) {
  if (cs.previewType === 'techflow') {
    return `
      <div class="mp-inner-cs cs-techflow">
        <div class="cs-nav">
          <div class="cs-nav-logo"><div class="cs-nav-logo-sq"></div>TechFlow MENA</div>
          <div class="cs-nav-links">
            <span class="cs-nav-link">Platform</span>
            <span class="cs-nav-link">Solutions</span>
            <span class="cs-nav-cta">Console</span>
          </div>
        </div>
        <div class="cs-hero-content">
          <div class="cs-uptime-badge"><span class="cs-uptime-dot"></span>99.99% SLA Uptime</div>
          <div class="cs-h1">Enterprise Cloud Infrastructure</div>
          <div class="cs-h2">High-throughput distributed cloud backbone built for mission-critical enterprise workloads across EMEA.</div>
          <div class="cs-cta-row">
            <span class="cs-btn-p">Request Demo</span>
            <span class="cs-btn-g">Read Architecture</span>
          </div>
        </div>
        <div class="cs-metrics-row">
          <div class="cs-metric"><span class="cs-metric-val">&lt; 12ms</span><span class="cs-metric-lbl">Avg Latency</span></div>
          <div class="cs-metric"><span class="cs-metric-val">100Gbps</span><span class="cs-metric-lbl">Throughput</span></div>
          <div class="cs-metric"><span class="cs-metric-val">99.99%</span><span class="cs-metric-lbl">Global SLA</span></div>
        </div>
      </div>`;
  }

  if (cs.previewType === 'cartpeak') {
    return `
      <div class="mp-inner-cs cs-cartpeak">
        <div class="cs-store-header">
          <div class="cs-store-name">CartPeak · Storefront</div>
          <div class="cs-cart-badge">🛒 Bag (2 items)</div>
        </div>
        <div class="cs-product-grid">
          <div class="cs-prod-card">
            <div class="cs-prod-img" style="background:#EFF6FF;">
              <svg width="38" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <div class="cs-prod-info">
              <div class="cs-prod-name">Executive Leather Tote</div>
              <div class="cs-prod-price">$120</div>
              <div class="cs-quick-add">Quick Add +</div>
            </div>
          </div>
          <div class="cs-prod-card">
            <div class="cs-prod-img" style="background:#ECFDF5;">
              <svg width="38" height="30" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </div>
            <div class="cs-prod-info">
              <div class="cs-prod-name">Minimal Weekender</div>
              <div class="cs-prod-price">$85</div>
              <div class="cs-quick-add">Quick Add +</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  if (cs.previewType === 'meridian') {
    return `
      <div class="mp-inner-cs cs-meridian">
        <div class="cs-dash-header">
          <div class="cs-dash-logo">Meridian Analytics</div>
          <div class="cs-dash-status"><span class="cs-dash-status-dot"></span>Live Stream</div>
        </div>
        <div class="cs-dash-kpi">
          <div class="cs-dash-kpi-item">
            <span class="cs-dash-kpi-val green">+42.8% Growth</span>
            <span class="cs-dash-kpi-lbl">Quarterly Trajectory</span>
          </div>
          <div class="cs-dash-kpi-item">
            <span class="cs-dash-kpi-val">$84.6K</span>
            <span class="cs-dash-kpi-lbl">Pipeline Value</span>
          </div>
          <div class="cs-dash-kpi-item">
            <span class="cs-dash-kpi-val">0.7s</span>
            <span class="cs-dash-kpi-lbl">Query Latency</span>
          </div>
        </div>
        <div class="cs-dash-chart">
          <div class="cs-dash-chart-label">Inbound Funnel Conversion</div>
          <svg viewBox="0 0 300 48" width="100%" height="38" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#34D399" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#34D399" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path d="M0 40 Q 40 32, 80 28 T 160 16 T 240 22 T 300 6 L 300 48 L 0 48 Z" fill="url(#areaGrad)"/>
            <path d="M0 40 Q 40 32, 80 28 T 160 16 T 240 22 T 300 6" fill="none" stroke="#34D399" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="cs-dash-rows">
          <div class="cs-dash-row">
            <span class="cs-dash-row-label">Enterprise SQL Queries</span>
            <div class="cs-dash-row-bar"><div class="cs-dash-row-bar-fill" style="width:84%;background:#34D399;"></div></div>
            <span class="cs-dash-row-val">1.2M req</span>
          </div>
          <div class="cs-dash-row">
            <span class="cs-dash-row-label">Cache Hit Ratio</span>
            <div class="cs-dash-row-bar"><div class="cs-dash-row-bar-fill" style="width:96%;background:#2563EB;"></div></div>
            <span class="cs-dash-row-val">98.2%</span>
          </div>
        </div>
      </div>`;
  }

  if (cs.previewType === 'zenith') {
    return `
      <div class="mp-inner-cs cs-zenith">
        <div class="cs-exec-header">
          <div class="cs-exec-logo">ZENITHCO HOLDINGS</div>
          <div class="cs-exec-nav">
            <span>Strategy</span>
            <span>Portfolio</span>
            <span>Investors</span>
          </div>
        </div>
        <div class="cs-exec-hero">
          <div class="cs-exec-eyebrow">Institutional Investment Firm</div>
          <div class="cs-exec-h1">Global Capital &amp; Advisory</div>
          <div class="cs-exec-cta-row">
            <span class="cs-exec-btn">Investor Portal</span>
            <span class="cs-exec-btn-ghost">Annual Review</span>
          </div>
        </div>
        <div class="cs-exec-metrics">
          <div class="cs-exec-metric">
            <span class="cs-exec-metric-val">$2.4B AUM</span>
            <span class="cs-exec-metric-lbl">Assets Under Mgmt</span>
          </div>
          <div class="cs-exec-metric">
            <span class="cs-exec-metric-val">14 Offices</span>
            <span class="cs-exec-metric-lbl">Global Presence</span>
          </div>
          <div class="cs-exec-metric">
            <span class="cs-exec-metric-val">Est. 2008</span>
            <span class="cs-exec-metric-lbl">Track Record</span>
          </div>
        </div>
      </div>`;
  }

  if (cs.previewType === 'novaspark') {
    return `
      <div class="mp-inner-cs cs-novaspark">
        <div class="cs-talent-header">
          <div class="cs-talent-logo">NovaSpark · Talent</div>
          <div class="cs-talent-search">🔍 Search senior engineers...</div>
        </div>
        <div class="cs-dev-cards">
          <div class="cs-dev-card">
            <div class="cs-dev-header">
              <div class="cs-dev-monogram" style="background:#2563EB;">AK</div>
              <div>
                <div class="cs-dev-name">Ali Khan</div>
                <div class="cs-dev-role">Staff Frontend Eng</div>
              </div>
            </div>
            <div class="cs-verified-badge">✓ Verified Top 1%</div>
            <div class="cs-stack-tags">
              <span class="cs-stack-tag">React • Node</span>
              <span class="cs-stack-tag">Next.js</span>
            </div>
            <div class="cs-hire-btn">Hire Talent →</div>
          </div>
          <div class="cs-dev-card">
            <div class="cs-dev-header">
              <div class="cs-dev-monogram" style="background:#059669;">ZS</div>
              <div>
                <div class="cs-dev-name">Zainab S.</div>
                <div class="cs-dev-role">Senior Full-Stack</div>
              </div>
            </div>
            <div class="cs-verified-badge">✓ Verified Top 1%</div>
            <div class="cs-stack-tags">
              <span class="cs-stack-tag">React • Node</span>
              <span class="cs-stack-tag">PostgreSQL</span>
            </div>
            <div class="cs-hire-btn">Hire Talent →</div>
          </div>
        </div>
      </div>`;
  }

  if (cs.previewType === 'pulsify') {
    return `
      <div class="mp-inner-cs cs-pulsify">
        <div class="cs-pulsify-nav">
          <div class="cs-pulsify-logo">PULSIFY STUDIO</div>
          <div class="cs-pulsify-nav-links">
            <span class="cs-pulsify-nav-link">Selected Work</span>
            <span class="cs-pulsify-nav-link">About</span>
            <span class="cs-pulsify-nav-link">Contact</span>
          </div>
        </div>
        <div class="cs-pulsify-hero">
          <div class="cs-pulsify-eyebrow"><span class="cs-pulsify-feat-pill"></span>Featured Studio Reel 2026</div>
          <div class="cs-pulsify-h1">Digital <span>Brand Craft</span></div>
          <div class="cs-pulsify-sub">We design and engineer category-defining brand identities and high-impact digital experiences.</div>
          <div class="cs-pulsify-cta-row">
            <div class="cs-pulsify-reel-btn"><span class="cs-pulsify-play">▶</span> View Showreel</div>
            <span class="cs-pulsify-btn-ghost">Case Archives</span>
          </div>
        </div>
      </div>`;
  }

  return '';
}

function renderCaseGrid() {
  const grid = $('#caseGrid');
  if (!grid) return;
  grid.innerHTML = '';

  CASE_STUDIES.forEach(cs => {
    const card = document.createElement('div');
    card.className = 'case-card reveal';
    if (STATE.caseFilter !== 'all' && cs.filter !== STATE.caseFilter) {
      card.classList.add('hidden-card');
    }
    card.setAttribute('data-filter', cs.filter);
    card.setAttribute('data-id', cs.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open case study: ${cs.title}`);

    const preview = document.createElement('div');
    preview.className = 'case-preview';
    preview.appendChild(buildCasePreview(cs));

    card.innerHTML = `
      <div class="case-info">
        <div class="case-category">${cs.category}</div>
        <div class="case-title">${cs.title}</div>
        <div class="case-desc">${cs.desc}</div>
        <div class="case-outcome">✦ ${cs.outcome}</div>
      </div>`;
    card.prepend(preview);

    card.addEventListener('click', () => openCaseModal(cs));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCaseModal(cs); } });

    grid.appendChild(card);
  });

  // Re-trigger reveal observer
  setTimeout(() => {
    $$('.case-card.reveal:not(.visible)').forEach(el => {
      el.classList.add('visible');
    });
  }, 60);
}

function initCaseFilter() {
  renderCaseGrid();

  $$('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.filter-pill').forEach(p => { p.classList.remove('active'); p.setAttribute('aria-pressed', 'false'); });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
      STATE.caseFilter = pill.dataset.filter;

      $$('.case-card').forEach(card => {
        const match = STATE.caseFilter === 'all' || card.dataset.filter === STATE.caseFilter;
        card.classList.toggle('hidden-card', !match);
      });
    });
  });
}

// ── 7. Case Study Modal ──────────────────────────────────────────
function openCaseModal(cs) {
  const modal = $('#caseModal');
  const content = $('#caseModalContent');
  if (!modal || !content) return;

  const previewDiv = buildCasePreview(cs);
  previewDiv.style.width = '100%';
  previewDiv.style.height = '100%';

  const metricsHTML = cs.metrics.map(m => `
    <div class="cs-metric" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;text-align:center;">
      <span class="cs-metric-val" style="font-size:22px;color:#2563EB;display:block;margin-bottom:4px;font-family:'JetBrains Mono',monospace;">${m.val}</span>
      <span class="cs-metric-lbl" style="font-size:11.5px;color:#64748B;">${m.lbl}</span>
    </div>`).join('');

  const stackHTML = cs.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('');

  content.innerHTML = `
    <div class="cs-modal-header">
      <div class="cs-modal-preview"></div>
      <div class="cs-modal-info">
        <div class="cs-modal-cat">${cs.category} · ${cs.client}</div>
        <h3 class="cs-modal-title" id="caseModalTitle">${cs.title}</h3>
        <span class="cs-modal-outcome">✦ ${cs.outcome}</span>
      </div>
    </div>
    <div class="cs-modal-sections">
      <div class="cs-modal-section">
        <h4>Client Challenge</h4>
        <p>${cs.challenge}</p>
      </div>
      <div class="cs-modal-section">
        <h4>Engineering Solution</h4>
        <p>${cs.solution}</p>
      </div>
      <div class="cs-modal-section">
        <h4>Tech Stack</h4>
        <div class="tech-stack">${stackHTML}</div>
      </div>
      <div class="cs-modal-section">
        <h4>Key Metrics</h4>
        <div class="cs-modal-metrics">${metricsHTML}</div>
      </div>
    </div>`;

  // Inject mini preview
  const previewEl = content.querySelector('.cs-modal-preview');
  previewEl.appendChild(previewDiv);

  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  // Focus management
  const closeBtn = $('#caseModalClose');
  if (closeBtn) closeBtn.focus();
}

function closeCaseModal() {
  const modal = $('#caseModal');
  if (modal) { modal.hidden = true; document.body.style.overflow = ''; }
}

function initCaseModal() {
  const closeBtn = $('#caseModalClose');
  const overlay = $('#caseModal');
  if (closeBtn) closeBtn.addEventListener('click', closeCaseModal);
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeCaseModal(); });
}

// ── 8. Estimator ─────────────────────────────────────────────────
const EST_BASE = { business: 1200, ecommerce: 2800, webapp: 5500 };
const EST_TIMELINES = { business: '3–5 weeks', ecommerce: '5–8 weeks', webapp: '10–16 weeks' };
const EST_ADDONS = { ui: 800, payment: 400, backend: 600, seo: 350 };
const EST_BASE_LABELS = { business: 'Business Website', ecommerce: 'E-Commerce Store', webapp: 'Custom Web App' };
const EST_ADDON_LABELS = { ui: 'Custom UI/UX Design', payment: 'Payment Gateway', backend: 'Backend & Admin Panel', seo: 'Technical SEO & Speed' };

function calcEstimate() {
  let total = EST_BASE[STATE.projectType] || 1200;
  STATE.addons.forEach(addon => { total += EST_ADDONS[addon] || 0; });
  return total;
}

function updateAddonPriceLabels() {
  Object.entries(EST_ADDONS).forEach(([key, usd]) => {
    const el = $(`#addon${key.charAt(0).toUpperCase() + key.slice(1)}Price`) ||
                document.querySelector(`[id^="addon"][id*="${key.charAt(0).toUpperCase()}"]`);
  });
  // Update from map
  const map = { ui: 'addonUiPrice', payment: 'addonPayPrice', backend: 'addonBackendPrice', seo: 'addonSeoPrice' };
  Object.entries(map).forEach(([key, id]) => {
    const el = $(`#${id}`);
    if (el) el.textContent = '+' + fmt(EST_ADDONS[key]);
  });
}

function updateEstimator() {
  const total = calcEstimate();
  const priceEl = $('#estPrice');
  const pkrEl = $('#estPkrPrice');
  const timelineEl = $('#estTimeline');
  const breakdownEl = $('#estBreakdown');
  const baseValEl = $('#estBaseVal');

  if (priceEl) { animateValue(priceEl); priceEl.textContent = fmt(total); }
  if (pkrEl) pkrEl.textContent = STATE.currency === 'PKR' ? '' : fmtPkr(total);
  if (timelineEl) timelineEl.textContent = EST_TIMELINES[STATE.projectType];

  if (breakdownEl) {
    let rows = `<div class="est-break-row"><span>${EST_BASE_LABELS[STATE.projectType]}</span><span id="estBaseVal">${fmt(EST_BASE[STATE.projectType])}</span></div>`;
    STATE.addons.forEach(addon => {
      rows += `<div class="est-break-row"><span>${EST_ADDON_LABELS[addon]}</span><span>+${fmt(EST_ADDONS[addon])}</span></div>`;
    });
    rows += `<div class="est-break-row" style="font-weight:700;border-top:1px solid rgba(255,255,255,0.15);padding-top:8px;"><span>Total</span><span style="color:#fff;">${fmt(total)}</span></div>`;
    breakdownEl.innerHTML = rows;
  }

  updateAddonPriceLabels();
}

function getEstimatorSummary() {
  const total = calcEstimate();
  const addons = [...STATE.addons].map(a => EST_ADDON_LABELS[a]).join(', ');
  return `${EST_BASE_LABELS[STATE.projectType]}${addons ? ' + ' + addons : ''} — ${fmt(total)} (${fmtPkr(total)})`;
}

function initEstimator() {
  $$('input[name="projectType"]').forEach(radio => {
    radio.addEventListener('change', e => {
      STATE.projectType = e.target.value;
      updateEstimator();
    });
  });

  $$('.est-addon-cb').forEach(cb => {
    cb.addEventListener('change', e => {
      const addon = e.target.dataset.addon;
      if (e.target.checked) STATE.addons.add(addon);
      else STATE.addons.delete(addon);
      updateEstimator();
    });
  });

  const bookBtn = $('#estBookBtn');
  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      openBookingModal(getEstimatorSummary());
    });
  }

  updateEstimator();
}

// ── 9. Pricing Cards ─────────────────────────────────────────────
const PRICING_TIERS = {
  'one-time': [
    {
      tier: 'Starter',
      name: 'Business Presence',
      desc: 'Ideal for businesses that need a credible, conversion-optimised online presence fast.',
      usd: 1200,
      period: 'one-time',
      features: [
        '5–8 page responsive website',
        'Plus Jakarta Sans design system',
        'CMS integration (Sanity)',
        'On-page SEO setup',
        'Google Analytics 4 setup',
        '30-day bug-fix warranty',
      ],
      featured: false,
    },
    {
      tier: 'Growth',
      name: 'Full Platform Build',
      desc: 'The complete package — editorial design, elite engineering, and conversion-focused architecture.',
      usd: 3500,
      period: 'one-time',
      features: [
        'Everything in Starter',
        'Custom UI/UX design system',
        'E-Commerce or App integration',
        'Payment gateway setup',
        'Technical SEO audit & setup',
        'PHP/Node backend & admin panel',
        '60-day warranty',
      ],
      featured: true,
      badge: 'Most Popular',
    },
    {
      tier: 'Scale',
      name: 'Enterprise Custom Build',
      desc: 'Multi-stakeholder web apps, SaaS platforms, and complex integrations. Fully bespoke.',
      usd: 7500,
      period: 'starting from',
      features: [
        'Everything in Growth',
        'Custom web application development',
        'Multi-role auth & RBAC',
        'Admin dashboard & analytics',
        'Third-party API integrations',
        'CI/CD pipeline setup',
        '90-day warranty',
      ],
      featured: false,
    },
  ],
  retainer: [
    {
      tier: 'Starter',
      name: 'Maintenance Plan',
      desc: 'Keep your site fast, secure, and updated — without hiring an in-house dev team.',
      usd: 350,
      period: '/month',
      features: [
        'Monthly security updates',
        'Performance monitoring',
        'Up to 4hrs dev time/month',
        'Monthly Lighthouse audit',
        'Priority bug fixes',
        'Monthly progress report',
      ],
      featured: false,
    },
    {
      tier: 'Growth',
      name: 'Growth Retainer',
      desc: 'Dedicated monthly engineering hours to continuously improve your platform and pipeline.',
      usd: 950,
      period: '/month',
      features: [
        'Everything in Maintenance',
        'Up to 20hrs dev time/month',
        'CRO testing & analysis',
        'New feature development',
        'Content updates & iterations',
        'Weekly status calls',
        'Dedicated Slack channel',
      ],
      featured: true,
      badge: 'Best Value',
    },
    {
      tier: 'Scale',
      name: 'Product Partner',
      desc: 'Your embedded engineering team — full stack, full velocity, full ownership.',
      usd: 2200,
      period: '/month',
      features: [
        'Everything in Growth',
        'Up to 60hrs dev time/month',
        'Full product roadmap support',
        'Design system evolution',
        'Dedicated project lead',
        'SLA-backed response time',
        'Quarterly strategy session',
      ],
      featured: false,
    },
  ],
};

function renderPricingCards() {
  const grid = $('.pricing-grid');
  if (!grid) return;
  const mode = STATE.pricingMode;
  const tiers = PRICING_TIERS[mode];
  grid.innerHTML = '';

  tiers.forEach(tier => {
    const card = document.createElement('div');
    card.className = 'price-card reveal' + (tier.featured ? ' featured' : '');
    card.setAttribute('data-tier', tier.tier);

    const featuresHTML = tier.features.map(f => `
      <div class="price-feature"><span class="check">✓</span>${f}</div>`).join('');

    const badge = tier.badge ? `<div class="price-popular-badge">${tier.badge}</div>` : '';
    const val = fmt(tier.usd);
    const pkrLine = STATE.currency === 'USD'
      ? `<small style="font-size:11px;color:${tier.featured ? 'rgba(255,255,255,0.3)' : 'var(--slate-400)'};">${fmtPkr(tier.usd)} ${tier.period === '/month' ? '/ mo' : ''}</small>`
      : '';

    const periodSuffix = tier.period === 'one-time' ? ' (One-Time)'
      : tier.period === 'starting from' ? ' (Starting From)'
      : tier.period === '/month' ? ' (/month)'
      : ` (${tier.period})`;
    const planSummary = `${tier.tier} ${tier.name} — ${val}${periodSuffix}`;

    card.innerHTML = `
      ${badge}
      <div class="price-tier">${tier.tier}</div>
      <div class="price-name">${tier.name}</div>
      <div class="price-desc">${tier.desc}</div>
      <div class="price-amount">
        <span class="price-value">${val}</span>
        ${pkrLine}
        <span class="price-period">${tier.period}</span>
      </div>
      <div class="price-features">${featuresHTML}</div>
      <button class="btn-primary price-cta" data-plan="${planSummary}">
        Start with ${tier.tier}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>`;

    card.querySelector('.price-cta').addEventListener('click', () => {
      openBookingModal(planSummary);
    });

    grid.appendChild(card);

    setTimeout(() => card.classList.add('visible'), 60);
  });
}

function updatePricingCards() {
  renderPricingCards();
}

function initPricing() {
  renderPricingCards();

  const toggle = $('#pricingToggle');
  const labelOne = $('#ptLabelOne');
  const labelTwo = $('#ptLabelTwo');

  if (toggle) {
    toggle.addEventListener('change', () => {
      STATE.pricingMode = toggle.checked ? 'retainer' : 'one-time';
      toggle.setAttribute('aria-checked', toggle.checked);

      if (labelOne) labelOne.classList.toggle('active-label', !toggle.checked);
      if (labelTwo) labelTwo.classList.toggle('active-label', toggle.checked);

      renderPricingCards();
    });
  }

  if (labelOne) labelOne.classList.add('active-label');
}

// ── 10. FAQ ──────────────────────────────────────────────────────
function initFAQ() {
  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      $$('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Open clicked if was closed
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// ── 11. Booking Modal ────────────────────────────────────────────
function openBookingModal(prefill = '') {
  const modal = $('#bookingModal');
  const packageInput = $('#bookPackage');
  const idle = $('#bookingIdle');
  const success = $('#bookingSuccess');

  if (modal) {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  if (idle) idle.hidden = false;
  if (success) success.hidden = true;
  if (packageInput && prefill) packageInput.value = prefill;

  // Reset validation
  $$('.field-error').forEach(el => el.textContent = '');
  $$('input.invalid, textarea.invalid').forEach(el => el.classList.remove('invalid'));

  // Focus first field
  setTimeout(() => {
    const first = $('#bookName');
    if (first) first.focus();
  }, 100);
}

function closeBookingModal() {
  const modal = $('#bookingModal');
  if (modal) { modal.hidden = true; document.body.style.overflow = ''; }
  // Reset form
  const form = $('#bookingForm');
  if (form) form.reset();
  // Show idle, hide success
  const idle = $('#bookingIdle');
  const success = $('#bookingSuccess');
  if (idle) idle.hidden = false;
  if (success) success.hidden = true;
}

function validateForm() {
  let valid = true;

  const name = $('#bookName');
  const email = $('#bookEmail');
  const brief = $('#bookBrief');
  const nameErr = $('#nameError');
  const emailErr = $('#emailError');
  const briefErr = $('#briefError');

  // Reset
  [name, email, brief].forEach(el => { if (el) el.classList.remove('invalid'); });
  [nameErr, emailErr, briefErr].forEach(el => { if (el) el.textContent = ''; });

  if (!name || !name.value.trim()) {
    if (name) name.classList.add('invalid');
    if (nameErr) nameErr.textContent = 'Full name is required.';
    valid = false;
  }

  if (!email || !email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    if (email) email.classList.add('invalid');
    if (emailErr) emailErr.textContent = 'A valid email address is required.';
    valid = false;
  }

  if (!brief || !brief.value.trim() || brief.value.trim().length < 20) {
    if (brief) brief.classList.add('invalid');
    if (briefErr) briefErr.textContent = 'Please provide at least 20 characters about your project.';
    valid = false;
  }

  return valid;
}

function initBookingModal() {
  // Open triggers
  $$('#navBookBtn, #heroStartBtn, #ctaBandBtn, #faqBookBtn, #footerBookBtn').forEach(btn => {
    if (btn) btn.addEventListener('click', () => openBookingModal(''));
  });

  // Close buttons
  const closeBtn = $('#bookingModalClose');
  const overlay = $('#bookingModal');
  if (closeBtn) closeBtn.addEventListener('click', closeBookingModal);
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeBookingModal(); });

  // Success close
  const successClose = $('#successClose');
  if (successClose) successClose.addEventListener('click', closeBookingModal);

  // Form submit
  const form = $('#bookingForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validateForm()) return;

      const name = $('#bookName').value.trim();
      const email = $('#bookEmail').value.trim();
      const pkg = $('#bookPackage').value.trim();

      // Show success
      const idle = $('#bookingIdle');
      const success = $('#bookingSuccess');
      const details = $('#successDetails');

      if (idle) idle.hidden = true;
      if (success) success.hidden = false;

      if (details) {
        details.innerHTML = `
          <strong>Name:</strong> ${name}<br>
          <strong>Email:</strong> ${email}<br>
          ${pkg ? `<strong>Package:</strong> ${pkg}<br>` : ''}
          <strong>Expected response:</strong> Within 4 business hours`;
      }

      // Focus success
      setTimeout(() => {
        const btn = $('#successClose');
        if (btn) btn.focus();
      }, 100);
    });
  }

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCaseModal();
      closeBookingModal();
    }
  });
}

// ── 12. Keyboard trap for modals ─────────────────────────────────
function trapFocus(modal) {
  const focusable = modal.querySelectorAll('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

// ── 13. Mobile nav auto-close on link click ──────────────────────
function initMobileNavAutoClose() {
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const navbar = $('#navbar');
      const btn = $('#mobileMenuBtn');
      if (navbar) navbar.classList.remove('menu-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── 14. Main Boot ────────────────────────────────────────────────
function boot() {
  initScrollReveal();
  initNavbar();
  initCurrencySwitcher();
  initDashboard();
  initCapabilities();
  initCaseFilter();
  initCaseModal();
  initEstimator();
  initPricing();
  initFAQ();
  initBookingModal();
  initMobileNavAutoClose();

  // Trap focus in open modals
  ['#caseModal', '#bookingModal'].forEach(sel => {
    const el = $(sel);
    if (el) trapFocus(el);
  });

  // Initial reveal for visible elements
  $$('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) el.classList.add('visible');
  });

  console.info('%cNEXORA%c — nexora.io | Elite B2B Digital Agency', 'color:#2563EB;font-weight:900;font-size:16px;', 'color:#64748B;font-size:12px;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

