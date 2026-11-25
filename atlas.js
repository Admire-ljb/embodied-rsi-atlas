'use strict';

const cards = Array.from(document.querySelectorAll('details.topic'));
const filterForm = document.querySelector('#filters');
const search = document.querySelector('#search');
const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
let track = '-1';
filterForm.hidden = false;
filterForm.addEventListener('submit', event => event.preventDefault());

function refresh() {
  const term = search.value.trim().toLocaleLowerCase();
  let matches = 0;
  for (const card of cards) {
    const allowed = (track === '-1' || card.dataset.track === track)
      && (!term || card.textContent.toLocaleLowerCase().includes(term));
    card.hidden = !allowed;
    if (allowed) matches++;
  }
  filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === track)));
  for (const group of document.querySelectorAll('.topic-group')) {
    group.hidden = !group.querySelector('.topic:not([hidden])');
  }
  document.querySelector('#count').textContent = '显示 ' + matches + ' / ' + cards.length + ' 个研究点';
  document.querySelector('#empty').hidden = matches !== 0;
}

function clearFilters() {
  track = '-1';
  search.value = '';
  refresh();
}

filterButtons.forEach(b => b.addEventListener('click', () => {
  track = b.dataset.filter;
  refresh();
}));
search.addEventListener('input', refresh);
document.querySelector('#reset').addEventListener('click', clearFilters);
refresh();

function revealTopic(hash) {
  if (!hash.startsWith('#topic-')) return;
  const card = document.getElementById(hash.slice(1));
  if (!card || !cards.includes(card)) return;
  if (card.hidden) clearFilters();
  card.open = true;
  requestAnimationFrame(() => card.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange', () => revealTopic(location.hash));
document.querySelectorAll('a[href^="#topic-"]').forEach(a => a.addEventListener('click', () => revealTopic(a.hash)));
revealTopic(location.hash);

document.querySelectorAll('[data-card]').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('details');
  const title = card.querySelector('strong').textContent;
  const direction = card.closest('.topic-group').querySelector('h2').textContent;
  const lines = ['# ' + title, '', direction, '', '## 研究问题', '', card.querySelector('.question').textContent, ''];
  card.querySelectorAll('dl div').forEach(row => {
    lines.push('## ' + row.querySelector('dt').textContent, '', row.querySelector('dd').textContent, '');
  });
  lines.push('## 对应模块与实验', '', card.querySelector('.topic-actions a').href, '');
  const url = URL.createObjectURL(new Blob([lines.join('\n')], {type:'text/markdown;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = title + '-研究说明.md';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}));

const metrics = {
  agreement: {
    title: '成员一致率',
    caption: '共享本局信息和错配信息时，一致率只差 1 个百分点。'
  },
  error: {
    title: '共同误判率',
    caption: '按全部对局计，共同误判分别占 12%、9% 和 29%。'
  },
  reward: {
    title: '平均团队收益',
    caption: '共享错配信息时，一致率达 81%，平均收益却只有 0.44。'
  }
};

const metricButtons = document.querySelectorAll('[data-metric]');
const plotRows = document.querySelectorAll('.plot-row');

function showMetric(key) {
  const metric = metrics[key];
  const isScore = key === 'reward';
  document.querySelector('#metric-title').textContent = metric.title;
  document.querySelector('#axis-label').textContent = isScore ? '0–1' : '0–100%';
  document.querySelector('#reading').textContent = metric.caption;
  for (const row of plotRows) {
    const value = Number(row.dataset[key]);
    row.querySelector('.plot-track i').style.width = (isScore ? value * 100 : value) + '%';
    row.querySelector('.plot-value').textContent = isScore ? value.toFixed(2) : value + '%';
  }
  for (const button of metricButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.metric === key));
  }
}

for (const button of metricButtons) {
  button.addEventListener('click', () => showMetric(button.dataset.metric));
}
