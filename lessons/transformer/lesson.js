/**
 * Lesson-specific interactive scripts for "The Transformer, from Scratch"
 * Pure vanilla JavaScript - no external dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAttentionDemo();
});

function initAttentionDemo() {
  const container = document.querySelector('.attention-demo');
  if (!container) return;

  const barKept = container.querySelector('[data-bar="kept"]');
  const barMangoes = container.querySelector('[data-bar="mangoes"]');
  const barFridge = container.querySelector('[data-bar="fridge"]');

  const valKept = container.querySelector('[data-val="kept"]');
  const valMangoes = container.querySelector('[data-val="mangoes"]');
  const valFridge = container.querySelector('[data-val="fridge"]');

  const resultBox = container.querySelector('.attention-demo__result');
  const buttons = container.querySelectorAll('[data-demo-mode]');

  const modes = {
    they: {
      kept: 10,
      mangoes: 72,
      fridge: 18,
      blend: '[0.28, 1.62] (leans 72% towards mangoes [0, 2])',
      desc: 'The query word <strong>"they"</strong> looks back across all prior words. The key for <em>mangoes</em> matches best with the pronoun query, so 72% of the content comes from mangoes. After this step, "they" carries <em>the ripe mangoes</em> inside it.'
    },
    ripe: {
      kept: 4,
      mangoes: 86,
      fridge: 10,
      blend: '[0.14, 1.82] (almost pure mangoes content)',
      desc: 'The adjective <strong>"ripe"</strong> primarily needs to know what was ripe. The attention weight concentrates 86% onto <em>mangoes</em> and largely ignores <em>fridge</em> and <em>kept</em>.'
    },
    fridge: {
      kept: 68,
      mangoes: 22,
      fridge: 10,
      blend: '[0.78, 0.64] (tied to the action of keeping)',
      desc: 'The location noun <strong>"fridge"</strong> looks at the action verb <em>kept</em> (68%), cementing where the items were placed.'
    }
  };

  function updateMode(modeKey) {
    const data = modes[modeKey];
    if (!data) return;

    // Update bars
    if (barKept) barKept.style.width = data.kept + '%';
    if (barMangoes) barMangoes.style.width = data.mangoes + '%';
    if (barFridge) barFridge.style.width = data.fridge + '%';

    // Update values
    if (valKept) valKept.textContent = data.kept + '%';
    if (valMangoes) valMangoes.textContent = data.mangoes + '%';
    if (valFridge) valFridge.textContent = data.fridge + '%';

    // Update result description
    if (resultBox) {
      resultBox.innerHTML = `<strong>Blended Content Vector:</strong> <code>${data.blend}</code><br>${data.desc}`;
    }

    // Update active button state
    buttons.forEach(btn => {
      const isActive = btn.getAttribute('data-demo-mode') === modeKey;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-demo-mode');
      updateMode(mode);
    });
  });

  // Initial state is "they"
  updateMode('they');
}
