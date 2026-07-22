"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/loading";
import { Search, Filter, Download, RefreshCw, Database } from "lucide-react";

interface RiskCustomer {
  customerId: string;
  contract: string;
  paymentMethod: string;
  monthlyCharges: number;
  totalCharges: number;
  tenure: number;
  probability: number;
  riskLevel: "Low" | "Medium" | "High";
  recommendation: string;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function RiskPage() {
  const [customers, setCustomers] = useState<RiskCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [contractFilter, setContractFilter] = useState("all");
  const [sortBy, setSortBy] = useState("probability");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (riskFilter !== "all") params.set("risk", riskFilter);
      if (contractFilter !== "all") params.set("contract", contractFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const response = await fetch(`/api/customers?${params.toString()}`);
      const json = await response.json();
      if (!json.success) throw new Error(json.message || "Failed to load customers");
      setCustomers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/customers", { method: "POST" });
      const json = await response.json();
      if (!json.success) throw new Error(json.message || "Failed to seed data");
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [riskFilter, contractFilter, sortBy, sortOrder]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const exportCSV = () => {
    const headers = [
      "Customer ID",
      "Risk Level",
      "Probability",
      "Contract",
      "Payment Method",
      "Monthly Charges",
      "Total Charges",
      "Tenure",
      "Recommendation",
    ];
    const rows = customers.map((c) => [
      c.customerId,
      c.riskLevel,
      formatPercent(c.probability),
      c.contract,
      c.paymentMethod,
      formatCurrency(c.monthlyCharges),
      formatCurrency(c.totalCharges),
      c.tenure,
      c.recommendation,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer-risk-analysis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Risk analysis</h1>
          <p className="mt-1 text-slate-500">Review, search, and filter customers by churn risk.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={customers.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" isLoading={seeding} onClick={seedData}>
            <Database className="mr-1.5 h-4 w-4" />
            Seed sample data
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorState message={error} onRetry={fetchCustomers} />
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer ID, contract, or payment method"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Risk level</label>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Contract</label>
                <select
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="all">All</option>
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="probability">Probability</option>
                  <option value="tenure">Tenure</option>
                  <option value="monthlyCharges">Monthly charges</option>
                  <option value="totalCharges">Total charges</option>
                  <option value="customerId">Customer ID</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="desc">Highest first</option>
                  <option value="asc">Lowest first</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState text="Loading customer risk data..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Try adjusting your filters or seed sample data to get started."
          action={
            <Button variant="secondary" size="sm" isLoading={seeding} onClick={seedData}>
              <Database className="mr-1.5 h-4 w-4" />
              Seed sample data
            </Button>
          }
        />
      ) : (
        <Card className="animate-fade-in overflow-hidden">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customer risk table</CardTitle>
                <CardDescription>{customers.length} customers matching your filters.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchCustomers}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-slate-500">
                    <th className="px-6 py-3.5 font-medium">Customer ID</th>
                    <th className="px-6 py-3.5 font-medium">Risk level</th>
                    <th className="px-6 py-3.5 font-medium">Probability</th>
                    <th className="px-6 py-3.5 font-medium">Contract</th>
                    <th className="px-6 py-3.5 font-medium">Payment method</th>
                    <th className="px-6 py-3.5 font-medium">Monthly</th>
                    <th className="px-6 py-3.5 font-medium">Tenure</th>
                    <th className="px-6 py-3.5 font-medium">Recommended action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr
                      key={customer.customerId}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{customer.customerId}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            customer.riskLevel === "High"
                              ? "high"
                              : customer.riskLevel === "Medium"
                              ? "medium"
                              : "low"
                          }
                        >
                          {customer.riskLevel}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-12 font-medium text-slate-900">
                            {formatPercent(customer.probability)}
                          </span>
                          <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-slate-100 sm:block">
                            <div
                              className={`h-full rounded-full ${
                                customer.probability > 0.65
                                  ? "bg-red-500"
                                  : customer.probability > 0.35
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${customer.probability * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{customer.contract}</td>
                      <td className="px-6 py-4 text-slate-600">{customer.paymentMethod}</td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(customer.monthlyCharges)}</td>
                      <td className="px-6 py-4 text-slate-600">{customer.tenure} mo</td>
                      <td className="px-6 py-4 text-slate-600">{customer.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
