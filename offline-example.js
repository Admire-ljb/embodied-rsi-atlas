'use strict';

const example = document.querySelector('#offline-example');
const casePicker = example.querySelector('select');
const steps = example.querySelector('ol');
const verdict = example.querySelector('output');
const caseNames = {
  normal: '正常读取',
  'unknown-dataset': '未知数据集',
  'duplicate-handoff': '重复交接'
};

function runExample(fixture, testCase) {
  const dataset = testCase.input_override?.dataset_id ?? fixture.task.dataset_id;
  const log = [];
  if (dataset !== fixture.task.dataset_id) {
    log.push('读取 ' + dataset + ' 时返回 dataset_not_found，汇总步骤未启动。');
    return { log, result: { status: 'failed', error_code: 'dataset_not_found', failed_step: 'read' } };
  }

  const readings = new Map(fixture.records.map(record => [record.record_id, record.reading]));
  const values = [...readings].map(([id, value]) => id + ' = ' + (value ?? '空'));
  log.push('读取 ' + dataset + ' 得到 ' + values.join('、') + '。');
  const deliveries = testCase.deliveries ?? [{ message_id: 'm1', refs: [...readings.keys()] }];
  const seen = new Set();
  const received = new Set();
  for (const message of deliveries) {
    if (seen.has(message.message_id)) {
      log.push('再次收到 ' + message.message_id + '，已按消息标识去重。');
      continue;
    }
    seen.add(message.message_id);
    message.refs.forEach(id => received.add(id));
    log.push('接收 ' + message.message_id + '，交接记录 ' + message.refs.join('、') + '。');
  }
  const missing = [...received].filter(id => readings.get(id) === null);
  log.push('汇总 ' + received.size + ' 条记录，缺失读数 ' + (missing.join('、') || '无') + '。');
  return {
    log,
    result: { status: 'completed', total: received.size, missing_ids: missing,
      delivery_count: deliveries.length, accepted_count: seen.size }
  };
}

async function initializeExample() {
  const response = await fetch('./module-acceptance-v1.json');
  if (!response.ok) throw new Error('fixture unavailable');
  const fixture = await response.json();
  for (const testCase of fixture.cases) {
    casePicker.add(new Option(caseNames[testCase.case_id], testCase.case_id));
  }
  function display() {
    const testCase = fixture.cases.find(item => item.case_id === casePicker.value);
    const { log, result } = runExample(fixture, testCase);
    steps.replaceChildren(...log.map(message => {
      const item = document.createElement('li');
      item.textContent = message;
      return item;
    }));
    const matched = Object.entries(testCase.expected).every(([key, value]) =>
      JSON.stringify(result[key]) === JSON.stringify(value));
    verdict.textContent = '任务状态 ' + result.status + ' · ' + (matched ? '符合样例预期' : '与样例预期有差异');
  }
  casePicker.addEventListener('change', display);
  example.querySelector('fieldset').hidden = false;
  display();
}

initializeExample().catch(() => {
  verdict.textContent = '未能载入验收样例。可通过下方链接查看原始记录和预期结果。';
});
