const FALLBACK_THRESHOLDS = {
  archiveCategory: 0.9,
  needsAction: 0.05,
  keepBulkBelow: 0.5,
  keepActionAbove: 0.5,
};

const state = {
  emails: [],
  results: new Map(),
  status: new Map(),
  errors: new Map(),
  selected: null,
  filter: 'all',
  running: false,
  model: 'gemini-3.5-flash-lite',
  thresholds: FALLBACK_THRESHOLDS,
  startedAt: null,
  elapsed: 0,
};

let follow = true;
let clock = null;

const listEl = document.getElementById('list');
const letterEl = document.getElementById('letter');
const verdictEl = document.getElementById('verdict');
const runBtn = document.getElementById('run');
const bannerEl = document.getElementById('banner');

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function fmt(n) {
  return Number(n).toFixed(2);
}

function formatElapsed(ms) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatCost(n) {
  return `$${Number(n || 0).toFixed(6)}`;
}

function identity(from) {
  const [local, domain] = from.split('@');
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
  return { name, domain, initials, address: from };
}

function titleCase(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function tickAlign(p) {
  if (p < 0.12) return 'start';
  if (p > 0.88) return 'end';
  return 'mid';
}

function pct(n) {
  const value = Math.max(0, Math.min(1, Number(n) || 0));
  return `${(value * 100).toFixed(1)}%`;
}

function friendlyError(message) {
  if (/free tier/i.test(message)) {
    return 'The gateway blocked this model for the current key. Trusted senders were still classified.';
  }
  return message;
}

function setBanner(message) {
  if (!message) {
    bannerEl.hidden = true;
    bannerEl.textContent = '';
    return;
  }
  bannerEl.hidden = false;
  bannerEl.textContent = message;
}

function counts() {
  const tally = { all: state.emails.length, keep: 0, archive: 0, review: 0 };
  for (const result of state.results.values()) {
    if (tally[result.decision] != null) tally[result.decision] += 1;
  }
  return tally;
}

function selectedEmail() {
  return state.emails.find((email) => email.id === state.selected) ?? null;
}

function narrative(result) {
  const t = state.thresholds;
  if (!result) {
    return 'This message has not been scored. Run triage and the decision lands here, with the scores that produced it.';
  }
  if (result.by === 'prefilter') {
    return 'Trusted sender. The prefilter keeps this message and never calls the model.';
  }
  if (result.bulk == null || result.action == null) return result.reason;

  if (result.decision === 'archive') {
    return `Bulk ${fmt(result.bulk)} clears ${fmt(t.archiveCategory)}, and action ${fmt(result.action)} stays under ${fmt(t.needsAction)}. Archived without a person.`;
  }

  if (result.decision === 'keep') {
    const lowBulk = result.bulk < t.keepBulkBelow;
    const highAction = result.action > t.keepActionAbove;
    if (lowBulk && highAction) {
      return `Bulk ${fmt(result.bulk)} is under ${fmt(t.keepBulkBelow)}, and action ${fmt(result.action)} is above ${fmt(t.keepActionAbove)}. It stays in the inbox.`;
    }
    if (lowBulk) {
      return `Bulk ${fmt(result.bulk)} is under ${fmt(t.keepBulkBelow)}, so it stays in the inbox.`;
    }
    return `Action ${fmt(result.action)} is above ${fmt(t.keepActionAbove)}, so it stays in the inbox.`;
  }

  return `Bulk ${fmt(result.bulk)} and action ${fmt(result.action)} sit between the keep and archive lines. A person reviews it.`;
}

function activeRule(result) {
  if (!result) return null;
  if (result.by === 'prefilter') return 'trusted';
  return result.decision;
}

function rulesHtml(active) {
  const t = state.thresholds;
  const items = [
    ['trusted', 'Trusted senders are kept before the model runs.'],
    ['archive', `Archive when bulk ≥ ${fmt(t.archiveCategory)} and action < ${fmt(t.needsAction)}.`],
    ['keep', `Keep when bulk < ${fmt(t.keepBulkBelow)} or action > ${fmt(t.keepActionAbove)}.`],
    ['review', 'Anything between those lines waits for a person.'],
  ];
  return items
    .map(
      ([id, text]) =>
        `<li class="${id === active ? 'is-match' : ''}">${esc(text)}</li>`
    )
    .join('');
}

function meter(kind, label, value, ticks, note) {
  const marks = ticks
    .map(
      (tick) =>
        `<i class="tick" style="left:${pct(tick)}"></i>`
    )
    .join('');
  const legend = ticks
    .map(
      (tick) =>
        `<span class="${tickAlign(tick)}" style="left:${pct(tick)}">${fmt(tick)}</span>`
    )
    .join('');

  return `
    <div class="meter ${kind}">
      <div class="meter-label">
        <span>${esc(label)}</span>
        <span class="mono">${fmt(value)}</span>
      </div>
      <div class="track-wrap">
        <div class="track"><span class="fill" style="--w:${pct(value)}"></span></div>
        ${marks}
      </div>
      <div class="legend">${legend}</div>
      <p class="meter-note">${esc(note)}</p>
    </div>
  `;
}

function probabilityList(entries, choice) {
  return `<ul class="cats">${entries
    .map(([name, value]) => {
      const chosen = choice != null && name === choice;
      return `
        <li class="${chosen ? 'is-choice' : ''}">
          <span>${esc(titleCase(name))}</span>
          <span class="bar"><i style="--w:${pct(value)}"></i></span>
          <span class="mono">${fmt(value)}</span>
        </li>
      `;
    })
    .join('')}</ul>`;
}

function scoresHtml(result) {
  if (!result || result.by === 'prefilter') return '';
  const t = state.thresholds;
  const answers = result.answers;
  let html = '<h3 class="block-title">Scores</h3>';
  html += meter(
    'bulk',
    'Bulk',
    result.bulk,
    [t.keepBulkBelow, t.archiveCategory],
    'Newsletter plus promotional. Archive only from the higher mark.'
  );
  html += meter(
    'action',
    'Needs action',
    result.action,
    [t.needsAction, t.keepActionAbove],
    'Archive only below the first mark. Keep above the second.'
  );

  const probs = answers?.category?.probabilities;
  if (probs) {
    const entries = Object.entries(probs).sort((a, b) => Number(b[1]) - Number(a[1]));
    html += `<h3 class="block-title">Category</h3>${probabilityList(entries, answers.category.choice)}`;
  } else if (answers?.category?.choice) {
    html += `<h3 class="block-title">Category</h3><p class="reason">${esc(titleCase(answers.category.choice))}</p>`;
  }

  const urgency = answers?.urgency;
  if (urgency) {
    const urgencyProbs = urgency.probabilities
      ? Object.entries(urgency.probabilities).sort((a, b) => Number(b[1]) - Number(a[1]))
      : [];
    html += '<h3 class="block-title">Urgency</h3>';
    if (Number.isFinite(Number(urgency.score))) {
      html += `<p class="reason">score ${fmt(urgency.score)}</p>`;
    }
    if (urgencyProbs.length) html += probabilityList(urgencyProbs, null);
  }

  return html;
}

function pipelineHtml(email) {
  const result = state.results.get(email.id);
  const status = state.status.get(email.id);

  if (!result && state.errors.has(email.id)) {
    return `
      <ol class="pipeline">
        <li class="done">
          <span class="step">1</span>
          <div><strong>Prefilter</strong><span>No short-circuit. Passed to the model.</span></div>
        </li>
        <li>
          <span class="step">2</span>
          <div><strong>Model</strong><span>The call failed.</span></div>
        </li>
      </ol>
    `;
  }

  if (!result && status === 'classifying') {
    return `
      <ol class="pipeline">
        <li>
          <span class="step">1</span>
          <div><strong>Prefilter</strong><span>Checking the sender, then handing off if needed.</span></div>
        </li>
        <li>
          <span class="step">2</span>
          <div><strong>Model</strong><span>Scoring subject and body…</span></div>
        </li>
      </ol>
    `;
  }

  if (!result) {
    return `
      <ol class="pipeline">
        <li>
          <span class="step">1</span>
          <div><strong>Prefilter</strong><span>Trusted senders stop here.</span></div>
        </li>
        <li>
          <span class="step">2</span>
          <div><strong>Model</strong><span>Scores everything else.</span></div>
        </li>
      </ol>
    `;
  }

  if (result.by === 'prefilter') {
    return `
      <ol class="pipeline">
        <li class="done">
          <span class="step">1</span>
          <div><strong>Prefilter</strong><span>Trusted sender · kept in ${result.ms} ms</span></div>
        </li>
        <li class="skipped">
          <span class="step">2</span>
          <div><strong>Model</strong><span>Not called</span></div>
        </li>
      </ol>
    `;
  }

  const tokens = result.inputTokens ? ` · ${result.inputTokens.toLocaleString()} tokens` : '';
  return `
    <ol class="pipeline">
      <li class="done">
        <span class="step">1</span>
        <div><strong>Prefilter</strong><span>No short-circuit. Passed to the model.</span></div>
      </li>
      <li class="done">
        <span class="step">2</span>
        <div><strong>Model</strong><span>${result.ms.toLocaleString()} ms${tokens}</span></div>
      </li>
    </ol>
  `;
}

function calloutHtml(email, result) {
  if (!result || !/ignore prior instructions/i.test(email.snippet)) return '';
  return `
    <div class="callout">
      <strong>Untrusted content</strong>
      The body tells the model to ignore its instructions and mark this as personal and urgent. That text is evidence, not a command. The decision comes from the scores.
    </div>
  `;
}

function renderList() {
  const top = listEl.scrollTop;
  const visible = state.emails.filter((email) => {
    if (state.filter === 'all') return true;
    return state.results.get(email.id)?.decision === state.filter;
  });

  if (!visible.length) {
    const label = state.filter === 'all' ? 'inbox' : state.filter;
    listEl.innerHTML = `<p class="empty">Nothing in ${esc(label)} yet.</p>`;
    return;
  }

  listEl.innerHTML = visible
    .map((email) => {
      const who = identity(email.from);
      const result = state.results.get(email.id);
      const status = state.status.get(email.id);
      const failed = state.errors.has(email.id);
      const decision = result?.decision ?? '';
      let meta = 'Waiting';
      let metaClass = '';
      if (status === 'classifying') {
        meta = 'Scoring';
      } else if (failed) {
        meta = 'Failed';
        metaClass = 'error';
      } else if (result) {
        meta = `${titleCase(result.decision)} · ${result.ms.toLocaleString()} ms`;
        metaClass = result.decision;
      }

      return `
        <button type="button" class="row ${decision ? `is-${decision}` : ''} ${status === 'classifying' ? 'is-classifying' : ''} ${email.id === state.selected ? 'is-selected' : ''}" data-id="${esc(email.id)}">
          <span class="avatar" aria-hidden="true">${esc(who.initials)}</span>
          <span class="row-copy">
            <span class="row-top">
              <span class="who">${esc(who.name)}</span>
              <span class="meta ${metaClass}">${esc(meta)}</span>
            </span>
            <span class="subject">${esc(email.subject)}</span>
          </span>
        </button>
      `;
    })
    .join('');
  listEl.scrollTop = top;
}

function renderLetter() {
  const email = selectedEmail();
  if (!email) {
    letterEl.innerHTML = '<p class="empty">Select a message.</p>';
    return;
  }

  const who = identity(email.from);
  const result = state.results.get(email.id);
  const tags = [];
  if (email.hasUnsubscribeHeader) tags.push('List-Unsubscribe');
  if (email.precedenceBulk) tags.push('Precedence: bulk');
  if (!tags.length) tags.push('No bulk headers');
  if (result?.by) {
    tags.push(result.by === 'prefilter' ? 'Stopped at prefilter' : 'Scored by model');
  }

  letterEl.innerHTML = `
    <p class="kicker">${esc(who.domain)}</p>
    <h2>${esc(email.subject)}</h2>
    <div class="from-row">
      <span class="avatar" aria-hidden="true">${esc(who.initials)}</span>
      <div>
        <div class="from-name">${esc(who.name)}</div>
        <div class="from-address">${esc(who.address)}</div>
      </div>
    </div>
    <p class="snippet">${esc(email.snippet)}</p>
    <div class="tags">${tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
  `;
}

function renderVerdict() {
  const email = selectedEmail();
  if (!email) {
    verdictEl.innerHTML = '';
    return;
  }

  const result = state.results.get(email.id);
  const status = state.status.get(email.id);
  const error = state.errors.get(email.id);
  let word = 'Waiting';
  let wordClass = 'pending';
  let copy = narrative(null);

  if (error) {
    word = 'Failed';
    wordClass = 'error';
    copy = friendlyError(error);
  } else if (status === 'classifying' && !result) {
    word = 'Scoring';
    wordClass = 'pending';
    copy = 'The prefilter runs first. If this sender is not trusted, the model scores the subject and body.';
  } else if (result) {
    word = titleCase(result.decision);
    wordClass = result.decision;
    copy = narrative(result);
  }

  const reason = result
    ? `<p class="reason">${esc(result.by)} · ${esc(result.reason)}</p>`
    : '';

  verdictEl.innerHTML = `
    <p class="eyebrow">Decision</p>
    <h2 class="decision-word ${wordClass}">${esc(word)}</h2>
    <p class="narrative">${esc(copy)}</p>
    ${reason}
    ${pipelineHtml(email)}
    ${scoresHtml(result)}
    ${calloutHtml(email, result)}
    <div class="rules">
      <p class="eyebrow">Rules</p>
      <ul>${rulesHtml(activeRule(result))}</ul>
    </div>
  `;
}

function renderChrome() {
  const tally = counts();
  for (const key of ['all', 'keep', 'archive', 'review']) {
    document.getElementById(`count-${key}`).textContent = String(tally[key]);
  }

  document.getElementById('model').textContent = state.model;

  const done = state.results.size + state.errors.size;
  const total = state.emails.length;
  const progress = document.getElementById('progress');
  if (!total) {
    progress.textContent = 'Loading inbox…';
  } else if (state.running) {
    const current = state.emails.find((email) => state.status.get(email.id) === 'classifying');
    const who = current ? identity(current.from).name : '';
    progress.textContent = who
      ? `Scoring ${Math.min(done + 1, total)} of ${total} · ${who}`
      : `Scoring ${Math.min(done + 1, total)} of ${total}`;
  } else if (done) {
    progress.textContent = state.errors.size
      ? `${state.results.size} classified · ${state.errors.size} failed`
      : `${done} classified`;
  } else {
    progress.textContent = `${total} in the inbox`;
  }

  runBtn.disabled = state.running || !total;
  runBtn.textContent = state.running ? 'Classifying…' : done ? 'Run again' : 'Triage inbox';

  let calls = 0;
  let tokens = 0;
  let cost = 0;
  for (const result of state.results.values()) {
    if (result.by !== 'prefilter') calls += 1;
    tokens += result.inputTokens || 0;
    cost += result.cost || 0;
  }

  const hasRun = state.running || done > 0;
  document.getElementById('stat-calls').textContent = !hasRun
    ? '—'
    : state.errors.size
      ? `${calls} / ${total} · ${state.errors.size} failed`
      : `${calls} / ${total}`;
  document.getElementById('stat-tokens').textContent = hasRun ? tokens.toLocaleString() : '—';
  document.getElementById('stat-cost').textContent = hasRun ? formatCost(cost) : '—';
  document.getElementById('stat-time').textContent = hasRun ? formatElapsed(state.elapsed) : '—';
}

function render() {
  renderList();
  renderLetter();
  renderVerdict();
  renderChrome();
}

function parseEvent(block) {
  let event = 'message';
  const data = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trim());
  }
  if (!data.length) return null;
  return { event, data: JSON.parse(data.join('\n')) };
}

