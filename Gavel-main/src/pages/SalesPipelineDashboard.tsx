import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiWithAuth, parseResponse } from '../lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, TrendingUp, Calendar, DollarSign, Target, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Deal {
  id: string;
  prospectName: string;
  prospectCompany: string;
  prospectEmail: string;
  prospectPhone: string;
  stage: 'prospecting' | 'negotiating' | 'signed';
  valueEstimate: number;
  winProbability: number;
  expectedCloseDate: string;
  notes: string;
  assignedTo: string;
}

interface SalesPipelineMetrics {
  totalProspects: number;
  totalNegotiating: number;
  totalSigned: number;
  pipelineValue: number;
  expectedMonthlyRevenue: number;
  averageTimeToClose: number;
  nextExpectedClose?: string;
}

interface SalesPipeline {
  prospecting: Deal[];
  negotiating: Deal[];
  signed: Deal[];
  metrics: SalesPipelineMetrics;
}

const SalesPipelineDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pipeline, setPipeline] = useState<SalesPipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [formData, setFormData] = useState({
    prospectName: '',
    prospectCompany: '',
    prospectEmail: '',
    prospectPhone: '',
    valueEstimate: '',
    expectedCloseDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchPipeline();
  }, [user]);

  // Real-Time Demo Request Listener via SSE
  const [liveDemoRequests, setLiveDemoRequests] = useState<any[]>([]);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const eventSource = new EventSource(`${baseUrl}/v1/demo-request/stream`);

    eventSource.addEventListener('initial_data', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setLiveDemoRequests(data);
      } catch (err) {
        console.error('Failed to parse SSE initial_data:', err);
      }
    });

    eventSource.addEventListener('demo_request_created', (e: any) => {
      try {
        const newDemo = JSON.parse(e.data);
        toast.success(`🚀 Real-Time Demo Request: ${newDemo.fullName} (${newDemo.company})`, {
          description: `Product: ${newDemo.productInterest} | Email: ${newDemo.workEmail}`,
          duration: 7000,
        });
        setLiveDemoRequests((prev) => [newDemo, ...prev.filter((r) => r.id !== newDemo.id)]);
        fetchPipeline(); // Auto refresh pipeline since sales deal was created
      } catch (err) {
        console.error('Failed to parse SSE demo_request_created:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const response = await apiWithAuth('/v1/sales/pipeline');
      const data = await parseResponse<SalesPipeline>(response);
      setPipeline(data);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
      toast.error('Failed to fetch sales pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeal = async () => {
    try {
      if (!formData.prospectName || !formData.prospectCompany || !formData.valueEstimate) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await apiWithAuth('/v1/sales', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          valueEstimate: parseInt(formData.valueEstimate),
          stage: 'prospecting',
        }),
      });

      await parseResponse(response);
      toast.success('Deal added successfully');
      setFormData({
        prospectName: '',
        prospectCompany: '',
        prospectEmail: '',
        prospectPhone: '',
        valueEstimate: '',
        expectedCloseDate: '',
        notes: '',
      });
      setIsAddingDeal(false);
      fetchPipeline();
    } catch (error) {
      console.error('Error adding deal:', error);
      toast.error('Failed to add deal');
    }
  };

  const moveDeal = async (dealId: string, newStage: string) => {
    try {
      const response = await apiWithAuth(`/v1/sales/${dealId}/stage`, {
        method: 'PUT',
        body: JSON.stringify({ stage: newStage }),
      });
      await parseResponse(response);
      toast.success(`Deal moved to ${newStage}`);
      fetchPipeline();
    } catch (error) {
      console.error('Error moving deal:', error);
      toast.error('Failed to move deal');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (!pipeline) {
    return <div className="flex items-center justify-center h-96">No data</div>;
  }

  // Data for charts
  const stageData = [
    { name: 'Prospecting', value: pipeline.metrics.totalProspects },
    { name: 'Negotiating', value: pipeline.metrics.totalNegotiating },
    { name: 'Signed', value: pipeline.metrics.totalSigned },
  ];

  const COLORS = ['#ef4444', '#eab308', '#22c55e'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-gray-600">Track your deal progress from prospect to signature</p>
        </div>
        <Dialog open={isAddingDeal} onOpenChange={setIsAddingDeal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
              <DialogDescription>Enter prospect and deal details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Prospect Name"
                value={formData.prospectName}
                onChange={(e) => setFormData({ ...formData, prospectName: e.target.value })}
              />
              <Input
                placeholder="Company Name"
                value={formData.prospectCompany}
                onChange={(e) => setFormData({ ...formData, prospectCompany: e.target.value })}
              />
              <Input
                placeholder="Email"
                type="email"
                value={formData.prospectEmail}
                onChange={(e) => setFormData({ ...formData, prospectEmail: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={formData.prospectPhone}
                onChange={(e) => setFormData({ ...formData, prospectPhone: e.target.value })}
              />
              <Input
                placeholder="Annual Value (₹)"
                type="number"
                value={formData.valueEstimate}
                onChange={(e) => setFormData({ ...formData, valueEstimate: e.target.value })}
              />
              <Input
                placeholder="Expected Close Date"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
              <Textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <Button onClick={handleAddDeal} className="w-full">
                Create Deal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Real-Time Live Demo Requests Stream */}
      {liveDemoRequests.length > 0 && (
        <Card className="border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                <CardTitle className="text-base font-bold text-foreground">Real-Time Demo Requests</CardTitle>
              </div>
              <span className="text-xs bg-orange-500/10 text-orange-600 font-medium px-2.5 py-0.5 rounded-full border border-orange-500/20">
                Live SSE Stream Connected
              </span>
            </div>
            <CardDescription className="text-xs">
              Incoming website requests automatically create sales leads and trigger real-time alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveDemoRequests.slice(0, 6).map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-lg border border-border bg-card/60 hover:bg-card transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground truncate">{req.fullName}</span>
                    <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {req.productInterest}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{req.company} {req.companySize ? `(${req.companySize})` : ''}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/50">
                    <span className="truncate">{req.workEmail}</span>
                    <span className="shrink-0 text-[10px] opacity-75">
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{(pipeline.metrics.pipelineValue / 100000).toFixed(1)}L</p>
            <p className="text-xs text-gray-600 mt-2">Weighted by probability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expected Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{(pipeline.metrics.expectedMonthlyRevenue / 100000).toFixed(1)}L</p>
            <p className="text-xs text-gray-600 mt-2">From signed deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pipeline.metrics.totalProspects +
                pipeline.metrics.totalNegotiating +
                pipeline.metrics.totalSigned}
            </p>
            <p className="text-xs text-gray-600 mt-2">Across all stages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg. Time to Close</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pipeline.metrics.averageTimeToClose} days</p>
            <p className="text-xs text-gray-600 mt-2">From creation to signature</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Distribution by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Value by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { stage: 'Prospecting', deals: pipeline.prospecting, color: 'bg-red-100 text-red-800' },
                { stage: 'Negotiating', deals: pipeline.negotiating, color: 'bg-yellow-100 text-yellow-800' },
                { stage: 'Signed', deals: pipeline.signed, color: 'bg-green-100 text-green-800' },
              ].map(({ stage, deals, color }) => {
                const totalValue = deals.reduce((sum, d) => sum + d.valueEstimate, 0);
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{stage}</span>
                      <span className="text-sm font-bold">₹{(totalValue / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color.split(' ')[0]}`}
                        style={{
                          width: `${(totalValue / pipeline.metrics.pipelineValue) * 100 || 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Columns (Kanban-like) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { title: 'Prospecting', deals: pipeline.prospecting, stage: 'prospecting' },
          { title: 'Negotiating', deals: pipeline.negotiating, stage: 'negotiating' },
          { title: 'Signed', deals: pipeline.signed, stage: 'signed' },
        ].map(({ title, deals, stage }) => (
          <Card key={stage}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{deals.length} deals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deals.map((deal) => (
                  <div key={deal.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <p className="font-semibold text-sm">{deal.prospectCompany}</p>
                    <p className="text-xs text-gray-600">{deal.prospectName}</p>
                    <p className="text-sm font-bold text-blue-600 mt-2">
                      ₹{(deal.valueEstimate / 100000).toFixed(1)}L/year
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {deal.winProbability}% probability
                    </p>

                    {stage !== 'signed' && (
                      <div className="mt-3 pt-2 border-t flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const nextStage =
                              stage === 'prospecting'
                                ? 'negotiating'
                                : 'signed';
                            moveDeal(deal.id, nextStage);
                          }}
                          className="text-xs flex-1"
                        >
                          {stage === 'prospecting' ? 'Negotiate' : 'Sign'} <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SalesPipelineDashboard;
