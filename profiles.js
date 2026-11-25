'use strict';

const profileFields = [
  [
    "entities",
    "具身体"
  ],
  [
    "environment",
    "环境与数据来源"
  ],
  [
    "time_basis",
    "时间语义"
  ],
  [
    "observations",
    "当时可见的观测"
  ],
  [
    "capabilities",
    "任务能力"
  ],
  [
    "feedback",
    "回执与后续观测"
  ],
  [
    "reference",
    "独立评价依据"
  ],
  [
    "metrics",
    "评价指标"
  ],
  [
    "first_artifact",
    "首项交付"
  ]
];

function showTaskProfile(profile) {
  document.querySelector('#profile-title').textContent = profile.title;
  document.querySelector('#profile-objective').textContent = profile.objective;
  document.querySelector('#profile-status').textContent = profile.status + ' · v' + profile.version;
  const records = profileFields.map(([field, name]) => {
    const record = document.createElement('div');
    const term = document.createElement('dt');
    const definition = document.createElement('dd');
    term.textContent = name;
    definition.textContent = profile[field];
    record.append(term, definition);
    return record;
  });
  document.querySelector('#profile-fields').replaceChildren(...records);
}

async function loadTaskProfiles() {
  if (!['http:', 'https:'].includes(window.location.protocol)) return;
  const select = document.querySelector('#profile-select');
  try {
    const response = await fetch('./task-profiles.json');
    if (!response.ok) return;
    const data = await response.json();
    const required = ['task_id', 'version', 'title', 'status', 'objective', ...profileFields.map(([field]) => field)];
    if (data.schema_version !== 1 || !Array.isArray(data.profiles) || !data.profiles.length) return;
    if (!data.profiles.every(profile => required.every(field => typeof profile[field] === 'string' && profile[field].trim()))) return;
    const profiles = new Map(data.profiles.map(profile => [profile.task_id, profile]));
    if (profiles.size !== data.profiles.length) return;

    select.replaceChildren(...data.profiles.map(profile => new Option(profile.title, profile.task_id)));
    select.addEventListener('change', () => showTaskProfile(profiles.get(select.value)));
    select.disabled = false;
    showTaskProfile(profiles.get(select.value));
  } catch {
    // The static first profile and the JSON download remain visible.
  }
}

loadTaskProfiles();
