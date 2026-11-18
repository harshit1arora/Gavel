import { useEffect, useState } from 'react';
import { apiWithAuth } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await apiWithAuth('/v1/operations/' + path, body === undefined ? {} :
    { method: 'POST', body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Operation failed (' + response.status + ')');
  return data;
}
const errorText = (e: unknown) => e instanceof Error ? e.message : 'Operation failed';
const money = (n:number) => '₹' + n.toLocaleString('en-IN');
type Decision = {decision:string;score:number;limit:number; reasons:string[];flags:string[]};
type Rule = {condition:string;result:boolean;skipped:boolean};
type Case = {id:string;before:Decision;after:Decision;exposureDelta:number;configurationChanges:string[]|null;
  rules:{id:string;before:Rule|null;after:Rule|null;beforeWeight:number|null;afterWeight:number|null;beforeAction:string|null;afterAction:string|null}[]};
const describeRule = (r:Rule|null) => !r ? 'absent' : r.condition + ' (' + (r.skipped ? 'skipped' : r.result ? 'pass' : 'fail') + ')';

export function PolicyReplay() {
  const [draft,setDraft] = useState('');
  const [cases,setCases] = useState<Case[]>([]);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const [complete,setComplete] = useState(false);
  async function load() {
    try { setDraft(JSON.stringify(await request('policy'),null,2)); setComplete(false); setMessage(''); }
    catch (e) { setMessage(errorText(e)); }
  }
  async function replay() {
    setBusy(true); setComplete(false); setCases([]);
    try {
      const policy = JSON.parse(draft);
      let cursor:string|null = null, skipped = 0;
      const results:Case[] = [];
      do {
        const page:{cases:Case[];next:string|null;skipped:string[]} = await request('replay',{policy,cursor});
        results.push(...page.cases); skipped += page.skipped.length; cursor = page.next;
        setMessage('Reviewed ' + results.length + ' decisions…');
      } while(cursor);
      setCases(results); setComplete(true); setMessage(skipped + ' incomplete audit records skipped.');
    } catch(e) { setMessage(errorText(e)); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4">
    <h2 className="text-2xl font-bold">Policy replay</h2>
    <Button disabled={busy} onClick={load}>Load pilot policy</Button>
    <label className="block">Candidate policy JSON<textarea className="block w-full rounded border bg-background p-3 font-mono" rows={12}
      value={draft} disabled={busy} onChange={e=>{setDraft(e.target.value);setComplete(false);}} /></label>
    <Button disabled={busy || !draft} onClick={replay}>Replay historical decisions</Button>
    <p role="status">{message}</p>
    {complete && <><p>{cases.length} reviewed · {cases.filter(c=>c.before.decision!==c.after.decision).length} decisions changed · Approved exposure change {money(cases.reduce((n,c)=>n+c.exposureDelta,0))}</p>
      {cases.map(c=><details key={c.id} className="rounded border p-3"><summary>{c.id} · {c.before.decision} → {c.after.decision} · {money(c.before.limit)} → {money(c.after.limit)}</summary>
        <p>Score {c.before.score} → {c.after.score}. Decision drivers {c.before.reasons.join(', ') || 'none'} → {c.after.reasons.join(', ') || 'none'}.</p>
        <p>Configuration changes: {c.configurationChanges?.join(', ') || (c.configurationChanges ? 'none' : 'original policy unavailable')}</p>
        {c.rules.map(r=><p key={r.id}>{r.id}: {describeRule(r.before)} → {describeRule(r.after)} · action {r.beforeAction ?? 'unknown'} → {r.afterAction ?? 'removed'} · weight {r.beforeWeight ?? 'unknown'} → {r.afterWeight ?? 'removed'}</p>)}
      </details>)}</>}
  </section>;
}

type Issue = {id:string;errors:string[];settlement:{entityId:string;loanId:string;amount:number;currency:string;settlementId:string}};
function IssueRow({item,onResolved}:{item:Issue;onResolved:()=>void}) {
  const [reason,setReason] = useState(''), [emi,setEmi] = useState(''), [message,setMessage] = useState(''), [busy,setBusy] = useState(false);
  async function repair() {
    setBusy(true);
    try { await request('settlements/'+item.id+'/repair',{reason,...(emi ? {emiNo:Number(emi)} : {})}); onResolved(); }
    catch(e) {setMessage(errorText(e));} finally {setBusy(false);}
  }
  return <article className="space-y-2 border p-4 rounded">
    <h3 className="font-bold">{item.settlement.entityId} · {item.settlement.currency} {(item.settlement.amount/100).toLocaleString()}</h3>
    <p>{item.errors.join(' · ')}. Settlement {item.settlement.settlementId}. Loan {item.settlement.loanId || 'unlinked'}.</p>
    {item.errors.includes('Repayment allocation mismatch') && <label className="block">Installment number <input className="border bg-background" type="number" min="1" value={emi} onChange={e=>setEmi(e.target.value)} /></label>}
    <label className="block">Repair reason <input className="border bg-background" value={reason} onChange={e=>setReason(e.target.value)} /></label>
    <Button disabled={busy || !reason.trim()} onClick={repair}>Apply ledger repair</Button><p role="status">{message}</p>
  </article>;
}
export function SettlementReview() {
  const [date,setDate] = useState(''), [items,setItems] = useState<Issue[]>([]), [busy,setBusy] = useState(false), [message,setMessage] = useState('');
  async function refresh(scan:boolean) {
    setBusy(true);
    try {
      let reviewed=0;
      if(scan) {
        let skip:number|null = 0;
        do {
          const page:{reviewed:number;next:number|null} = await request('settlements/import',{date,skip});
          reviewed+=page.reviewed; skip=page.next;
        } while(skip!==null);
      }
      const found:Issue[] = [];
      let after:string|null=null;
      do {
        const page:{items:Issue[];next:string|null} = await request('settlements'+(after ? '?cursor='+encodeURIComponent(after) : ''));
        found.push(...page.items); after=page.next;
      } while(after);
      setItems(found);setMessage((scan ? reviewed+' settlement entries checked. ' : '') + found.length+' open discrepancies.');
    } catch(e) {setMessage(errorText(e));} finally {setBusy(false);}
  }
  useEffect(()=>{void refresh(false);},[]);
  return <section className="space-y-4"><h2 className="text-2xl font-bold">Settlement reconciliation</h2>
    <label>Settlement date <input className="border bg-background" type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>{' '}
    <Button disabled={!date || busy} onClick={()=>refresh(true)}>Compare settlements</Button>{' '}
    <Button disabled={busy} onClick={()=>refresh(false)}>Refresh queue</Button>
    <p role="status">{message}</p>{items.map(item=><IssueRow key={item.id} item={item} onResolved={()=>refresh(false)} />)}
  </section>;
}
