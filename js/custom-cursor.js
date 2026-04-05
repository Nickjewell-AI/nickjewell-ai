// js/custom-cursor.js — R2 custom cursor (desktop only)
// Progressive enhancement: hidden on touch devices, no-op on reduced motion.

(function () {
  'use strict';

  // Skip on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;
  // Skip if reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function mount() {
    if (document.getElementById('cursor-dot')) return;

    var dot = document.createElement('div');
    dot.id = 'cursor-dot';
    dot.style.cssText =
      'position:fixed;top:0;left:0;width:8px;height:8px;background:#722F37;' +
      'border-radius:50%;pointer-events:none;z-index:9999;opacity:0;' +
      'transition:width 0.2s ease,height 0.2s ease,opacity 0.15s ease,background 0.2s ease;' +
      'transform:translate(-50%,-50%);mix-blend-mode:darken;will-change:transform,left,top;';
    document.body.appendChild(dot);

    var mouseX = 0,
      mouseY = 0;
    var dotX = 0,
      dotY = 0;
    var isVisible = false;
    var isHover = false;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = isHover ? '0.15' : '1';
      }
    });

    document.addEventListener('mouseleave', function () {
      isVisible = false;
      dot.style.opacity = '0';
    });

    // Lerped follow
    (function animate() {
      dotX += (mouseX - dotX) * 0.2;
      dotY += (mouseY - dotY) * 0.2;
      dot.style.left = dotX + 'px';
      dot.style.top = dotY + 'px';
      requestAnimationFrame(animate);
    })();

    // Scale on hover targets
    var hoverTargets =
      'a, button, .option-button, .card, .logo-card, .logo-card-link, ' +
      '.contact-link, .writing-item, .btn-primary, .btn-secondary, ' +
      '.start-btn, .nav-links a, .nav-link, .nav-logo, input, textarea, select, [role="button"]';

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hoverTargets)) {
        isHover = true;
        dot.style.width = '40px';
        dot.style.height = '40px';
        if (isVisible) dot.style.opacity = '0.15';
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hoverTargets)) {
        isHover = false;
        dot.style.width = '8px';
        dot.style.height = '8px';
        if (isVisible) dot.style.opacity = '1';
      }
    });

    // Hide system cursor via class (CSS has the @media(pointer:coarse) override)
    document.documentElement.classList.add('has-custom-cursor');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
