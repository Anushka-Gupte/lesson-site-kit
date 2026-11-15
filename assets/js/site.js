/**
 * FROM ZERO — assets/js/site.js
 * Hand-written, zero dependencies.
 * Features:
 *  1. Theme toggle with persistence (light / dark)
 *  2. Interactive Stepper ([data-stepper]) with cumulative layers, JSON panel sync, a11y live region & keyboard navigation
 *  3. Code copy button ([data-copy]) with visual feedback
 *  4. Table of contents scrollspy
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Theme Switcher
     ========================================================================== */
  const THEME_STORAGE_KEY = 'fromzero-theme';

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggles = document.querySelectorAll('.theme-toggle, [data-theme-toggle]');
    toggles.forEach(toggle => {
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      toggle.setAttribute('title', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }

  function initTheme() {
    const saved = getSavedTheme();
    const active = saved || getSystemTheme();
    applyTheme(active);

    // Wire toggle buttons
    const toggles = document.querySelectorAll('.theme-toggle, [data-theme-toggle]');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || getSystemTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) {}
        applyTheme(next);
      });
    });

    // Listen for OS theme changes if user has no stored override
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!getSavedTheme()) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /* ==========================================================================
     2. Interactive Stepper ([data-stepper])
     ========================================================================== */
  function initSteppers() {
    const steppers = document.querySelectorAll('[data-stepper]');

    steppers.forEach((stepper, sIdx) => {
      const dataScript = stepper.querySelector('.stepper__data');
      if (!dataScript) return;

      let stepsData = [];
      try {
        stepsData = JSON.parse(dataScript.textContent.trim());
      } catch (err) {
        console.warn('Failed to parse stepper data', err);
        return;
      }

      const totalSteps = stepsData.length;
      if (totalSteps === 0) return;

      const prevBtn = stepper.querySelector('[data-prev]');
      const nextBtn = stepper.querySelector('[data-next]');
      const countEl = stepper.querySelector('.stepper__count');
      const titleEl = stepper.querySelector('.stepper__title');
      const textEl = stepper.querySelector('.stepper__text');
      const stage = stepper.querySelector('.stepper__stage');
      const stepLayers = stage ? stage.querySelectorAll('[data-step]') : [];

      let currentStep = 1;

      // Allow keyboard navigation when stepper container or its controls are focused
      if (!stepper.hasAttribute('tabindex')) {
        stepper.setAttribute('tabindex', '0');
      }

      function renderStep(idx) {
        currentStep = Math.max(1, Math.min(idx, totalSteps));
        const data = stepsData[currentStep - 1] || {};

        // Update Text Panel
        if (countEl) countEl.textContent = `Step ${currentStep} of ${totalSteps}`;
        if (titleEl) titleEl.textContent = data.title || `Step ${currentStep}`;
        if (textEl) textEl.textContent = data.text || '';

        // Update Cumulative SVG Layers
        stepLayers.forEach(layer => {
          const stepNum = parseInt(layer.getAttribute('data-step'), 10);
          if (stepNum <= currentStep) {
            layer.classList.add('is-visible');
          } else {
            layer.classList.remove('is-visible');
          }

          if (stepNum === currentStep) {
            layer.classList.add('is-current');
          } else {
            layer.classList.remove('is-current');
          }
        });

        // Update Controls
        if (prevBtn) prevBtn.disabled = (currentStep === 1);
        if (nextBtn) nextBtn.disabled = (currentStep === totalSteps);
      }

      // Initial Render
      renderStep(1);

      // Button listeners
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (currentStep > 1) renderStep(currentStep - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentStep < totalSteps) renderStep(currentStep + 1);
        });
      }

      // Keyboard left/right arrow listeners
      stepper.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'Right') {
          if (currentStep < totalSteps) {
            e.preventDefault();
            renderStep(currentStep + 1);
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
          if (currentStep > 1) {
            e.preventDefault();
            renderStep(currentStep - 1);
          }
        }
      });
    });
  }

  /* ==========================================================================
     3. Runnable Code Copy Button ([data-copy])
     ========================================================================== */
  function initCopyButtons() {
    const copyButtons = document.querySelectorAll('[data-copy]');

    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Find nearest code container
        const parent = button.closest('.run') || button.parentElement;
        const codeEl = parent ? parent.querySelector('pre code, code') : null;
        if (!codeEl) return;

        const textToCopy = codeEl.innerText || codeEl.textContent;

        const originalText = button.textContent;

        function showSuccess() {
          button.textContent = 'Copied!';
          button.setAttribute('aria-live', 'polite');
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(showSuccess).catch(err => {
            fallbackCopy(textToCopy, showSuccess);
          });
        } else {
          fallbackCopy(textToCopy, showSuccess);
        }
      });
    });

    function fallbackCopy(text, callback) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        callback();
      } catch (e) {
        console.warn('Copy command failed', e);
      }
      document.body.removeChild(textarea);
    }
  }

  /* ==========================================================================
     4. Table of Contents Scrollspy
     ========================================================================== */
  function initScrollspy() {
    const toc = document.querySelector('.toc');
    if (!toc) return;

    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    if (links.length === 0) return;

    const targets = links.map(link => {
      const id = link.getAttribute('href').slice(1);
      return document.getElementById(id);
    }).filter(Boolean);

    if (targets.length === 0) return;

    let activeLink = null;

    function setActive(link) {
      if (activeLink === link) return;
      if (activeLink) activeLink.classList.remove('is-active');
      if (link) link.classList.add('is-active');
      activeLink = link;
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            const matchingLink = links.find(l => l.getAttribute('href') === `#${id}`);
            if (matchingLink) setActive(matchingLink);
          }
        });
      }, {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      });

      targets.forEach(target => observer.observe(target));
    } else {
      // Fallback scroll listener
      window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 120;
        let currentTarget = null;
        for (const target of targets) {
          if (target.offsetTop <= scrollPos) {
            currentTarget = target;
          } else {
            break;
          }
        }
        if (currentTarget) {
          const id = currentTarget.getAttribute('id');
          const matchingLink = links.find(l => l.getAttribute('href') === `#${id}`);
          if (matchingLink) setActive(matchingLink);
        }
      }, { passive: true });
    }
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    initTheme();
    initSteppers();
    initCopyButtons();
    initScrollspy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
