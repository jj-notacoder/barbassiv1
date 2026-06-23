/* =========================================================================
   Barbassi — interactions
   i18n (i18next) · character cascade · sandwich parallax · CTA 3D tilt ·
   GSAP stripe transition
   ========================================================================= */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. i18n — load local JSON dictionaries, fall back to inline copies so
        the page still works when opened directly from disk (file://).
     --------------------------------------------------------------------- */
  const FALLBACK = {
    en: {
      nav: { home: 'Home', about: 'About', menu: 'Menu', location: 'Location' },
      hero: {
        line1: 'Focaccia Kitchen',
        line2: '& Café',
        line3: 'Port Zayed,',
        line4: 'Abu Dhabi',
        address: 'Lunch! Lunch! Lunch!'
      },
      cta: 'Discover More',
      quote: {
        text: '“Our food lives in the background, we are meant to create conversation.”',
        author: '— Raj'
      },
      scroll: 'Scroll',
      next: {
        kicker: 'Mina Zayed · Abu Dhabi',
        title: 'The Menu',
        sub: 'Slow-proofed focaccia, layered by hand. Pull up a chair.'
      }
    },
    ar: {
      nav: { home: 'الرئيسية', about: 'من نحن', menu: 'القائمة', location: 'الموقع' },
      hero: {
        line1: 'مطبخ الفوكاتشيا',
        line2: 'والمقهى',
        line3: 'ميناء زايد،',
        line4: 'أبوظبي',
        address: 'غداء! غداء! غداء!'
      },
      cta: 'اكتشف المزيد',
      quote: {
        text: '«طعامنا يعيش في الخلفية، نحن هنا لنصنع الحوار.»',
        author: '— راج'
      },
      scroll: 'مرّر',
      next: {
        kicker: 'ميناء زايد · أبوظبي',
        title: 'القائمة',
        sub: 'فوكاتشيا تختمر ببطء وتُحضّر باليد. تفضل بالجلوس.'
      }
    }
  };

  async function loadDict(lng) {
    try {
      const res = await fetch(`locales/${lng}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch {
      return FALLBACK[lng];               // file:// or offline → inline copy
    }
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = i18next.t(el.getAttribute('data-i18n'));
      if (val) el.textContent = val;
    });
  }

  async function setLanguage(lng) {
    const dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    document.documentElement.dir = dir;

    // make sure the chosen language's resources exist
    if (!i18next.hasResourceBundle(lng, 'translation')) {
      i18next.addResourceBundle(lng, 'translation', await loadDict(lng));
    }
    await i18next.changeLanguage(lng);

    applyTranslations();
    splitTargets();                         // re-split for the new script/text
    updateToggleUI(lng);
  }

  function updateToggleUI(lng) {
    document.querySelectorAll('.lang').forEach((el) =>
      el.classList.toggle('is-active', el.classList.contains(lng)));
  }

  async function initI18n() {
    const en = await loadDict('en');
    await i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: { en: { translation: en } }
    });
    applyTranslations();

    document.querySelector('.lang-toggle')?.addEventListener('click', () => {
      const next = document.documentElement.lang === 'ar' ? 'en' : 'ar';
      setLanguage(next);
    });
  }

  /* ---------------------------------------------------------------------
     2. Character cascade for the location title.
        LTR  → split per character.
        RTL  → split per word (Arabic letters must stay connected).
     --------------------------------------------------------------------- */
  function splitInto(el, mode) {
    const text = el.textContent;
    el.textContent = '';
    const frag = document.createDocumentFragment();
    const parts = text.split(/(\s+)/);   // keep whitespace tokens

    parts.forEach((part) => {
      if (part === '') return;
      if (/^\s+$/.test(part)) { frag.append(part); return; }

      if (mode === 'word') {
        const w = document.createElement('span');
        w.className = 'word';
        w.textContent = part;
        frag.appendChild(w);
      } else {
        // char mode — wrap each word so lines never break mid-word
        const wrap = document.createElement('span');
        wrap.className = 'word-wrap';
        Array.from(part).forEach((ch) => {
          const c = document.createElement('span');
          c.className = 'char';
          c.textContent = ch;
          wrap.appendChild(c);
        });
        frag.appendChild(wrap);
      }
    });
    el.appendChild(frag);
    return el.querySelectorAll(mode === 'word' ? '.word' : '.char');
  }

  function splitTargets() {
    // Keep the split for translations, but we won't trigger the cascade if the master timeline takes over.
    const rtl = document.documentElement.dir === 'rtl';
    const lines = document.querySelectorAll('.location-title .line');
    const units = [];
    lines.forEach((line) => {
      splitInto(line, rtl ? 'word' : 'char').forEach((u) => units.push(u));
    });
    // Return units instead of automatically animating
    return units;
  }

  function animateCascade(units) {
    if (reduceMotion) return;
    if (window.gsap) {
      gsap.set(units, { yPercent: 120, opacity: 0 });
      gsap.to(units, {
        yPercent: 0, opacity: 1,
        duration: 0.85, ease: 'power3.out', stagger: 0.028, delay: 0.15
      });
    } else {
      units.forEach((u, i) => {
        u.style.opacity = 0;
        u.style.transform = 'translateY(120%)';
        u.style.transition = `transform .85s cubic-bezier(.16,1,.3,1) ${i * 0.028}s, opacity .6s ${i * 0.028}s`;
        requestAnimationFrame(() => { u.style.opacity = 1; u.style.transform = 'none'; });
      });
    }
  }

  /* ---------------------------------------------------------------------
     3. Reveal-on-load for [data-reveal] elements.
     --------------------------------------------------------------------- */
  function revealAll() {
    const els = document.querySelectorAll('[data-reveal]');
    els.forEach((el, i) => {
      setTimeout(() => el.classList.add('is-in'), 120 + i * 90);
    });
  }

  /* ---------------------------------------------------------------------
     4. Sandwich parallax — subtle follow of the mouse / pointer.
     --------------------------------------------------------------------- */
  function initParallax() {
    if (reduceMotion) return;
    const wrap = document.querySelector('[data-parallax]');
    if (!wrap) return;

    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5);
      const ny = (e.clientY / window.innerHeight - 0.5);
      tx = nx * 26;          // px range
      ty = ny * 20;
    });

    (function tick() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      wrap.style.setProperty('transform', `translate3d(${cx}px, ${cy}px, 0)`);
      requestAnimationFrame(tick);
    })();
  }

  /* ---------------------------------------------------------------------
     5. CTA — 3D tilt that follows the cursor.
     --------------------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion) return;
    const btn = document.querySelector('[data-tilt]');
    if (!btn) return;
    const MAX = 12;

    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      btn.style.transform =
        `perspective(600px) rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg) translateY(-2px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  }

  /* ---------------------------------------------------------------------
     6. Vibrant gradient text — toggle .animate-gradient via IntersectionObserver
        so the hue-rotating animation (re)starts each time text enters view.
        Button labels are excluded (the button drives its own hover animation).
     --------------------------------------------------------------------- */
  function initGradientObserver() {
    const els = Array.from(document.querySelectorAll('.gradient-text'))
      .filter((el) => !el.closest('.gradient-button'));
    if (!els.length) return;

    // Animate by default so the effect is always alive (also a safety net for
    // renderers that never report IntersectionObserver intersections)…
    if (!reduceMotion) els.forEach((el) => el.classList.add('animate-gradient'));

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    // …then let IO restart the hue cycle each time the text re-enters view.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('animate-gradient', e.isIntersecting));
    }, { threshold: 0.2 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     7. Raj clipart — fade-in + slide-up entry that replays on every re-entry.
     --------------------------------------------------------------------- */
  function initRajObserver() {
    const raj = document.querySelector('[data-raj]');
    if (!raj) return;

    // No IO / reduced motion → leave it visible (base state), no entry animation.
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    raj.classList.add('reveal-init');          // arm: hide, ready to slide up
    let fired = false;
    const io = new IntersectionObserver((entries) => {
      fired = true;
      entries.forEach((e) => raj.classList.toggle('in-view', e.isIntersecting));
    }, { threshold: 0.25 });
    io.observe(raj);

    // Safety net: if IO never reports (some embedded renderers), just show it.
    setTimeout(() => { if (!fired) raj.classList.remove('reveal-init'); }, 800);
  }

  /* ---------------------------------------------------------------------
     8. Stripe transition — build the hanging stripes, drop them in on scroll.
     --------------------------------------------------------------------- */
  function buildStripes() {
    const host = document.querySelector('.stripes');
    if (!host) return [];
    const count = Math.min(30, Math.max(12, Math.round(window.innerWidth / 52)));
    host.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'stripe';
      host.appendChild(s);
    }
    return Array.from(host.children);
  }

  let stripeTL = null;          // current timeline (so we can rebuild cleanly)

  function initStripeTransition() {
    const stripes = buildStripes();
    if (!stripes.length) return;

    if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
      stripes.forEach((s) => (s.style.transform = 'translateY(0)'));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // tear down any previous timeline + trigger (handles resize rebuilds)
    if (stripeTL) {
      if (stripeTL.scrollTrigger) stripeTL.scrollTrigger.kill();
      stripeTL.kill();
      stripeTL = null;
    }

    gsap.set(stripes, { yPercent: -101, filter: 'blur(8px)' });

    stripeTL = gsap.timeline({
      scrollTrigger: {
        trigger: '.stripe-transition',
        start: 'top 88%',
        end: 'top 18%',
        scrub: 0.6                 // scroll-linked → deterministic, cinematic
      }
    });

    stripeTL
      .to(stripes, {
        yPercent: 0,
        filter: 'blur(0px)',
        duration: 1.05,
        ease: 'power3.out',
        stagger: { each: 0.05, from: 'start' }
      })
      // reveal the next-section content as the curtain settles
      .from('.reveal-content > *', {
        y: 40, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12
      }, '-=0.3');

    ScrollTrigger.refresh();
  }

  /* ---------------------------------------------------------------------
     9. GSAP Entry Master Timeline
     --------------------------------------------------------------------- */
  function playEntryChoreography(units) {
    if (reduceMotion || !window.gsap) {
      document.getElementById('preloader')?.remove();
      animateCascade(units);
      revealAll();
      return;
    }

    const preloader = document.getElementById('preloader');
    const svgText = document.querySelector('#preloader-svg text');
    const statusText = document.querySelector('.preloader-status');

    if (!preloader) {
      animateCascade(units);
      revealAll();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        preloader.remove();
      }
    });

    // We manually simulate DrawSVG with dash offset
    // Get text path length approximation, or set large value
    // For simple text elements in SVG, stroke-dasharray and stroke-dashoffset can be used.
    gsap.set(svgText, { strokeDasharray: 800, strokeDashoffset: 800 });
    
    // Initial hidden states for hero elements
    const header = document.querySelector('.site-header');
    const leftLines = document.querySelectorAll('.left-text .line, .left-text .address');
    const centerLogo = document.querySelector('.hero-logo');
    const sandwich = document.querySelector('.sandwich');
    const cta = document.querySelector('.gradient-button');
    const rightQuote = document.querySelector('.quote');
    const rightRaj = document.querySelector('.raj-wrap');

    // Remove data-reveal from GSAP handled elements to avoid conflicts
    header?.removeAttribute('data-reveal');
    centerLogo?.removeAttribute('data-reveal');
    sandwich?.removeAttribute('data-reveal');

    gsap.set(header, { y: -30, opacity: 0 });
    gsap.set(leftLines, { x: -40, opacity: 0 });
    gsap.set(centerLogo, { opacity: 0 });
    gsap.set(sandwich, { scale: 0.85, opacity: 0 });
    gsap.set(cta, { y: 40, opacity: 0 });
    gsap.set(rightQuote, { opacity: 0 });
    gsap.set(rightRaj, { y: 30, rotation: -5, opacity: 0 });

    // Phase 1: Draw Logo
    tl.to(svgText, {
      strokeDashoffset: 0,
      duration: 1.5,
      ease: 'power2.inOut'
    })
    // Phase 2: Fade out preloader content & lift curtain
    .to([svgText, statusText], {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out'
    }, '+=0.2')
    .to(preloader, {
      yPercent: -100,
      duration: 1.2,
      ease: 'power4.inOut'
    }, 'curtain')
    
    // Phase 3: Staggered Hero Entry (starting halfway through curtain lift)
    .add('hero-entry', 'curtain+=0.6')
    // Header
    .to(header, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out'
    }, 'hero-entry')
    // Left Text Stagger
    .to(leftLines, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'back.out(1.2)'
    }, 'hero-entry+=0.1')
    // Center Hero
    .to(centerLogo, {
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out'
    }, 'hero-entry+=0.2')
    .to(sandwich, {
      scale: 1,
      opacity: 1,
      duration: 1,
      ease: 'back.out(1.5)'
    }, 'hero-entry+=0.3')
    .to(cta, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'elastic.out(1, 0.75)'
    }, 'hero-entry+=0.4')
    // Right Quote / Raj
    .to(rightQuote, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out'
    }, 'hero-entry+=0.5')
    .to(rightRaj, {
      y: 0,
      rotation: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out'
    }, 'hero-entry+=0.6');

    // Trigger remaining reveals (like menu stripes if in view)
    tl.add(() => revealAll(), 'hero-entry+=0.5');
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  window.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    const units = splitTargets();
    
    // Check if we should run the sequence
    const hasLoaded = sessionStorage.getItem('barbassi_loaded');
    if (!hasLoaded) {
      sessionStorage.setItem('barbassi_loaded', 'true');
      playEntryChoreography(units);
    } else {
      // Immediately remove preloader and show normally
      document.getElementById('preloader')?.remove();
      const header = document.querySelector('.site-header');
      const centerLogo = document.querySelector('.hero-logo');
      const sandwich = document.querySelector('.sandwich');
      if (header) header.style.opacity = 1;
      if (centerLogo) centerLogo.style.opacity = 1;
      if (sandwich) sandwich.style.opacity = 1;
      
      animateCascade(units);
      revealAll();
    }

    initParallax();
    initTilt();
    initGradientObserver();
    initRajObserver();
    initStripeTransition();

    // recompute trigger positions once fonts / images have settled
    window.addEventListener('load', () => {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });

    // rebuild stripes at the right density when the viewport changes
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(initStripeTransition, 220);
    });
  });
})();
