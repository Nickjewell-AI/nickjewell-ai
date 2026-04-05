// js/scroll-animations.js — R2 GSAP scroll orchestration
// Progressive enhancement: if GSAP isn't loaded, elements show immediately via CSS fallback.

(function () {
  'use strict';

  // Failsafe: if GSAP never initializes, add .gsap-fallback to body after 3s so
  // opacity:0 elements become visible.
  setTimeout(function () {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      document.body.classList.add('gsap-fallback');
    }
  }, 3000);

  // Bail if GSAP not available
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP not loaded — falling back to CSS');
    document.body.classList.add('gsap-fallback');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Respect reduced motion preference
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.body.classList.add('gsap-fallback');
    return;
  }

  // ─── HERO ANIMATIONS (page load, not scroll) ───
  function animateHero() {
    var hero = document.querySelector('.hero, .framework-hero, .about-hero');
    if (!hero) return;

    // Wait for the page loader to finish (if present)
    var loader = document.getElementById('page-loader');
    var skippedLoader = sessionStorage.getItem('jw-loaded') === '1-consumed';
    // 600ms loader + 300ms fade = 900ms. When skipped (return visit), no delay.
    var delay = (loader && !skippedLoader) ? 0.9 : 0;

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: delay });

    var eyebrow = hero.querySelector('.eyebrow');
    if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 0);

    var h1 = hero.querySelector('h1');
    if (h1 && !h1.dataset.wordSplit) {
      // Only word-split if h1 has no inline HTML children (plain text)
      var hasInlineChildren = h1.children.length > 0;
      if (!hasInlineChildren) {
        var words = h1.textContent.trim().split(/\s+/);
        h1.innerHTML = words
          .map(function (w) {
            return '<span class="word-wrap" style="display:inline-block">' + w + '</span>';
          })
          .join(' ');
        h1.dataset.wordSplit = '1';
        var wordEls = h1.querySelectorAll('.word-wrap');
        tl.fromTo(wordEls, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.2);
      } else {
        // Has inline HTML (e.g., <em>) — animate the whole h1 as one unit
        tl.fromTo(h1, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 0.2);
      }
    }

    var heroSubtitle = hero.querySelector('.hero-subtitle');
    if (heroSubtitle) tl.fromTo(heroSubtitle, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.3');

    var subtext = hero.querySelector('.subtext');
    if (subtext) tl.fromTo(subtext, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.3');

    var persona = hero.querySelector('.persona-line');
    var stat = hero.querySelector('.stat-line');
    if (persona) tl.fromTo(persona, { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');
    if (stat) tl.fromTo(stat, { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');

    var ctas = hero.querySelector('.hero-ctas');
    if (ctas) tl.fromTo(ctas, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.1');

    // Any additional direct paragraphs in the hero that weren't animated — reveal them
    var thesis = hero.querySelector('.thesis');
    if (thesis) tl.fromTo(thesis, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.2');
  }

  // ─── SCROLL ANIMATIONS ───
  function initScrollAnimations() {
    // Section headers — slide in from left
    gsap.utils.toArray('.section-header').forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Pattern vignettes — stagger cascade
    var vignettes = gsap.utils.toArray('.pattern-vignette');
    if (vignettes.length) {
      gsap.fromTo(
        vignettes,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: { trigger: vignettes[0], start: 'top 80%', toggleActions: 'play none none none' }
        }
      );
    }

    // Logo cards (wrapped in .logo-card-link on homepage) — sequential reveal
    var logoCards = gsap.utils.toArray('.logo-card-link, .logo-card');
    // De-duplicate: if a .logo-card is inside a .logo-card-link, only animate the link
    logoCards = logoCards.filter(function (el) {
      if (el.classList.contains('logo-card') && el.closest('.logo-card-link')) return false;
      return true;
    });
    if (logoCards.length) {
      gsap.fromTo(
        logoCards,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: logoCards[0], start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    }

    // Cards — fade up
    gsap.utils.toArray('.card').forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Writing items — stagger
    var writingItems = gsap.utils.toArray('.writing-item');
    if (writingItems.length) {
      gsap.fromTo(
        writingItems,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          scrollTrigger: { trigger: writingItems[0], start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    }

    // Contact links — stagger
    var contactLinks = gsap.utils.toArray('.contact-link');
    if (contactLinks.length) {
      gsap.fromTo(
        contactLinks,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          scrollTrigger: { trigger: contactLinks[0], start: 'top 90%', toggleActions: 'play none none none' }
        }
      );
    }

    // Generic .gsap-reveal elements — simple fade
    gsap.utils.toArray('.gsap-reveal').forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });
  }

  // ─── FRAMEWORK PAGE SPECIFIC ───
  function initFrameworkAnimations() {
    gsap.utils.toArray('.layer-bar-fill').forEach(function (bar) {
      var targetWidth = bar.style.width || bar.dataset.targetWidth;
      if (targetWidth) {
        bar.style.width = '0%';
        gsap.to(bar, {
          width: targetWidth,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: bar, start: 'top 90%', toggleActions: 'play none none none' }
        });
      }
    });
  }

  // ─── INIT ───
  function init() {
    requestAnimationFrame(function () {
      animateHero();
      initScrollAnimations();
      initFrameworkAnimations();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
