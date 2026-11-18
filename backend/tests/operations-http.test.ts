import { getAuth } from 'firebase-admin/auth';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { randomUUID } from 'crypto';
import { db } from '../src/config/firebase';
import operations from '../src/routes/operations';
import { loadPilotPolicy } from '../src/config/policy-loader';
import { analyze } from '../src/services/underwriting-engine';
import { importPage, queue } from '../src/services/reconciliation';

describe.skipIf(!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || ''))('operator HTTP and settlement import',()=>{
  const org=randomUUID(), other=randomUUID();
  let server:Server, url:string;
  beforeAll(async()=>{
    vi.spyOn(getAuth(),'verifyIdToken').mockImplementation(async(token)=>({
      uid:token === 'other' ? other : org,billingAdmin:token==='operator',
    } as Awaited<ReturnType<ReturnType<typeof getAuth>['verifyIdToken']>>));
    const app=express(); app.use(express.json()); app.use('/ops',operations);
    server=await new Promise<Server>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    url='http://127.0.0.1:'+(server.address() as AddressInfo).port+'/ops';
  });
  afterAll(async()=>{vi.restoreAllMocks(); if(server) await new Promise<void>(r=>server.close(()=>r()));});
  it('limits historical replay to the signed-in tenant and leaves the audit untouched',async()=>{
    const {policy,hash}=loadPilotPolicy();
    const {signals,result}=analyze({applicant:{name:'fixture',pan:'ABCPK1234D'},bank_statement:{transactions:[]}},policy);
    const sample={action:'UNDERWRITING_ANALYZED',result,signals,rbiComplianceFields:{policyHash:hash}};
    const ours=await db.collection('audit_logs').add({...sample,orgId:org});
    await db.collection('audit_logs').add({...sample,orgId:other});
    const response=await fetch(url+'/replay',{method:'POST',headers:{Authorization:'Bearer reviewer','Content-Type':'application/json'},body:JSON.stringify({policy})});
    expect(response.status).toBe(200);
    expect((await response.json()).cases.map((r:{id:string})=>r.id)).toEqual([ours.id]);
    expect((await ours.get()).data()?.result).toEqual(result);
    expect((await fetch(url+'/settlements',{headers:{Authorization:'Bearer reviewer'}})).status).toBe(403);
    expect((await fetch(url+'/policy')).status).toBe(401);
  },30000);
  it('uses provider evidence, skips another tenant and unsettled rows, and reimports idempotently',async()=>{
    const id='pay_'+randomUUID();
    const row={type:'payment',entity_id:id,amount:700,currency:'INR',settled:true,settlement_id:'set_test',settled_at:100};
    const api={settlements:{reports:vi.fn(async()=>({items:[row,{...row,entity_id:'foreign'},{...row,settled:false}]}))},
      payments:{fetch:vi.fn(async(key:string)=>({notes:{orgId:key===id ? org : other}}))}};
    for(let i=0;i<2;i++) expect(await importPage(org,'2026-04-05',0,api as unknown as NonNullable<Parameters<typeof importPage>[3]>)).toEqual({reviewed:1,next:null});
    expect(api.settlements.reports).toHaveBeenCalledWith({year:2026,month:4,day:5,count:50,skip:0});
    const rows=await queue(org).where('status','==','open').get();
    expect(rows.size).toBe(1);
    const repair=await fetch(url+'/settlements/'+rows.docs[0].id+'/repair',{method:'POST',headers:{Authorization:'Bearer operator','Content-Type':'application/json'},body:JSON.stringify({reason:'Verified settlement report'})});
    expect(repair.status).toBe(200);
    expect((await db.collection('payments').doc(id).get()).get('amount')).toBe(7);
  },30000);
});
