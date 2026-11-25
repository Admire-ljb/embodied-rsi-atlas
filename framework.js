'use strict';

// Preserve links shared before the student map moved to its own page.
function followStudentBookmark() {
  const hash = window.location.hash;
  if (hash === '#topics' || hash === '#evidence' || hash.startsWith('#topic-')) {
    window.location.replace('./topics.html' + hash);
    return true;
  }
  const caseSections = ['#representation', '#measurement', '#generalization', '#roadmap', '#example'];
  if (document.body.dataset.page === 'core' && caseSections.includes(hash)) {
    window.location.replace('./fixed-wing.html' + hash);
    return true;
  }
  return false;
}

function assetKey(asset) {
  return asset.id + '@' + asset.version;
}

function assetAnchor(key) {
  return 'asset-' + key;
}

function assetRow(asset, registry) {
  const row = document.createElement('div');
  row.id = assetAnchor(assetKey(asset));

  const category = document.createElement('span');
  category.textContent = asset.kind + ' · v' + asset.version;
  const link = document.createElement('a');
  link.href = './' + asset.file;
  link.download = asset.download_name || asset.file.split('/').pop();
  link.textContent = asset.name + ' ↓';
  const description = document.createElement('p');
  description.textContent = asset.scope;
  row.append(category, link, description);

  if (asset.depends_on.length) {
    const dependencies = document.createElement('p');
    dependencies.className = 'dependency';
    dependencies.append('上游版本 ');
    asset.depends_on.forEach((key, index) => {
      if (index) dependencies.append('、');
      const upstream = document.createElement('a');
      upstream.href = '#' + assetAnchor(key);
      upstream.textContent = registry.get(key).name + ' v' + registry.get(key).version;
      dependencies.append(upstream);
    });
    row.append(dependencies);
  }
  return row;
}

function isLocalAsset(path) {
  return typeof path === 'string' && path.split('/').every(segment =>
    /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(segment)
  );
}

async function loadRegistry() {
  // Opening a local copy keeps the pre-rendered entries available without a server.
  if (!['http:', 'https:'].includes(window.location.protocol)) return;
  try {
    const response = await fetch('./research-assets.json');
    if (!response.ok) return;
    const data = await response.json();
    if (data.schema_version !== 1 || !Array.isArray(data.assets) || !data.assets.length) return;
    const registry = new Map(data.assets.map(asset => [assetKey(asset), asset]));
    if (registry.size !== data.assets.length) return;
    const complete = data.assets.every(asset =>
      ['id', 'version', 'name', 'kind', 'scope'].every(key => typeof asset[key] === 'string' && asset[key]) &&
      isLocalAsset(asset.file) && Array.isArray(asset.depends_on) &&
      asset.depends_on.every(key => registry.has(key))
    );
    if (!complete) return;

    const list = document.querySelector('.asset-list');
    const orderedAssets = document.body.dataset.page === 'core'
      ? [...data.assets].sort((a, b) => Number(Boolean(b.audience === 'core')) - Number(Boolean(a.audience === 'core')))
      : data.assets;
    list.replaceChildren(...orderedAssets.map(asset => assetRow(asset, registry)));
    if (window.location.hash.startsWith('#asset-')) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  } catch {
    // The static snapshot provides the initial downloads if the index is unavailable.
  }
}

window.addEventListener('hashchange', followStudentBookmark);
if (!followStudentBookmark()) loadRegistry();
