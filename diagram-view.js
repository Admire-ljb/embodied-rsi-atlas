'use strict';

for (const view of document.querySelectorAll('.diagram-view')) {
  const tools = view.querySelector('.diagram-tools');
  const scroll = view.querySelector('.diagram-scroll');
  const stage = view.querySelector('.diagram-stage');
  const sheet = view.querySelector('.diagram-sheet');
  const amount = tools.querySelector('.zoom-amount');
  const hint = tools.querySelector('.pan-hint');
  let mode = 'auto';
  let scale = 1;
  let customScale = 1;
  const steps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  function render() {
    if (!sheet.offsetWidth || !scroll.clientWidth) return;
    const fit = Math.min(1, scroll.clientWidth / sheet.offsetWidth);
    // Keep automatic mode readable on phones. Explicit fit shows the whole diagram.
    if (mode === 'auto') scale = Math.max(0.85, fit);
    if (mode === 'fit') scale = fit;
    if (mode === 'original') scale = 1;
    if (mode === 'custom') scale = customScale;
    const width = Math.round(sheet.offsetWidth * scale);
    stage.style.width = width + 'px';
    stage.style.height = Math.ceil(sheet.offsetHeight * scale) + 'px';
    sheet.style.transform = 'scale(' + scale + ')';
    const percent = Math.round(scale * 100) + '%';
    if (amount.textContent !== percent) amount.textContent = percent;
    hint.hidden = width <= scroll.clientWidth + 1;
    tools.querySelector('[data-zoom="larger"]').disabled = scale >= steps.at(-1);
    tools.querySelector('[data-zoom="smaller"]').disabled = scale <= steps[0];
  }

  tools.addEventListener('click', event => {
    const choice = event.target.closest('button[data-zoom]');
    if (!choice) return;
    const action = choice.dataset.zoom;
    if (action === 'larger' || action === 'smaller') {
      customScale = action === 'larger' ? steps.find(value => value > scale) : steps.findLast(value => value < scale);
      mode = 'custom';
    } else {
      mode = action;
    }
    for (const button of tools.querySelectorAll('[aria-pressed]')) {
      button.setAttribute('aria-pressed', String(button.dataset.zoom === mode));
    }
    render();
  });

  tools.hidden = false;
  render();
  const resize = new ResizeObserver(render);
  resize.observe(scroll);
  resize.observe(sheet);
}
