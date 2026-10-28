import { initialState, evaluate, money } from '../csv-model.ts';
import type { ComparisonRow, EvaluationSuccess } from '../csv-model.ts';
export function mountComparison(root: HTMLElement) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const element = root.querySelector<T>('#' + id);
    if (!element) throw new Error(`Missing comparison element: ${id}`);
    return element;
  };
  const events = new AbortController();
  const options = { signal: events.signal };
  let state = initialState();
  const amount = $<HTMLInputElement>('amount'),
    tolerance = $<HTMLInputElement>('tolerance');
  const scenarios = [
    ...root.querySelectorAll<HTMLButtonElement>('[data-scenario]'),
  ];
  function tableRows(rows: ComparisonRow[], result: EvaluationSuccess) {
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const tr = document.createElement('tr');
      let marker = '';
      if (result.problems.includes(row.sku)) {
        tr.className = 'row-problem';
        marker = ' !';
      } else if (result.changed.includes(row.sku)) {
        tr.className = 'row-changed';
        marker = ' ↗';
      } else if (state.scenario !== 'change' || state.amount !== '920')
        tr.className = 'row-matched';
      for (const [index, value] of [
        row.sku,
        row.item,
        money(row.cents) + marker,
      ].entries()) {
        const td = document.createElement('td');
        td.textContent = value;
        if (marker && index === 2)
          td.setAttribute(
            'aria-label',
            `${money(row.cents)} rupees, ${marker.includes('!') ? 'duplicate key' : 'changed'}`,
          );
        tr.append(td);
      }
      fragment.append(tr);
    }
    return fragment;
  }
  function render() {
    const result = evaluate(state);
    const isChange = state.scenario === 'change';
    amount.disabled = !isChange;
    tolerance.disabled = !isChange;
    $('tolerance-value').textContent = '₹' + state.tolerance;
    for (const button of scenarios) {
      const active = button.dataset.scenario === state.scenario;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    $('input-error').textContent = result.error || '';
    amount.setAttribute('aria-invalid', result.error ? 'true' : 'false');
    amount.setAttribute('aria-describedby', 'input-error');
    if (result.error !== undefined) {
      $('comparison-result-title').textContent = 'Let’s check that amount';
      $('result-description').textContent =
        'The tables still show your last valid comparison. Enter a valid amount to update them.';
      $('result-icon').dataset.icon = 'problem';
      $('result-badge').textContent = 'Needs input';
      $('demo-result').className = 'demo-result problem';
      $('demo-tip').textContent =
        'For example, try 920 or 850.01. Negative values and more than two decimal places are outside this demo.';
      return;
    }
    $('after-rows').replaceChildren(tableRows(result.after, result));
    const problem = result.problems.length > 0,
      changed = result.changed.length > 0;
    $('demo-result').className =
      'demo-result ' + (problem ? 'problem' : changed ? '' : 'success');
    $('result-icon').dataset.icon = problem
      ? 'problem'
      : changed
        ? 'changed'
        : 'clear';
    $('result-badge').textContent = result.unchanged.length + ' unchanged';
    if (problem) {
      $('comparison-result-title').textContent =
        '1 ambiguous key. No guessing.';
      $('result-description').textContent =
        'SKU 002 appears twice in today’s file. Both rows are flagged for review, rather than matched arbitrarily.';
      $('demo-tip').textContent =
        'The detail that matters → A duplicate is a problem to resolve, not a new or changed record.';
    } else if (state.scenario === 'reorder') {
      $('comparison-result-title').textContent = 'Same records. Zero changes.';
      $('result-description').textContent =
        'The row order moved, but every SKU still matches. Identity matters more than position.';
      $('demo-tip').textContent =
        'Try this → Switch to “A price changed” to edit an amount and experiment with tolerance.';
    } else if (changed) {
      const changedRow = result.after.find((row) => row.sku === '002');
      if (!changedRow) throw new Error('Comparison result is missing SKU 002');
      $('comparison-result-title').textContent = '1 changed record';
      $('result-description').textContent =
        `SKU 002 went from ₹850.00 to ₹${money(changedRow.cents)}. That’s a ₹${money(result.difference)} difference.`;
      $('demo-tip').textContent =
        result.difference <= 10000
          ? `Try this → Move the tolerance to ₹${Math.ceil(result.difference / 100)}. The difference falls within your rule.`
          : 'Try this → Set the new amount to ₹920, then move tolerance to ₹70 to see a difference accepted.';
    } else {
      $('comparison-result-title').textContent =
        result.difference === 0
          ? 'An exact match. All clear.'
          : 'Within your rules. All clear.';
      $('result-description').textContent =
        result.difference === 0
          ? 'Both files have the same records and amounts. There’s nothing to review.'
          : `The ₹${money(result.difference)} difference is within your ₹${state.tolerance} tolerance. All 3 records are treated as unchanged.`;
      $('demo-tip').textContent =
        'Your rule, applied consistently → The full tool lets you save these choices as a reusable profile.';
    }
  }
  for (const button of scenarios)
    button.addEventListener(
      'click',
      () => {
        const scenario = button.dataset.scenario;
        if (
          scenario !== 'change' &&
          scenario !== 'reorder' &&
          scenario !== 'duplicate'
        )
          throw new Error(`Unknown comparison scenario: ${scenario}`);
        state.scenario = scenario;
        render();
      },
      options,
    );
  amount.addEventListener(
    'input',
    () => {
      state.amount = amount.value;
      render();
    },
    options,
  );
  tolerance.addEventListener(
    'input',
    () => {
      state.tolerance = Number(tolerance.value);
      render();
    },
    options,
  );
  $('reset').addEventListener(
    'click',
    () => {
      state = initialState();
      amount.value = state.amount;
      tolerance.value = String(state.tolerance);
      render();
    },
    options,
  );
  render();
  return () => events.abort();
}
