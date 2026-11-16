/**
 * FROM ZERO — lessons/harness/lesson.js
 * Scoped script for the Harness lesson interactive mini-harness simulator.
 * Reproduces provided/code/mini_harness.py in pure vanilla JavaScript.
 */

(function () {
  'use strict';

  function initMiniHarness() {
    const container = document.querySelector('[data-mini-harness]');
    if (!container) return;

    // UI elements
    const planRun1Btn = container.querySelector('[data-plan="run1"]');
    const planRun2Btn = container.querySelector('[data-plan="run2"]');
    const brakeToggle = container.querySelector('[data-brake-toggle]');
    const brakeStatusText = container.querySelector('[data-brake-status]');
    const stepBtn = container.querySelector('[data-step-btn]');
    const runAllBtn = container.querySelector('[data-run-all-btn]');
    const resetBtn = container.querySelector('[data-reset-btn]');
    const terminalBody = container.querySelector('[data-terminal-body]');
    const liveRegion = container.querySelector('[data-live-region]');

    // FS indicators
    const calcStatus = container.querySelector('[data-fs-calc]');
    const testStatus = container.querySelector('[data-fs-test]');
    const preciousStatus = container.querySelector('[data-fs-precious]');
    const preciousContainer = container.querySelector('[data-fs-item-precious]');

    // Simulator State
    let currentPlanName = 'run1';
    let brakeEnabled = true;
    let currentTurn = 0;
    let isFinished = false;

    // Plans exactly matching mini_harness.py
    const PLANS = {
      run1: [
        {
          tool: 'bash',
          args: { command: 'python3 test.py' },
          exec: (brake) => ({
            output: 'Traceback (most recent call last):\n  AssertionError: expected 4, got 3.0',
            fsUpdate: () => {
              if (calcStatus) { calcStatus.textContent = 'Buggy'; calcStatus.className = 'mini-fs__status status--fail'; }
              if (testStatus) { testStatus.textContent = 'FAIL'; testStatus.className = 'mini-fs__status status--fail'; }
            }
          })
        },
        {
          tool: 'write',
          args: { path: 'calc.py', text: 'def average(n): return sum(n)/len(n)' },
          exec: (brake) => ({
            output: 'written',
            fsUpdate: () => {
              if (calcStatus) { calcStatus.textContent = 'Fixed'; calcStatus.className = 'mini-fs__status status--pass'; }
            }
          })
        },
        {
          tool: 'bash',
          args: { command: 'python3 test.py' },
          exec: (brake) => ({
            output: 'PASS',
            fsUpdate: () => {
              if (testStatus) { testStatus.textContent = 'PASS'; testStatus.className = 'mini-fs__status status--pass'; }
            }
          })
        }
      ],
      run2: [
        {
          tool: 'bash',
          args: { command: 'rm -rf precious' },
          exec: (brake) => {
            if (brake) {
              return {
                output: 'BLOCKED by harness: this command needs human approval.',
                isBlocked: true,
                fsUpdate: () => {
                  if (preciousStatus) {
                    preciousStatus.textContent = 'Protected';
                    preciousStatus.className = 'mini-fs__status status--intact';
                  }
                }
              };
            } else {
              return {
                output: '(no output)',
                isBlocked: false,
                fsUpdate: () => {
                  if (preciousStatus) {
                    preciousStatus.textContent = 'Deleted!';
                    preciousStatus.className = 'mini-fs__status status--deleted';
                  }
                }
              };
            }
          }
        }
      ]
    };

    function resetSimulation() {
      currentTurn = 0;
      isFinished = false;
      terminalBody.innerHTML = '';
      stepBtn.disabled = false;
      runAllBtn.disabled = false;

      // Reset Filesystem Status Badges
      if (currentPlanName === 'run1') {
        if (preciousContainer) preciousContainer.style.display = 'none';
        if (calcStatus) { calcStatus.textContent = 'Buggy'; calcStatus.className = 'mini-fs__status status--fail'; }
        if (testStatus) { testStatus.textContent = 'Untested'; testStatus.className = 'mini-fs__status'; }
        appendLogHeader('RUN 1: Fix a bug (calc.py)', 'Plan: test -> write fix -> test');
      } else {
        if (preciousContainer) preciousContainer.style.display = 'flex';
        if (preciousStatus) {
          preciousStatus.textContent = 'Intact (thesis)';
          preciousStatus.className = 'mini-fs__status status--intact';
        }
        appendLogHeader('RUN 2: A reckless model (rm -rf precious)', `Brake is currently ${brakeEnabled ? 'ON' : 'OFF'}`);
      }
    }

    function appendLogHeader(title, subtitle) {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = `<span class="log-turn">== ${escapeHtml(title)} ==</span><span class="log-result">${escapeHtml(subtitle)}</span>`;
      terminalBody.appendChild(div);
      scrollTerminal();
    }

    function executeStep() {
      if (isFinished) return;

      const plan = PLANS[currentPlanName];
      if (currentTurn < plan.length) {
        const step = plan[currentTurn];
        const res = step.exec(brakeEnabled);

        if (res.fsUpdate) res.fsUpdate();

        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const argsStr = JSON.stringify(step.args).replace(/"/g, "'");
        const actionHtml = `<span class="log-action">&gt; ${escapeHtml(step.tool)}(${escapeHtml(argsStr)})</span>`;

        let resultHtml = '';
        if (res.isBlocked) {
          resultHtml = `<span class="log-result log-result--blocked">&rarr; ${escapeHtml(res.output)}</span>`;
        } else if (res.output === 'PASS') {
          resultHtml = `<span class="log-result log-result--pass">&rarr; '${escapeHtml(res.output)}'</span>`;
        } else {
          resultHtml = `<span class="log-result">&rarr; '${escapeHtml(res.output)}'</span>`;
        }

        entry.innerHTML = `<span class="log-turn">turn ${currentTurn}:</span>${actionHtml}${resultHtml}`;
        terminalBody.appendChild(entry);

        if (liveRegion) {
          liveRegion.textContent = `Turn ${currentTurn}: ${step.tool} returned ${res.output}`;
        }

        currentTurn++;

        if (currentTurn >= plan.length) {
          finishSimulation();
        }
      } else {
        finishSimulation();
      }

      scrollTerminal();
    }

    function finishSimulation() {
      isFinished = true;
      stepBtn.disabled = true;
      runAllBtn.disabled = true;

      const entry = document.createElement('div');
      entry.className = 'log-entry log-done';

      if (currentPlanName === 'run1') {
        entry.innerHTML = `<span>turn ${currentTurn}: DONE &rarr; finished. Tests PASS!</span>`;
      } else {
        const folderExists = brakeEnabled ? 'True (thesis saved!)' : 'False (thesis lost!)';
        entry.innerHTML = `<span>turn ${currentTurn}: DONE &rarr; finished. precious folder exists? ${folderExists}</span>`;
      }

      terminalBody.appendChild(entry);
      if (liveRegion) {
        liveRegion.textContent = entry.textContent;
      }
      scrollTerminal();
    }

    function runAll() {
      while (!isFinished) {
        executeStep();
      }
    }

    function scrollTerminal() {
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // Wire Plan Selector Buttons
    if (planRun1Btn && planRun2Btn) {
      planRun1Btn.addEventListener('click', () => {
        if (currentPlanName === 'run1') return;
        currentPlanName = 'run1';
        planRun1Btn.classList.add('is-active');
        planRun1Btn.setAttribute('aria-pressed', 'true');
        planRun2Btn.classList.remove('is-active');
        planRun2Btn.setAttribute('aria-pressed', 'false');
        resetSimulation();
      });

      planRun2Btn.addEventListener('click', () => {
        if (currentPlanName === 'run2') return;
        currentPlanName = 'run2';
        planRun2Btn.classList.add('is-active');
        planRun2Btn.setAttribute('aria-pressed', 'true');
        planRun1Btn.classList.remove('is-active');
        planRun1Btn.setAttribute('aria-pressed', 'false');
        resetSimulation();
      });
    }

    // Wire Brake Toggle
    if (brakeToggle) {
      brakeToggle.addEventListener('click', () => {
        brakeEnabled = !brakeEnabled;
        updateBrakeUI();
        if (currentPlanName === 'run2') {
          resetSimulation();
        }
      });
    }

    function updateBrakeUI() {
      if (!brakeToggle) return;
      if (brakeEnabled) {
        brakeToggle.className = 'brake-toggle-btn is-on';
        brakeToggle.setAttribute('aria-pressed', 'true');
        brakeToggle.setAttribute('aria-label', 'Brake is ON. Click to turn brake OFF');
        if (brakeStatusText) brakeStatusText.textContent = 'ON';
      } else {
        brakeToggle.className = 'brake-toggle-btn is-off';
        brakeToggle.setAttribute('aria-pressed', 'false');
        brakeToggle.setAttribute('aria-label', 'Brake is OFF. Click to turn brake ON');
        if (brakeStatusText) brakeStatusText.textContent = 'OFF';
      }
    }

    // Wire Action Buttons
    if (stepBtn) stepBtn.addEventListener('click', executeStep);
    if (runAllBtn) runAllBtn.addEventListener('click', runAll);
    if (resetBtn) resetBtn.addEventListener('click', resetSimulation);

    // Initial setup
    updateBrakeUI();
    resetSimulation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMiniHarness);
  } else {
    initMiniHarness();
  }
})();
