import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './icons';
import { mountComparison } from './comparison';
import type { ProjectHome } from '../content/types';
import './recon-demo.css';
// Initial state matches csv-model's initialState(); comparison.ts updates these ids in place.
const before = [
  ['001', 'Desk lamp', '1,250.00'],
  ['002', 'Notebook set', '850.00'],
  ['003', 'Planter', '640.00'],
] satisfies readonly [SampleRow, SampleRow, SampleRow];
type SampleRow = readonly [sku: string, item: string, amount: string];
function DataFile({
  title,
  state,
  caption,
  id,
  children,
}: {
  title: string;
  state: string;
  caption: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="data-file">
      <div className="file-title">
        <b>
          <Icon name="sheet" /> {title}
        </b>
        <span>{state}</span>
      </div>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">SKU</th>
            <th scope="col">Item</th>
            <th scope="col">Amount ₹</th>
          </tr>
        </thead>
        <tbody id={id}>{children}</tbody>
      </table>
    </div>
  );
}
function row([sku, item, amount]: SampleRow) {
  return (
    <tr key={sku}>
      <td>{sku}</td>
      <td>{item}</td>
      <td>{amount}</td>
    </tr>
  );
}
export default function ReconDemo({ home }: { home: ProjectHome }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (root.current) return mountComparison(root.current);
  }, []);
  return (
    <div className="recon-comparison" ref={root} id="comparison-demo">
      <div className="playground-shell">
        <aside className="demo-guide">
          <span className="demo-label">
            <span className="live-dot"></span> INTERACTIVE DEMO
          </span>
          <h3>Compare sample records.</h3>
          <p>
            Choose a scenario or edit an amount. The result updates using SKU as
            the record key.
          </p>
          <ol className="demo-steps">
            <li>
              <span>1</span>Choose a scenario
            </li>
            <li>
              <span>2</span>Set the tolerance
            </li>
            <li>
              <span>3</span>Review the result
            </li>
          </ol>
          <div className="guide-note">
            <span>
              <Icon name="asterisk" />
            </span>
            <p>Uses three sample records. No upload or account needed.</p>
          </div>
          <span className="small-label">FICTIONAL DATA · SIMPLIFIED DEMO</span>
        </aside>
        <div className="demo-main">
          <noscript>
            <p className="noscript-note">
              Enable JavaScript to try the demo. The sample below shows one
              changed amount; the full project and all portfolio content are
              still available.
            </p>
          </noscript>
          <div className="demo-toolbar">
            <span className="step-title">
              <b>1</b> Choose a scenario
            </span>
            <button className="reset" id="reset">
              <Icon name="rotate-ccw" /> Reset demo
            </button>
          </div>
          <div
            aria-label="Comparison scenario"
            className="scenarios"
            role="group"
          >
            <button
              aria-pressed="true"
              className="scenario active"
              data-scenario="change"
            >
              <span>
                <Icon name="arrow-up-right" />
              </span>{' '}
              A price changed
            </button>
            <button
              aria-pressed="false"
              className="scenario"
              data-scenario="reorder"
            >
              <span>
                <Icon name="arrow-up-down" />
              </span>{' '}
              Rows shuffled
            </button>
            <button
              aria-pressed="false"
              className="scenario"
              data-scenario="duplicate"
            >
              <span>
                <Icon name="copy" />
              </span>{' '}
              A duplicate key
            </button>
          </div>
          <div className="table-pair">
            <DataFile
              title="yesterday.csv"
              state="BEFORE"
              caption="Original sample data"
              id="before-rows"
            >
              {before.map(row)}
            </DataFile>
            <DataFile
              title="today.xlsx"
              state="AFTER"
              caption="Latest sample data"
              id="after-rows"
            >
              {row(before[0])}
              <tr className="row-changed">
                <td>002</td>
                <td>Notebook set</td>
                <td>
                  920.00 <Icon name="arrow-up-right" />
                </td>
              </tr>
              {row(before[2])}
            </DataFile>
          </div>
          <div className="rules">
            <div>
              <span className="step-title">
                <b>2</b> Set the tolerance
              </span>
              <span className="key-note">
                MATCH BY <code>SKU</code>
              </span>
            </div>
            <div className="rule-controls">
              <label className="amount-field">
                New amount for SKU 002{' '}
                <span>
                  ₹{' '}
                  <input
                    id="amount"
                    inputMode="decimal"
                    max="100000"
                    min="0"
                    step="0.01"
                    type="number"
                    defaultValue="920"
                  />
                </span>
              </label>
              <label className="tolerance-field">
                Allow a difference up to{' '}
                <span>
                  <input
                    id="tolerance"
                    max="100"
                    min="0"
                    step="1"
                    type="range"
                    defaultValue="0"
                  />
                  <output htmlFor="tolerance" id="tolerance-value">
                    ₹0
                  </output>
                </span>
              </label>
            </div>
            <p className="input-error" id="input-error" role="status"></p>
          </div>
          <div
            aria-atomic="true"
            aria-live="polite"
            className="demo-result"
            id="demo-result"
            role="status"
          >
            <span
              className="big-result-icon"
              id="result-icon"
              data-icon="changed"
            >
              <Icon name="arrow-up-right" />
              <Icon name="circle-alert" />
              <Icon name="check" />
            </span>
            <div>
              <span className="small-label">3 / COMPARISON RESULT</span>
              <h5 id="comparison-result-title">1 changed record</h5>
              <p id="result-description">
                SKU 002 went from ₹850.00 to ₹920.00. That’s a ₹70.00
                difference.
              </p>
            </div>
            <span className="result-badge" id="result-badge">
              2 unchanged
            </span>
          </div>
          <p className="demo-tip" id="demo-tip">
            <b>Try this:</b> Set the tolerance to ₹70. The changed amount will
            count as unchanged.
          </p>
        </div>
      </div>
      <div className="comparison-benefits">
        {home.highlights.map(([title, body, icon]) => (
          <div key={title}>
            <h4>
              <Icon name={icon} />
              {title}
            </h4>
            <p>{body}</p>
          </div>
        ))}
      </div>
      <details className="comparison-notes">
        <summary>How the comparison works</summary>
        <div>
          {home.notes.map(([title, body]) => (
            <section key={title}>
              <h4>{title}</h4>
              <p>{body}</p>
            </section>
          ))}
        </div>
      </details>
    </div>
  );
}