async function runTriage() {
  if (state.running) return;
  setBanner('');
  state.running = true;
  follow = true;
  state.results.clear();
  state.status.clear();
  state.errors.clear();
  state.startedAt = performance.now();
  state.elapsed = 0;
  clock = setInterval(() => {
    state.elapsed = performance.now() - state.startedAt;
    renderChrome();
  }, 200);
  render();

  try {
    const response = await fetch(`${window.TRIAGE_API}/api/triage`, { method: 'POST' });
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || !type.includes('text/event-stream')) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Triage failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        if (!block.trim()) continue;
        const message = parseEvent(block);
        if (!message) continue;
        applyEvent(message.event, message.data);
        render();
      }
    }
  } catch (err) {
    setBanner(err instanceof Error ? err.message : 'Triage failed');
  } finally {
    state.running = false;
    state.elapsed = state.startedAt ? performance.now() - state.startedAt : 0;
    clearInterval(clock);
    for (const [id, status] of state.status) {
      if (status === 'classifying') state.status.delete(id);
    }
    render();
  }
}

function applyEvent(event, data) {
  if (event === 'start') {
    if (data.model) state.model = data.model;
    if (data.thresholds) state.thresholds = data.thresholds;
    return;
  }

  if (event === 'status') {
    state.status.set(data.id, data.state);
    if (follow && data.state === 'classifying') state.selected = data.id;
    return;
  }

  if (event === 'result') {
    state.status.set(data.id, 'done');
    state.results.set(data.id, data);
    if (follow) state.selected = data.id;
    return;
  }

  if (event === 'error') {
    state.status.set(data.id, 'error');
    state.errors.set(data.id, data.message);
    if (/free tier/i.test(data.message)) {
      setBanner(friendlyError(data.message));
    }
    if (follow) state.selected = data.id;
  }
}

document.getElementById('filters').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  state.filter = button.dataset.filter;
  for (const item of document.querySelectorAll('#filters button')) {
    const on = item === button;
    item.classList.toggle('is-on', on);
    item.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  renderList();
});

listEl.addEventListener('click', (event) => {
  const row = event.target.closest('.row');
  if (!row) return;
  follow = false;
  state.selected = row.dataset.id;
  render();
});

runBtn.addEventListener('click', () => {
  runTriage();
});

const inbox = await fetch(`${window.TRIAGE_API}/api/emails`);
if (!inbox.ok) {
  setBanner('Could not load the inbox.');
} else {
  const payload = await inbox.json();
  state.emails = payload.emails;
  state.model = payload.model || state.model;
  state.thresholds = payload.thresholds || state.thresholds;
  state.selected = state.emails[0]?.id ?? null;
  render();
}
