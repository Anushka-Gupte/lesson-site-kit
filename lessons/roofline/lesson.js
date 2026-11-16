/**
 * FROM ZERO — lessons/roofline/lesson.js
 * Interactive GPU Roofline Plot Explorer
 * Pure vanilla JavaScript, zero dependencies.
 */

(function () {
  'use strict';

  // Constants & Scale Limits
  const X_MIN_LOG = -1;     // 10^-1 = 0.1 FLOP/byte
  const X_MAX_LOG = 4;      // 10^4 = 10,000 FLOP/byte
  const Y_MIN_LOG = -3;     // 10^-3 = 0.001 TFLOP/s (1 GFLOP/s)
  const Y_MAX_LOG = 3.5;    // 10^3.5 = ~3,162 TFLOP/s

  // SVG Canvas Dimensions
  const PLOT_LEFT = 75;
  const PLOT_RIGHT = 730;
  const PLOT_TOP = 40;
  const PLOT_BOTTOM = 400;
  const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
  const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

  // Preset Configurations
  const PRESETS = {
    mi300x: {
      id: 'mi300x',
      name: 'AMD Instinct MI300X (Spec Sheet, BF16)',
      peak: 1307,        // TFLOP/s
      bandwidth: 5.3,    // TB/s (5,300 GB/s)
      label: 'MI300X Spec Sheet'
    },
    t4: {
      id: 't4',
      name: 'Tesla T4 (Measured, FP16)',
      peak: 36,          // TFLOP/s
      bandwidth: 0.247,  // TB/s (247 GB/s)
      label: 'Tesla T4 Measured'
    },
    cpu: {
      id: 'cpu',
      name: 'Intel Xeon 1-core (Measured, FP32)',
      peak: 0.150,       // TFLOP/s (150 GFLOP/s)
      bandwidth: 0.0117, // TB/s (11.7 GB/s)
      label: 'Intel CPU Measured'
    }
  };

  // The 4 Example Operations (Arithmetic Intensity I in FLOP/byte)
  const OPERATIONS = [
    {
      id: 'op-add',
      name: 'Add lists (c = a + b)',
      intensity: 0.17,
      color: '#4338CA',
      desc: '1 FLOP per 6 bytes'
    },
    {
      id: 'op-dec1',
      name: 'LLM decode (1 user)',
      intensity: 1.0,
      color: '#0F766E',
      desc: '1 token reads all weights'
    },
    {
      id: 'op-dec64',
      name: 'LLM decode (64 users)',
      intensity: 64.0,
      color: '#9A5205',
      desc: 'Batching reuses weights 64x'
    },
    {
      id: 'op-matmul',
      name: '4096 matmul (N x N)',
      intensity: 1365.3,
      color: '#B45309',
      desc: '2N³ FLOPs / 6N² bytes'
    }
  ];

  // Log Space Coordinate Transformers
  function xToPx(intensity) {
    const val = Math.max(0.1, Math.min(10000, intensity));
    const logVal = Math.log10(val);
    const frac = (logVal - X_MIN_LOG) / (X_MAX_LOG - X_MIN_LOG);
    return PLOT_LEFT + frac * PLOT_WIDTH;
  }

  function yToPx(speed) {
    const val = Math.max(0.001, Math.min(Math.pow(10, Y_MAX_LOG), speed));
    const logVal = Math.log10(val);
    const frac = (logVal - Y_MIN_LOG) / (Y_MAX_LOG - Y_MIN_LOG);
    return PLOT_BOTTOM - frac * PLOT_HEIGHT;
  }

  // Formatting Utilities
  function formatSpeed(speedTflops) {
    if (speedTflops >= 1) {
      return `${speedTflops.toLocaleString('en-US', { maximumFractionDigits: 1 })} TFLOP/s`;
    }
    const gflops = speedTflops * 1000;
    return `${gflops.toLocaleString('en-US', { maximumFractionDigits: 1 })} GFLOP/s`;
  }

  function formatBandwidth(bwTb) {
    if (bwTb >= 1) {
      return `${bwTb.toLocaleString('en-US', { maximumFractionDigits: 2 })} TB/s`;
    }
    const gb = bwTb * 1000;
    return `${gb.toLocaleString('en-US', { maximumFractionDigits: 1 })} GB/s`;
  }

  function formatPeak(peakTflops) {
    if (peakTflops >= 1) {
      return `${peakTflops.toLocaleString('en-US', { maximumFractionDigits: 0 })} TFLOP/s`;
    }
    const gflops = peakTflops * 1000;
    return `${gflops.toLocaleString('en-US', { maximumFractionDigits: 0 })} GFLOP/s`;
  }

  // Main Controller
  function initRooflineExplorer() {
    const root = document.querySelector('.explorer-container');
    if (!root) return;

    // DOM Elements
    const peakSlider = root.querySelector('#slider-peak');
    const bwSlider = root.querySelector('#slider-bw');
    const peakDisplay = root.querySelector('#val-peak');
    const bwDisplay = root.querySelector('#val-bw');
    const ridgeDisplay = root.querySelector('#val-ridge');
    const presetButtons = root.querySelectorAll('[data-preset]');

    // SVG Elements
    const memSlopeEl = root.querySelector('#svg-mem-slope');
    const compRoofEl = root.querySelector('#svg-comp-roof');
    const ridgeLineEl = root.querySelector('#svg-ridge-line');
    const ridgePointEl = root.querySelector('#svg-ridge-point');
    const ridgeTextEl = root.querySelector('#svg-ridge-text');
    const memAreaEl = root.querySelector('#svg-mem-area');
    const compAreaEl = root.querySelector('#svg-comp-area');
    const opGroupEl = root.querySelector('#svg-ops-group');

    // Readout Grid
    const readoutGrid = root.querySelector('#readout-grid');

    // State Variables
    let currentPeak = PRESETS.mi300x.peak;
    let currentBw = PRESETS.mi300x.bandwidth;
    let activePreset = 'mi300x';

    // Slider Mapping: 0 to 1000 -> Log scale
    const PEAK_MIN_LOG = Math.log10(0.05);  // 50 GFLOP/s
    const PEAK_MAX_LOG = Math.log10(3000);  // 3,000 TFLOP/s
    const BW_MIN_LOG = Math.log10(0.005);   // 5 GB/s
    const BW_MAX_LOG = Math.log10(10.0);    // 10 TB/s

    function peakFromSlider(val) {
      const log = PEAK_MIN_LOG + (val / 1000) * (PEAK_MAX_LOG - PEAK_MIN_LOG);
      return Math.pow(10, log);
    }

    function sliderFromPeak(peak) {
      const log = Math.log10(peak);
      return Math.round(((log - PEAK_MIN_LOG) / (PEAK_MAX_LOG - PEAK_MIN_LOG)) * 1000);
    }

    function bwFromSlider(val) {
      const log = BW_MIN_LOG + (val / 1000) * (BW_MAX_LOG - BW_MIN_LOG);
      return Math.pow(10, log);
    }

    function sliderFromBw(bw) {
      const log = Math.log10(bw);
      return Math.round(((log - BW_MIN_LOG) / (BW_MAX_LOG - BW_MIN_LOG)) * 1000);
    }

    function update() {
      // 1. Calculate Ridge Point
      const ridgeIntensity = currentPeak / currentBw;

      // 2. Update Header Displays
      if (peakDisplay) peakDisplay.textContent = formatPeak(currentPeak);
      if (bwDisplay) bwDisplay.textContent = formatBandwidth(currentBw);
      if (ridgeDisplay) ridgeDisplay.textContent = `${Math.round(ridgeIntensity)} FLOP/byte`;

      // 3. Compute SVG Geometry
      const ridgeX = xToPx(ridgeIntensity);
      const roofY = yToPx(currentPeak);

      const xMinPx = xToPx(0.1);
      const speedAtXMin = currentBw * 0.1;
      const yAtXMin = yToPx(speedAtXMin);
      const xMaxPx = xToPx(10000);

      // Clamp ridgeX within plot bounds for line drawing
      const clampedRidgeX = Math.max(PLOT_LEFT, Math.min(PLOT_RIGHT, ridgeX));

      // Memory Diagonal (from x=0.1 to ridge point)
      if (memSlopeEl) {
        memSlopeEl.setAttribute('x1', xMinPx);
        memSlopeEl.setAttribute('y1', yAtXMin);
        memSlopeEl.setAttribute('x2', clampedRidgeX);
        memSlopeEl.setAttribute('y2', roofY);
      }

      // Compute Roof (from ridge point to x=10000)
      if (compRoofEl) {
        compRoofEl.setAttribute('x1', clampedRidgeX);
        compRoofEl.setAttribute('y1', roofY);
        compRoofEl.setAttribute('x2', xMaxPx);
        compRoofEl.setAttribute('y2', roofY);
      }

      // Ridge Marker Line & Dot
      if (ridgeLineEl) {
        ridgeLineEl.setAttribute('x1', clampedRidgeX);
        ridgeLineEl.setAttribute('y1', roofY);
        ridgeLineEl.setAttribute('x2', clampedRidgeX);
        ridgeLineEl.setAttribute('y2', PLOT_BOTTOM);
      }

      if (ridgePointEl) {
        ridgePointEl.setAttribute('cx', clampedRidgeX);
        ridgePointEl.setAttribute('cy', roofY);
      }

      if (ridgeTextEl) {
        ridgeTextEl.setAttribute('x', clampedRidgeX);
        ridgeTextEl.setAttribute('y', Math.max(25, roofY - 14));
        ridgeTextEl.textContent = `Ridge: ${Math.round(ridgeIntensity)} FLOP/B`;
      }

      // Shaded Areas
      if (memAreaEl) {
        const memPts = `${xMinPx},${PLOT_BOTTOM} ${xMinPx},${yAtXMin} ${clampedRidgeX},${roofY} ${clampedRidgeX},${PLOT_BOTTOM}`;
        memAreaEl.setAttribute('points', memPts);
      }

      if (compAreaEl) {
        const compPts = `${clampedRidgeX},${PLOT_BOTTOM} ${clampedRidgeX},${roofY} ${xMaxPx},${roofY} ${xMaxPx},${PLOT_BOTTOM}`;
        compAreaEl.setAttribute('points', compPts);
      }

      // 4. Update the 4 Operations
      if (opGroupEl) {
        opGroupEl.innerHTML = '';
        OPERATIONS.forEach(op => {
          const attainable = Math.min(currentPeak, currentBw * op.intensity);
          const px = xToPx(op.intensity);
          const py = yToPx(attainable);

          // Dot
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', px);
          circle.setAttribute('cy', py);
          circle.setAttribute('r', '7');
          circle.setAttribute('fill', op.color);
          circle.setAttribute('stroke', '#FFFFFF');
          circle.setAttribute('stroke-width', '2');

          // Label
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', px);
          text.setAttribute('y', Math.max(30, py - 10));
          text.setAttribute('font-family', "'Inter', sans-serif");
          text.setAttribute('font-size', '12');
          text.setAttribute('font-weight', '600');
          text.setAttribute('fill', op.color);
          text.setAttribute('text-anchor', 'middle');
          text.textContent = op.name.split(' (')[0];

          opGroupEl.appendChild(circle);
          opGroupEl.appendChild(text);
        });
      }

      // 5. Update Readout Cards
      if (readoutGrid) {
        readoutGrid.innerHTML = '';
        OPERATIONS.forEach(op => {
          const attainable = Math.min(currentPeak, currentBw * op.intensity);
          const isMemoryBound = (op.intensity <= ridgeIntensity);
          const shareOfPeak = (attainable / currentPeak) * 100;

          const card = document.createElement('div');
          card.className = 'readout-item';

          card.innerHTML = `
            <div class="readout-item__name">${op.name}</div>
            <div class="readout-item__stat">${formatSpeed(attainable)}</div>
            <div class="readout-item__state">
              ${isMemoryBound ? '<strong style="color:var(--saffron);">Memory-bound</strong> (waiting on memory)' : '<strong style="color:var(--teal);">Compute-bound</strong> (uses whole chip)'}
              <br><span style="color:var(--muted);">${shareOfPeak.toFixed(1)}% of peak compute</span>
            </div>
          `;
          readoutGrid.appendChild(card);
        });
      }
    }

    // Set Preset Helper
    function setPreset(presetKey) {
      const p = PRESETS[presetKey];
      if (!p) return;

      activePreset = presetKey;
      currentPeak = p.peak;
      currentBw = p.bandwidth;

      if (peakSlider) peakSlider.value = sliderFromPeak(currentPeak);
      if (bwSlider) bwSlider.value = sliderFromBw(currentBw);

      presetButtons.forEach(btn => {
        const matches = btn.getAttribute('data-preset') === presetKey;
        btn.classList.toggle('is-active', matches);
        btn.setAttribute('aria-pressed', matches ? 'true' : 'false');
      });

      update();
    }

    // Event Listeners: Sliders
    if (peakSlider) {
      peakSlider.addEventListener('input', e => {
        currentPeak = peakFromSlider(parseFloat(e.target.value));
        activePreset = null;
        presetButtons.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        update();
      });
    }

    if (bwSlider) {
      bwSlider.addEventListener('input', e => {
        currentBw = bwFromSlider(parseFloat(e.target.value));
        activePreset = null;
        presetButtons.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        update();
      });
    }

    // Event Listeners: Preset Buttons
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        setPreset(key);
      });
    });

    // Initialize with MI300X preset
    setPreset('mi300x');
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRooflineExplorer);
  } else {
    initRooflineExplorer();
  }
})();
