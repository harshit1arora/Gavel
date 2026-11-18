import { processOverdueLoans } from '../src/services/collection-automation';
import { runPortfolioClassification } from '../src/services/compliance-engine';
import { describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { deriveSignals, analyze } from '../src/services/underwriting-engine';
import { loadPilotPolicy } from '../src/config/policy-loader';
import { candidatePolicy, replayCase } from '../src/services/policy-replay';
import { runDueJob, recoverJob } from '../src/services/job-runner';
import { queue, reconcile, Settlement } from '../src/services/reconciliation';
import { db } from '../src/config/firebase';
const pilot = loadPilotPolicy().policy;
describe('policy replay', () => {
  const input = { applicant: {name:'Example',pan:'ABCPK1234D'},bank_statement:{period:'6 months',transactions:
    [1,2,3,4,5,6].map(month=>({date:'2026-0'+month+'-03',description:'SALARY CREDIT',amount:45000,balance:90000}))}};
  const original = analyze(input,pilot);
  it('reuses historical signals and the live engine, including approved-only exposure',()=>{
    const candidate = structuredClone(pilot);
    candidate.rules[0].value = 10000000;
    const report = replayCase('fixture',deriveSignals(input),original.result,candidate,pilot);
    expect(original.result.decision).toBe('APPROVE');
    expect(report.after.decision).toBe(analyze(input,candidate).result.decision);
    expect(report.after.decision).toBe('REJECT');
    expect(report.exposureDelta).toBe(-original.result.credit_limit);
    expect(report.rules.map(r=>r.id)).toContain(candidate.rules[0].id);
    expect(replayCase('fixture',original.signals,original.result,pilot,pilot).rules).toEqual([]);
  });
  it('validates candidates and rejects duplicate rule identifiers and unknown signal names',()=>{
    expect(candidatePolicy.safeParse(pilot).success).toBe(true);
    expect(candidatePolicy.safeParse({...pilot,rules:[pilot.rules[0],pilot.rules[0]]}).success).toBe(false);
    expect(candidatePolicy.safeParse({...pilot,rules:[{...pilot.rules[0],field:'unknown'}]}).success).toBe(false);
  });
});
const emulator = /^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '');
describe.skipIf(!emulator)('operations with Firestore transactions', () => {
  it('allows one worker per occurrence and coalesces overdue slots after restart',async()=>{
    const run = vi.fn(async()=>{});
    const job = {name:'test-'+randomUUID(),interval:100,run};
    await Promise.all([runDueJob(db,job,300),runDueJob(db,job,300)]);
    expect(run).toHaveBeenCalledTimes(1);
    await runDueJob(db,job,520);
    await runDueJob(db,job,520);
    await runDueJob(db,job,520);
    expect(run).toHaveBeenCalledTimes(2);
    const rows = await db.collection('job_state').doc(job.name).collection('runs').get();
    expect(rows.docs.map(d=>d.id)).toEqual(['300','500']);
  },30000);
  it('blocks partial effects across slots until an operator resolves the correct run',async()=>{
    const job={name:'test-'+randomUUID(),interval:100,run:vi.fn(async()=>{throw Error('partial');})};
    await expect(runDueJob(db,job,100)).rejects.toThrow('partial');
    expect(await runDueJob(db,job,200)).toBe(false);
    const state = await db.collection('job_state').doc(job.name).get();
    await expect(recoverJob(db,job,'stale-token','complete','reviewed')).rejects.toThrow();
    await recoverJob(db,job,state.get('active'),'complete','verified external effects');
    job.run.mockImplementation(async()=>undefined as never);
    expect(await runDueJob(db,job,200)).toBe(true);
  },30000);
  it('executes real collection and portfolio jobs against timestamp-backed tenant records',async()=>{
    const orgId=randomUUID(),loanId=randomUUID(), before=new Date(Date.now()-5*86400000);
    await db.collection('loans').doc(loanId).set({orgId,status:'Active',loanAmount:2000,outstandingAmount:2000,firstEmiDate:before});
    await db.collection('repayment_schedules').doc(loanId).set({orgId,loanId,borrowerId:'test',borrowerName:'Test',
      loanAmount:2000,totalOutstanding:2000,emiAmount:500,firstEmiDate:before,
      schedules:[{emiNo:1,emiAmount:500,status:'Pending',dueDate:before}]});
    const result=await processOverdueLoans(orgId);
    expect(result).toMatchObject({triggered:1,failed:0});
    const row=db.collection('collections').doc(result.results[0].caseId);
    await row.update({recoveryNotes:['Operator note']});
    expect((await processOverdueLoans(orgId)).failed).toBe(0);
    expect((await row.get()).get('recoveryNotes')).toEqual(['Operator note']);
    await runPortfolioClassification(orgId);
    const classification=await db.collection('loan_classifications').doc(orgId+'_'+loanId).get();
    expect(classification.get('daysOverdue')).toBe(5);
  },30000);
  it('repairs a missing capture and allocation once, then reconciles a missed refund',async()=>{
    const id=randomUUID(), orgId='org-'+id,loanId='loan-'+id,paymentId='pay_'+id;
    const s:Settlement={kind:'payment',entityId:paymentId,paymentId,orgId,loanId,amount:50000,currency:'INR',settlementId:'set_a',postedAt:1};
    const schedule=db.collection('repayment_schedules').doc(id);
    await schedule.set({orgId,loanId,totalScheduledAmount:1000,schedules:[{emiNo:1,emiAmount:500,status:'Pending'}]});
    expect((await reconcile(s,false)).errors).toContain('Missing payment');
    await expect(reconcile(s,true,'admin','reviewed',2)).rejects.toThrow();
    expect((await db.collection('payments').doc(paymentId).get()).exists).toBe(false);
    await Promise.all([reconcile(s,true,'admin','matched',1),reconcile(s,true,'admin','matched',1)]);
    expect((await schedule.get()).get('totalPaid')).toBe(500);
    expect((await reconcile(s,false)).errors).toEqual([]);
    const refund:Settlement={...s,kind:'refund',entityId:'rf_'+id,amount:10000};
    await reconcile(refund,false);
    await reconcile(refund,true,'admin','provider refund confirmed');
    expect((await db.collection('payments').doc(paymentId).get()).data()).toMatchObject({status:'partial_refunded',refundedAmount:100});
    expect((await reconcile(refund,false)).errors).toEqual([]);
    expect((await queue('other-'+orgId).get()).empty).toBe(true);
    const audits=await db.collection('audit_logs').where('orgId','==',orgId).get();
    expect(audits.size).toBe(2);
  },30000);
});
