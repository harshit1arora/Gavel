import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PolicyReplay, SettlementReview } from '@/components/dashboard/Operations';
import { apiWithAuth } from '@/lib/api-client';
vi.mock('@/lib/api-client',()=>({apiWithAuth:vi.fn()}));
const api=vi.mocked(apiWithAuth);
const answer=(value:unknown)=>Promise.resolve(new Response(JSON.stringify(value)));
afterEach(()=>{ cleanup(); vi.clearAllMocks(); });
describe('operations dashboard',()=>{
  it('aggregates every replay page and exposes skipped audit records',async()=>{
    const before={decision:'APPROVE',score:90,limit:100,reasons:['R1'],flags:[]};
    const row={id:'fixture',before,after:{...before,decision:'REVIEW'},exposureDelta:-100,rules:[],configurationChanges:['bands']};
    api.mockImplementationOnce(()=>answer({version:'2'}))
      .mockImplementationOnce(()=>answer({cases:[row],skipped:[],next:'fixture'}))
      .mockImplementationOnce(()=>answer({cases:[],skipped:['old'],next:null}));
    render(<PolicyReplay/>);
    fireEvent.click(screen.getByText('Load pilot policy'));
    await screen.findByDisplayValue(/"version": "2"/);
    fireEvent.click(screen.getByText('Replay historical decisions'));
    expect(await screen.findByText(/1 reviewed · 1 decisions changed/)).toBeTruthy();
    expect(screen.getByText(/1 incomplete audit/)).toBeTruthy();
    expect(JSON.parse(String(api.mock.calls[2][1]?.body)).cursor).toBe('fixture');
  });
  it('requires an operator reason and refreshes the discrepancy queue after a repair',async()=>{
    const item={id:'payment_p',errors:['Repayment allocation mismatch'],settlement:{entityId:'p',currency:'INR',amount:100,settlementId:'s',loanId:'l'}};
    api.mockImplementationOnce(()=>answer({items:[item],next:null}))
      .mockImplementationOnce(()=>answer({status:'closed'})).mockImplementationOnce(()=>answer({items:[],next:null}));
    render(<SettlementReview/>);
    const button=await screen.findByText('Apply ledger repair');
    expect(button.hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByLabelText('Installment number'),{target:{value:'2'}});
    fireEvent.change(screen.getByLabelText('Repair reason'),{target:{value:'Confirmed from settlement s'}});
    fireEvent.click(button);
    expect(await screen.findByText('0 open discrepancies.')).toBeTruthy();
    expect(JSON.parse(String(api.mock.calls[1][1]?.body))).toEqual({emiNo:2,reason:'Confirmed from settlement s'});
  });
});
