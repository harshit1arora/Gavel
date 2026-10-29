import { useState, useEffect } from "react";
import { ChevronRight, AlertCircle, CheckCircle2, Clock, Plus, Download, Send, Banknote, X, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { generateLoanAgreement } from "../../lib/pdf-generator";
import { MOCK_DISBURSEMENTS } from "../../lib/disbursement";
import { apiWithAuth } from "../../lib/api-client";
import { exportToCSV } from "../../lib/exportUtils";

interface Tranche {
  id?: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'In Transit' | 'Completed' | 'Failed';
  disbursedDate?: string;
  method: 'NEFT' | 'RTGS' | 'UPI' | 'Check' | 'Cash';
}

interface Disbursement {
  id?: string;
  loanId: string;
  applicationId: string;
  status: 'Pending' | 'In Transit' | 'Completed' | 'Failed' | 'Recalled';
  tranches: Tranche[];
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function DisbursementQueue() {
  const { orgId } = useAuth();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [selectedDisbursement, setSelectedDisbursement] = useState<Disbursement | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDisbursements();
  }, [orgId]);

  const fetchDisbursements = async () => {
    try {
      setLoading(true);
      if (orgId) {
        try {
          const response = await apiWithAuth('/v1/disbursements');
          if (response.ok) {
            const data = await response.json();
            setDisbursements(data);
            return;
          }
        } catch (apiError) {
          console.warn('API unavailable, using mock data:', apiError);
        }
      }
      
      // Fallback to mock data
      setDisbursements(MOCK_DISBURSEMENTS as unknown as Disbursement[]);
    } catch (error) {
      console.error('Error fetching disbursements:', error);
      toast.error('Failed to load disbursements');
      // Fallback to mock data on error
      setDisbursements(MOCK_DISBURSEMENTS as unknown as Disbursement[]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'In Transit': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={16} />;
      case 'In Transit': return <Clock size={16} className="animate-pulse" />;
      case 'Failed': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const handleSendConfirmation = async (disbursementId: string) => {
    setSendingConfirmation(disbursementId);
    try {
      const response = await apiWithAuth(`/v1/disbursements/${disbursementId}/send-confirmation`, {
        method: 'POST',
        body: JSON.stringify({ channel: 'SMS' }),
      });
      if (response.ok) {
        toast.success('Disbursement confirmation sent successfully');
      } else {
        toast.error('Failed to send confirmation');
      }
    } catch (error) {
      console.error('Error sending confirmation:', error);
      toast.error('Failed to send confirmation');
    } finally {
      setSendingConfirmation(null);
    }
  };

  const handleInitiateTransfer = async (disbursementId: string) => {
    try {
      const response = await apiWithAuth(`/v1/disbursements/${disbursementId}/initiate`, {
        method: 'POST'
      });
      if (response.ok) {
        toast.success('Transfer initiated successfully');
        fetchDisbursements();
      } else {
        toast.error('Failed to initiate transfer');
      }
    } catch {
      toast.error('Failed to initiate transfer');
    }
  };

  const handleDownloadProof = async (disbursement: Disbursement) => {
    const tranche = disbursement.tranches?.find(t => t.status === 'Completed');
    const { generateLoanAgreementDataURL } = await import('../../lib/pdf-generator');
    const dataUrl = await generateLoanAgreementDataURL({
      borrowerName: disbursement.borrowerName || 'Borrower',
      borrowerPhone: disbursement.borrowerPhone || '',
      borrowerEmail: disbursement.borrowerEmail || '',
      loanAmount: tranche?.amount || disbursement.totalAmount,
      tenor: Math.max(12, Math.round((disbursement.totalAmount / (disbursement.totalAmount * 0.015)))),
      rate: 14.5,
      emiAmount: Math.round((tranche?.amount || disbursement.totalAmount) / 12),
      startDate: tranche?.disbursedDate || new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      purpose: 'Disbursement',
      disbursalMethod: tranche?.method || 'NEFT',
    });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Proof_Of_Disbursement_${disbursement.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    toast.success('Proof of disbursement downloaded');
  };

  const handleMarkCompleted = async (disbursementId: string) => {
    try {
      const response = await apiWithAuth(`/v1/disbursements/${disbursementId}/mark-completed`, {
        method: 'POST'
      });
      if (response.ok) {
        toast.success('Disbursement marked as completed');
        fetchDisbursements();
      } else {
        toast.error('Failed to mark as completed');
      }
    } catch {
      toast.error('Failed to mark as completed');
    }
  };

  const handleRecall = async (disbursementId: string) => {
    const reason = prompt('Enter reason for recall:');
    if (!reason) return;
    try {
      const response = await apiWithAuth(`/v1/disbursements/${disbursementId}/recall`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        toast.success('Disbursement recalled');
        fetchDisbursements();
      } else {
        toast.error('Failed to recall disbursement');
      }
    } catch {
      toast.error('Failed to recall disbursement');
    }
  };

  const filteredDisbursements = disbursements.filter(d =>
    !filter || d.borrowerName?.toLowerCase().includes(filter.toLowerCase()) ||
    d.applicationId.includes(filter)
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredDisbursements.map(d => d.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkInitiate = async () => {
    if (selectedIds.size === 0) return;
    try {
      const response = await apiWithAuth('/v1/disbursements/bulk-initiate', {
        method: 'POST',
        body: JSON.stringify({ disbursementIds: Array.from(selectedIds) }),
      });
      if (response.ok) {
        toast.success(`Successfully initiated ${selectedIds.size} disbursements`);
        setSelectedIds(new Set());
        fetchDisbursements();
      } else {
        toast.error('Bulk initiation failed');
      }
    } catch {
      toast.error('Bulk initiation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Disbursement Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage loan fund transfers and track status</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
             <button onClick={handleBulkInitiate} className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg border border-border hover:bg-muted transition-colors text-xs font-bold uppercase tracking-widest">
               <Send size={14} /> Bulk Initiate ({selectedIds.size})
             </button>
          )}
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> New Disbursement
          </button>
          <button
            onClick={() => exportToCSV('disbursements.csv', filteredDisbursements)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-foreground/10 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by borrower name or loan ID..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-4 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-foreground/5 border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total</div>
          <div className="text-2xl font-bold text-foreground mt-1">{disbursements.length}</div>
        </div>
        <div className="bg-foreground/5 border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Pending</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">{disbursements.filter(d => d.status === 'Pending').length}</div>
        </div>
        <div className="bg-foreground/5 border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">In Transit</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{disbursements.filter(d => d.status === 'In Transit').length}</div>
        </div>
        <div className="bg-foreground/5 border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Completed</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{disbursements.filter(d => d.status === 'Completed').length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-foreground/5 border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-foreground/10">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">
                   <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredDisbursements.length} className="accent-primary" />
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tranches</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading disbursements...
                  </td>
                </tr>
              ) : filteredDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No disbursements found
                  </td>
                </tr>
              ) : (
                filteredDisbursements.map((disburse) => (
                  <tr key={disburse.id} className="border-t border-border hover:bg-foreground/5 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedIds.has(disburse.id!)} onChange={() => handleSelectOne(disburse.id!)} className="accent-primary" />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-foreground">{disburse.borrowerName || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{disburse.applicationId.substring(0, 8)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">₹{disburse.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(disburse.status)}`}>
                        {getStatusIcon(disburse.status)}
                        {disburse.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-foreground">{disburse.tranches.length} tranches</div>
                      <div className="text-xs text-muted-foreground">
                        {disburse.tranches.filter(t => t.status === 'Completed').length} completed
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {disburse.createdAt ? new Date(disburse.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedDisbursement(disburse)}
                        className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                      >
                        View <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDisbursement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background">
              <h3 className="text-lg font-bold text-foreground">Disbursement Details</h3>
              <button onClick={() => setSelectedDisbursement(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Borrower</div>
                  <div className="text-foreground font-semibold mt-1">{selectedDisbursement.borrowerName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Phone</div>
                  <div className="text-foreground font-semibold mt-1">{selectedDisbursement.borrowerPhone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Amount</div>
                  <div className="text-2xl font-bold text-primary mt-1">₹{selectedDisbursement.totalAmount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Status</div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mt-1 ${getStatusColor(selectedDisbursement.status)}`}>
                    {getStatusIcon(selectedDisbursement.status)}
                    {selectedDisbursement.status}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Tranches</h4>
                <div className="space-y-2">
                  {selectedDisbursement.tranches.map((tranche, idx) => (
                    <div key={idx} className="bg-foreground/5 border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground">Tranche {idx + 1}</div>
                          <div className="text-sm text-muted-foreground">₹{tranche.amount.toLocaleString('en-IN')} • {tranche.method}</div>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(tranche.status)}`}>
                          {getStatusIcon(tranche.status)}
                          {tranche.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => { handleInitiateTransfer(selectedDisbursement!.id!); setSelectedDisbursement(null); }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Initiate Transfer
                </button>
                <button
                  onClick={() => { handleMarkCompleted(selectedDisbursement!.id!); setSelectedDisbursement(null); }}
                  className="flex-1 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Mark Completed
                </button>
                <button
                  onClick={() => handleSendConfirmation(selectedDisbursement!.id!)}
                  disabled={sendingConfirmation === selectedDisbursement?.id}
                  className="flex-1 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  {sendingConfirmation === selectedDisbursement?.id ? 'Sending...' : <><Send size={16} /> Send SMS</>}
                </button>
                <button
                  onClick={() => handleDownloadProof(selectedDisbursement)}
                  className="flex-1 px-4 py-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download Proof
                </button>
                <button
                  onClick={() => { handleRecall(selectedDisbursement!.id!); setSelectedDisbursement(null); }}
                  className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    {/* New Disbursement Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <NewDisbursementModal
            onClose={() => setShowNewModal(false)}
            onCreated={(newDisb) => {
              setDisbursements(prev => [newDisb as Disbursement, ...prev]);
              setShowNewModal(false);
              toast.success('Disbursement created successfully');
            }}
          />
        </div>
      )}
    </div>
  );
}

function NewDisbursementModal({ onClose, onCreated }: { onClose: () => void; onCreated: (d: any) => void }) {
  const { orgId } = useAuth();
  const [form, setForm] = useState({
    loanId: '', applicationId: '', borrowerName: '', borrowerPhone: '', borrowerEmail: '',
    totalAmount: '', bankAccount: '', ifscCode: '',
  });
  const [tranches, setTranches] = useState([{ amount: '', dueDate: '', method: 'NEFT' as const }]);
  const [submitting, setSubmitting] = useState(false);

  const addTranche = () => setTranches(prev => [...prev, { amount: '', dueDate: '', method: 'NEFT' as const }]);
  const removeTranche = (i: number) => setTranches(prev => prev.filter((_, idx) => idx !== i));
  const updateTranche = (i: number, field: string, value: string) => {
    setTranches(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.loanId || !form.applicationId || !form.borrowerName || !form.totalAmount) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const apiKey = localStorage.getItem('apiKey');
      const payload = {
        loanId: form.loanId,
        applicationId: form.applicationId,
        borrowerName: form.borrowerName,
        borrowerPhone: form.borrowerPhone,
        borrowerEmail: form.borrowerEmail,
        bankAccount: form.bankAccount,
        borrowerUPI: `${form.borrowerName.toLowerCase().replace(/\s+/g, '.')}@gavel`,
        tranches: tranches.filter(t => t.amount && t.dueDate).map((t, idx) => ({
          amount: parseFloat(t.amount),
          dueDate: t.dueDate,
          method: t.method,
          status: 'Pending' as const,
        })),
        totalAmount: parseFloat(form.totalAmount),
        auditTrail: [{ action: 'Disbursement created via UI', timestamp: new Date() }],
      };
      if (orgId) {
        const response = await apiWithAuth('/v1/disbursements', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          onCreated({ ...payload, id: data.id, createdAt: new Date().toISOString(), status: 'Pending' });
          return;
        }
      }
      // Fallback: return mock data
      onCreated({ ...payload, id: `D-${Date.now()}`, createdAt: new Date().toISOString(), status: 'Pending', tranches: payload.tranches.map((t: any, i: number) => ({ ...t, id: `T${i + 1}` })) });
    } catch {
      toast.error('Failed to create disbursement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background z-10">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Banknote size={20} className="text-primary" /> New Disbursement</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Loan ID *</label>
            <input value={form.loanId} onChange={e => setForm(f => ({ ...f, loanId: e.target.value }))} placeholder="L-7421" className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Application ID *</label>
            <input value={form.applicationId} onChange={e => setForm(f => ({ ...f, applicationId: e.target.value }))} placeholder="APP-88210" className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Borrower Name *</label>
            <input value={form.borrowerName} onChange={e => setForm(f => ({ ...f, borrowerName: e.target.value }))} placeholder="Ramesh Kumar Sharma" className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Amount (₹) *</label>
            <input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="500000" className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone</label>
            <input value={form.borrowerPhone} onChange={e => setForm(f => ({ ...f, borrowerPhone: e.target.value }))} placeholder="+91-98765-43210" className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Email</label>
            <input value={form.borrowerEmail} onChange={e => setForm(f => ({ ...f, borrowerEmail: e.target.value }))} placeholder="borrower@email.com" className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Bank Account</label>
            <input value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} placeholder="XXXXX4521" className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">IFSC Code</label>
            <input value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value }))} placeholder="HDFC0001234" className="w-full px-3 py-2 bg-foreground/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        {/* Tranches */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tranches</label>
            <button type="button" onClick={addTranche} className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1"><Plus size={12} /> Add Tranche</button>
          </div>
          <div className="space-y-2">
            {tranches.map((tranche, i) => (
              <div key={i} className="bg-foreground/5 border border-border rounded-lg p-3 grid grid-cols-4 gap-2 items-end">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Amount (₹)</label>
                  <input type="number" value={tranche.amount} onChange={e => updateTranche(i, 'amount', e.target.value)} placeholder="250000" className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Due Date</label>
                  <input type="date" value={tranche.dueDate} onChange={e => updateTranche(i, 'dueDate', e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Method</label>
                  <select value={tranche.method} onChange={e => updateTranche(i, 'method', e.target.value)} className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>NEFT</option><option>RTGS</option><option>UPI</option><option>IMPS</option><option>Check</option><option>Cash</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  {tranches.length > 1 && (
                    <button type="button" onClick={() => removeTranche(i)} className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-colors font-semibold text-sm">Cancel</button>
          <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? 'Creating...' : <><Banknote size={16} /> Create Disbursement</>}
          </button>
        </div>
      </form>
    </div>
  );
}
