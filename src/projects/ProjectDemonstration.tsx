import { useState, type ReactNode } from 'react';
import {
  Check,
  GitBranch,
  RotateCcw,
  Wifi,
  WifiOff,
  Smartphone,
  Database,
  Phone,
  Monitor,
  Package,
  Layers,
  LockKeyhole,
  CircleAlert,
  FileText,
} from 'lucide-react';
import type {
  Project,
  ProjectDemonstration as Content,
} from '../content/types';

type Labels = (key: string) => string;
function Action({
  children,
  onClick,
  disabled = false,
  primary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={'demo-action' + (primary ? ' demo-primary' : '')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function Reset({ l, onClick }: { l: Labels; onClick: () => void }) {
  return (
    <button type="button" className="demo-reset" onClick={onClick}>
      <RotateCcw size={16} aria-hidden="true" />
      {l('reset')}
    </button>
  );
}
function Status({ children }: { children: ReactNode }) {
  return (
    <p
      className="demo-feedback"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {children}
    </p>
  );
}
function Recon({ l }: { l: Labels }) {
  const [candidate, setCandidate] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<'pending' | 'matched' | 'unmatched'>(
    'pending',
  );
  return (
    <>
      <div className="demo-toolbar">
        <span>{l('sample')}</span>
        <Reset
          l={l}
          onClick={() => {
            setCandidate(null);
            setOutcome('pending');
          }}
        />
      </div>
      <div className="recon-branch">
        <div className="recon-source">
          <FileText size={28} aria-hidden="true" />
          <span>{l('bank')}</span>
          <strong>{l('amount')}</strong>
        </div>
        <div className="recon-candidates">
          <span className="demo-label">
            <GitBranch size={20} aria-hidden="true" />
            {l('worker')}
          </span>
          {['candidateA', 'candidateB'].map((key) => (
            <button
              className="recon-candidate"
              key={key}
              type="button"
              aria-pressed={candidate === key}
              disabled={outcome !== 'pending'}
              onClick={() => setCandidate(key)}
            >
              <span>{l(key)}</span>
              <b>{l('amount')}</b>
              {candidate === key && <Check size={20} aria-hidden="true" />}
            </button>
          ))}
        </div>
        <div className="recon-review">
          <span className="demo-label">{l('reviewer')}</span>
          <h4>
            {l(
              outcome === 'pending'
                ? candidate
                  ? 'picked'
                  : 'review'
                : outcome,
            )}
          </h4>
          <div className="demo-actions">
            <Action
              primary
              disabled={!candidate || outcome !== 'pending'}
              onClick={() => setOutcome('matched')}
            >
              {l('confirm')}
            </Action>
            <Action
              disabled={outcome !== 'pending'}
              onClick={() => {
                setCandidate(null);
                setOutcome('unmatched');
              }}
            >
              {l('reject')}
            </Action>
          </div>
        </div>
      </div>
      <div className="recon-outcomes">
        <div data-active={outcome === 'matched'}>
          <Check size={20} aria-hidden="true" />
          <b>{l(outcome === 'matched' ? 'matched' : 'confirmPath')}</b>
          {outcome === 'matched' && (
            <span>
              {candidate && l(candidate)} · {l('leftover')}
            </span>
          )}
        </div>
        <div data-active={outcome === 'unmatched'}>
          <CircleAlert size={20} aria-hidden="true" />
          <b>{l(outcome === 'unmatched' ? 'outstanding' : 'unmatchedPath')}</b>
          {outcome === 'unmatched' && <span>{l('unmatched')}</span>}
        </div>
      </div>
      <Status>
        {l(
          outcome === 'matched'
            ? 'matchedNote'
            : outcome === 'unmatched'
              ? 'unmatchedNote'
              : candidate
                ? 'pickedNote'
                : 'idleNote',
        )}
      </Status>
      <p className="demo-footnote">{l('audit')}</p>
    </>
  );
}
function Operations({ l }: { l: Labels }) {
  const [online, setOnline] = useState(false),
    [pending, setPending] = useState(0),
    [accepted, setAccepted] = useState(0);
  const [notice, setNotice] = useState('idleNote');
  const [rejected, setRejected] = useState(false);
  return (
    <>
      <div className="demo-toolbar">
        <button
          className="demo-connection"
          type="button"
          aria-pressed={online}
          onClick={() => setOnline(!online)}
        >
          {online ? <Wifi size={20} /> : <WifiOff size={20} />}
          <b>{l(online ? 'online' : 'offline')}</b>
          <span>{l(online ? 'disconnect' : 'connect')}</span>
        </button>
        <Reset
          l={l}
          onClick={() => {
            setOnline(false);
            setPending(0);
            setAccepted(0);
            setRejected(false);
            setNotice('idleNote');
          }}
        />
      </div>
      <div className="ops-workspace">
        <div className="ops-device">
          <span className="demo-label">
            <Smartphone size={22} aria-hidden="true" />
            {l('device')}
          </span>
          <h4>{l('queue')}</h4>
          <div className="queue-slots" aria-label={l('queue')}>
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} data-filled={i < pending}>
                <FileText size={24} aria-hidden="true" />
                {i + 1}
              </span>
            ))}
          </div>
          <strong className="queue-count">
            {pending}{' '}
            <span>{l(pending === 1 ? 'pendingOne' : 'pendingMany')}</span>
          </strong>
          <p>{l(pending ? (online ? 'syncing' : 'queued') : 'empty')}</p>
          <Action
            primary
            disabled={pending >= 4}
            onClick={() => {
              setPending(pending + 1);
              setRejected(false);
              setNotice('queuedNote');
            }}
          >
            {l('save')}
          </Action>
        </div>
        <div className="ops-boundary">
          <span
            className={'connection-wire' + (online ? ' connected' : '')}
            aria-hidden="true"
          />
          <LockKeyhole size={24} aria-hidden="true" />
          <p>{l('queueHelp')}</p>
        </div>
        <div className="ops-server">
          <span className="demo-label">
            <Database size={22} aria-hidden="true" />
            {l('server')}
          </span>
          <strong className="queue-count">
            {accepted}{' '}
            <span>{l(accepted === 1 ? 'confirmedOne' : 'confirmedMany')}</span>
          </strong>
          <p>{l('serverHelp')}</p>
          <div className="demo-actions">
            <Action
              primary
              disabled={!online || !pending}
              onClick={() => {
                setPending(pending - 1);
                setAccepted(accepted + 1);
                setRejected(false);
                setNotice('acceptedNote');
              }}
            >
              {l('accept')}
            </Action>
            <Action
              disabled={!online || !pending}
              onClick={() => {
                setPending(pending - 1);
                setRejected(true);
                setNotice('rejectedNote');
              }}
            >
              {l('reject')}
            </Action>
          </div>
          {rejected && (
            <div className="ops-recovery">
              <RotateCcw size={20} aria-hidden="true" />
              <b>{l('rejected')}</b>
              <p>{l('recovery')}</p>
            </div>
          )}
        </div>
      </div>
      <Status>{l(notice)}</Status>
    </>
  );
}
function Calls({ l }: { l: Labels }) {
  const [invited, setInvited] = useState(false),
    [response, setResponse] = useState(false),
    [connected, setConnected] = useState(false);
  const [outcome, setOutcome] = useState<'answered' | 'unanswered' | null>(
      null,
    ),
    [notice, setNotice] = useState('idleNote');
  const correlated = invited && response;
  return (
    <>
      <div className="demo-toolbar">
        <span>{l('correlation')}</span>
        <Reset
          l={l}
          onClick={() => {
            setInvited(false);
            setResponse(false);
            setConnected(false);
            setOutcome(null);
            setNotice('idleNote');
          }}
        />
      </div>
      <div className="call-console">
        <div className="call-leg">
          <span className="demo-label">
            <Monitor size={22} aria-hidden="true" />
            {l('browser')}
          </span>
          <div className={'call-orbit' + (connected ? ' is-active' : '')}>
            <Phone size={36} aria-hidden="true" />
            <strong>
              {l(
                connected
                  ? 'connected'
                  : correlated
                    ? 'correlated'
                    : invited
                      ? 'buffered'
                      : 'empty',
              )}
            </strong>
          </div>
          <Action
            disabled={invited}
            onClick={() => {
              setInvited(true);
              setNotice(response ? 'linkedNote' : 'earlyNote');
            }}
          >
            {l('invite')}
          </Action>
          <Action
            disabled={!correlated || connected}
            onClick={() => {
              setConnected(true);
              setNotice('connectedNote');
            }}
          >
            {l('connect')}
          </Action>
        </div>
        <div className="call-record">
          <span className="demo-label">{l('record')}</span>
          <span className={'correlation-pill' + (response ? ' is-active' : '')}>
            {l(response ? 'known' : 'unknown')}
          </span>
          <h4>{l(outcome ?? 'waiting')}</h4>
          <p>{l('authorityNote')}</p>
        </div>
        <div className="call-leg">
          <span className="demo-label">
            <Phone size={22} aria-hidden="true" />
            {l('provider')}
          </span>
          <Action
            disabled={response}
            onClick={() => {
              setResponse(true);
              setNotice(invited ? 'linkedNote' : 'idleNote');
            }}
          >
            {l('response')}
          </Action>
          <div className="provider-outcomes">
            <Action
              disabled={!response || !!outcome}
              onClick={() => {
                setOutcome('answered');
                setNotice('answerNote');
              }}
            >
              {l('answer')}
            </Action>
            <Action
              disabled={!response || !!outcome}
              onClick={() => {
                setOutcome('unanswered');
                setNotice('answerNote');
              }}
            >
              {l('noAnswer')}
            </Action>
          </div>
        </div>
      </div>
      <Status>{l(notice)}</Status>
    </>
  );
}
function Library({ l }: { l: Labels }) {
  const [host, setHost] = useState<'operations' | 'customer'>('operations'),
    [selected, setSelected] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<string[]>([]),
    [notice, setNotice] = useState('emptyNote');
  return (
    <>
      <div className="demo-toolbar">
        <div className="demo-switch" aria-label={l('host')}>
          {(['operations', 'customer'] as const).map((h) => (
            <button
              type="button"
              key={h}
              aria-pressed={host === h}
              onClick={() => {
                setHost(h);
                setSelected(null);
                setNotice('emptyNote');
              }}
            >
              {l(h)}
            </button>
          ))}
        </div>
        <Reset
          l={l}
          onClick={() => {
            setHost('operations');
            setSelected(null);
            setDisabled([]);
            setNotice('emptyNote');
          }}
        />
      </div>
      <div className="library-layout">
        <aside className="host-inputs">
          <span className="demo-label">
            <Layers size={22} aria-hidden="true" />
            {l('host')}
          </span>
          <h4>{l(host)}</h4>
          <p>{l(host === 'operations' ? 'opsNote' : 'customerNote')}</p>
          {host === 'operations' && (
            <>
              <Action
                disabled={!selected}
                onClick={() => {
                  if (selected) setDisabled([...disabled, selected]);
                  setSelected(null);
                  setNotice('prunedNote');
                }}
              >
                {l('disable')}
              </Action>
              <Action
                disabled={!disabled.length}
                onClick={() => setDisabled([])}
              >
                {l('restore')}
              </Action>
            </>
          )}
        </aside>
        <div className="library-package">
          <span className="demo-label">
            <Package size={22} aria-hidden="true" />
            {l('package')}
          </span>
          <div className="sample-floor">
            <b>{l('floor')}</b>
            <div className="unit-grid">
              {['unitA', 'unitB', 'unitC', 'unitD'].map((unit) => (
                <button
                  type="button"
                  key={unit}
                  disabled={host === 'operations' && disabled.includes(unit)}
                  aria-pressed={selected === unit}
                  onClick={() => {
                    setSelected(unit);
                    setNotice('selectionNote');
                  }}
                >
                  <Layers size={22} aria-hidden="true" />
                  <b>{l(unit)}</b>
                  <span>
                    {l(
                      host === 'operations' && disabled.includes(unit)
                        ? 'disabled'
                        : 'available',
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="unit-detail">
            <span>
              {l(host === 'operations' ? 'opsDetail' : 'customerDetail')}
            </span>
            <strong>{selected ? l(selected) : l('none')}</strong>
            <p>{l('packageNote')}</p>
          </div>
        </div>
      </div>
      <div className="backend-boundary">
        <LockKeyhole size={22} aria-hidden="true" />
        <b>{l('backend')}</b>
        <span>{l('backendNote')}</span>
      </div>
      <Status>{l(notice)}</Status>
    </>
  );
}
function Website({ l }: { l: Labels }) {
  const [mode, setMode] = useState<'publishing' | 'enquiries'>('publishing');
  const [draft, setDraft] = useState(false),
    [published, setPublished] = useState(false);
  const [response, setResponse] = useState('new'),
    [submitted, setSubmitted] = useState<string | null>(null);
  return (
    <>
      <div className="demo-toolbar">
        <div className="demo-switch">
          {(['publishing', 'enquiries'] as const).map((m) => (
            <button
              type="button"
              key={m}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {l(m)}
            </button>
          ))}
        </div>
        <Reset
          l={l}
          onClick={() => {
            setMode('publishing');
            setDraft(false);
            setPublished(false);
            setResponse('new');
            setSubmitted(null);
          }}
        />
      </div>
      {mode === 'publishing' ? (
        <>
          <div className="publishing-layout">
            <div className="cms-editor">
              <span className="demo-label">
                <Layers size={22} aria-hidden="true" />
                {l('editor')}
              </span>
              <div className="cms-block">
                <span>{l('draft')}</span>
                <h4>{l(draft ? 'secondTitle' : 'firstTitle')}</h4>
                <span className="cms-block-tag">{l('article')}</span>
              </div>
              <div className="demo-actions">
                <Action onClick={() => setDraft(!draft)}>{l('edit')}</Action>
                <Action
                  primary
                  disabled={draft === published}
                  onClick={() => setPublished(draft)}
                >
                  {l('publish')}
                </Action>
              </div>
            </div>
            <div className="published-preview">
              <span className="demo-label">
                <Monitor size={22} aria-hidden="true" />
                {l('renderer')}
              </span>
              <div className="sample-article">
                <span>{l('published')}</span>
                <h4>{l(published ? 'secondTitle' : 'firstTitle')}</h4>
                <div className="sample-media">
                  <FileText size={32} aria-hidden="true" />
                  {l('media')}
                </div>
                <p>{l('publishNote')}</p>
              </div>
            </div>
          </div>
          <Status>
            {l(draft === published ? 'idlePublish' : 'draftNote')}
          </Status>
        </>
      ) : (
        <>
          <div className="enquiry-layout">
            <div className="enquiry-input">
              <span className="demo-label">{l('visitor')}</span>
              <label htmlFor="demo-crm-response">{l('response')}</label>
              <select
                id="demo-crm-response"
                value={response}
                onChange={(e) => {
                  setResponse(e.target.value);
                  setSubmitted(null);
                }}
              >
                {['new', 'existing', 'reactivated', 'closed', 'failed'].map(
                  (r) => (
                    <option value={r} key={r}>
                      {l(r)}
                    </option>
                  ),
                )}
              </select>
              <Action primary onClick={() => setSubmitted(response)}>
                {l('submit')}
              </Action>
              <p>{l('attributionNote')}</p>
            </div>
            <div className="enquiry-router">
              <span className="demo-label">
                <LockKeyhole size={22} aria-hidden="true" />
                {l('server')}
              </span>
              <div className="response-branches">
                {['new', 'existing', 'reactivated', 'closed', 'failed'].map(
                  (r) => (
                    <div key={r} data-active={submitted === r}>
                      <span>{l(r)}</span>
                      {submitted === r && (
                        <Check size={18} aria-hidden="true" />
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
          <Status>{l(submitted ? submitted + 'Note' : 'initial')}</Status>
        </>
      )}
    </>
  );
}
const views: Record<string, (props: { l: Labels }) => ReactNode> = {
  'recon-desk': Recon,
  operations: Operations,
  'sales-crm': Calls,
  visualization: Library,
  'website-cms': Website,
};
function Demonstration({ slug, content }: { slug: string; content: Content }) {
  const View = views[slug];
  if (!View) return null;
  const l: Labels = (key) => {
    const value = content.labels[key];
    if (value === undefined)
      throw new Error(`Missing demonstration copy: ${slug}.${key}`);
    return value;
  };
  return (
    <div className={'project-demonstration demo-' + slug}>
      <header className="demonstration-heading">
        <span className="kicker">INTERACTIVE EXPLANATION</span>
        <h3>{content.title}</h3>
        <p>{content.intro}</p>
      </header>
      <div className="demonstration-stage">
        <View l={l} />
      </div>
      <p className="demonstration-boundary">{content.boundary}</p>
    </div>
  );
}
export default function ProjectDemonstration({
  project,
}: {
  project: Project;
}) {
  return project.demonstration ? (
    <Demonstration
      key={project.slug}
      slug={project.slug}
      content={project.demonstration}
    />
  ) : null;
}
