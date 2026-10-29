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
      $('comparison-result-title').textContent = 'Enter a valid amount';
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
      $('comparison-result-title').textContent = '1 duplicate key';
      $('result-description').textContent =
        'SKU 002 appears twice in today’s file. Both rows are flagged for review, rather than matched arbitrarily.';
      $('demo-tip').textContent =
        'Resolve the duplicate before comparing this key. It is not counted as a new or changed record.';
    } else if (state.scenario === 'reorder') {
      $('comparison-result-title').textContent = 'No changed records';
      $('result-description').textContent =
        'The rows are in a different order, but every SKU and amount still matches.';
      $('demo-tip').textContent =
        'Choose “A price changed” to edit an amount and try a tolerance.';
    } else if (changed) {
      const changedRow = result.after.find((row) => row.sku === '002');
      if (!changedRow) throw new Error('Comparison result is missing SKU 002');
      $('comparison-result-title').textContent = '1 changed record';
      $('result-description').textContent =
        `SKU 002 went from ₹850.00 to ₹${money(changedRow.cents)}. That’s a ₹${money(result.difference)} difference.`;
      $('demo-tip').textContent =
        result.difference <= 10000
          ? `Set the tolerance to ₹${Math.ceil(result.difference / 100)} to count this difference as unchanged.`
          : 'Set the amount to ₹920 and the tolerance to ₹70 to count the difference as unchanged.';
    } else {
      $('comparison-result-title').textContent =
        result.difference === 0
          ? 'All 3 records match'
          : 'All 3 records within tolerance';
      $('result-description').textContent =
        result.difference === 0
          ? 'Both files have the same records and amounts. There’s nothing to review.'
          : `The ₹${money(result.difference)} difference is within your ₹${state.tolerance} tolerance. All 3 records are treated as unchanged.`;
      $('demo-tip').textContent =
        'The full tool lets you save comparison rules in a reusable profile.';
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
