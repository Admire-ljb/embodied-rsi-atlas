'use strict';

const cards = Array.from(document.querySelectorAll('details.topic'));
const filterForm = document.querySelector('#filters');
const level = document.querySelector('#level');
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
      && (!level.value || card.dataset.level === level.value)
      && (!term || card.textContent.toLocaleLowerCase().includes(term));
    card.hidden = !allowed;
    if (allowed) matches++;
  }
  filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === track)));
  document.querySelector('#count').textContent = '显示 ' + matches + ' / ' + cards.length + ' 个课题';
  document.querySelector('#empty').hidden = matches !== 0;
}

function clearFilters() {
  track = '-1';
  level.value = '';
  search.value = '';
  refresh();
}

filterButtons.forEach(b => b.addEventListener('click', () => {
  track = b.dataset.filter;
  refresh();
}));
level.addEventListener('change', refresh);
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
  const lines = ['# ' + title, '', '## 研究问题', '', card.querySelector('.question').textContent, ''];
  card.querySelectorAll('dl div').forEach(row => {
    lines.push('## ' + row.querySelector('dt').textContent, '', row.querySelector('dd').textContent, '');
  });
  lines.push('## 开题时补充', '', '拟用的数据版本：', '', '负责人与协作者：', '', '预期不成立的条件：', '', '首轮复测日期：', '');
  const url = URL.createObjectURL(new Blob([lines.join('\n')], {type:'text/markdown;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = button.dataset.card + '-开题卡.md';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}));

// The bench is an illustrative drawing. Values match bench-example.csv.
const canvas = document.querySelector('#bench-view');
const ctx = canvas.getContext('2d');
const frames = [
  {elbow:[265,89], wrist:[386,120], part:[386,169], text:'帧 01 · 料盒净重 0 g'},
  {elbow:[293,95], wrist:[465,177], part:[465,232], text:'帧 02 · 秤先于接触采样 · 0 g'},
  {elbow:[270,69], wrist:[372,95], part:[465,248], text:'帧 03 · 料盒净重 24 g'}
];
function drawBench(index) {
  const f = frames[index];
  document.querySelector('#reading').textContent = f.text;
  document.querySelectorAll('[data-frame]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.frame) === index)));
  if (!ctx) return;
  const W=740, H=354;
  function path(points, color, fill, width=2, closed=false) {
    ctx.beginPath();
    points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    if (closed) ctx.closePath();
    if (fill) { ctx.fillStyle=fill; ctx.fill(); }
    if (color) { ctx.strokeStyle=color; ctx.lineWidth=width; ctx.stroke(); }
  }
  function circle(x,y,r,bg,fg) {
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=bg;ctx.fill();
    if(fg){ctx.lineWidth=2;ctx.strokeStyle=fg;ctx.stroke();}
  }
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#143b38';ctx.fillRect(0,0,W,H);
  for(let x=18;x<W;x+=26) for(let y=14;y<H;y+=26){ctx.fillStyle='#335550';ctx.fillRect(x,y,1.6,1.6);}
  ctx.lineJoin='round'; ctx.lineCap='round';
  path([[63,241],[281,155],[671,217],[466,323]],'#87ac9c','#234a43',1.5,true);
  path([[63,242],[63,250],[466,333],[466,323],[671,217],[671,226],[466,333]],'#76998b',null,1.2);
  for(let j=1;j<7;j++){let t=j/7;path([[63+218*t,241-86*t],[466+205*t,323-106*t]],'#385c51',null,1);}
  for(let j=1;j<11;j++){let t=j/11;path([[63+403*t,241+82*t],[281+390*t,155+62*t]],'#385c51',null,1);}
  path([[374,247],[456,209],[562,228],[482,274]],'#a7ba9f','#627e69',1.8,true);
  path([[374,247],[374,262],[482,288],[482,274],[562,228],[562,243],[482,288]],'#b2c3aa','#3c6051',1.6);
  path([[390,244],[455,217],[542,230],[481,263]],'#bad2aa','#34584b',1.3,true);
  path([[117,229],[180,202],[243,215],[182,244]],'#a9c7ac','#728d77',2,true);
  path([[117,229],[117,239],[182,255],[182,244],[243,215],[243,226],[182,255]],'#c0d4b6','#3c5f50',1.4);
  const base=[185,201]; const {elbow,wrist,part}=f;
  const arm=[base,elbow,wrist];
  path(arm,'#0d2826',null,32);path(arm,'#c1d7b9',null,26);path(arm,'#7da18c',null,12);
  for(const [x,y] of arm){circle(x,y,18,'#2d5044','#cfe0bf');circle(x,y,8,'#a1bfa5');}
  const [wx,wy]=wrist;path([[wx,wy+8],[wx,wy+28]],'#c9d8bc',null,9);
  path([[wx-14,wy+42],[wx-14,wy+29],[wx+14,wy+29],[wx+14,wy+42]],'#d8e4c2',null,4);
  const [px,py]=part;
  path([[px-15,py],[px,py-7],[px+15,py-3],[px,py+5]],'#ffcb91','#f1a262',1.5,true);
  path([[px-15,py],[px-15,py+12],[px,py+17],[px,py+5],[px+15,py-3],[px+15,py+9],[px,py+17]],'#fdc08b','#bf754a',1.3);
  ctx.font='15px Consolas, monospace';ctx.fillStyle='#c6decc';
  ctx.fillText('CAM 01',40,43);ctx.fillText('LOAD CELL',560,293);
  path([[108,40],[137,40],[156,62]],'#89ad9c',null,1);
  path([[552,287],[529,282],[516,269]],'#89ad9c',null,1);
}
document.querySelectorAll('[data-frame]').forEach(b => b.addEventListener('click',()=>drawBench(Number(b.dataset.frame))));
drawBench(0);

