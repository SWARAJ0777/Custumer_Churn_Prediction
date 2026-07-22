"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { RefreshCw, Sparkles, AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { CustomerFeatures } from "@/lib/ai/churn-model";

interface PredictionResult {
  customerId?: string;
  probability: number;
  prediction: boolean;
  riskLevel: "Low" | "Medium" | "High";
  confidence: number;
  topPositiveFactors: { feature: string; contribution: number }[];
  topNegativeFactors: { feature: string; contribution: number }[];
}

const defaultValues: CustomerFeatures = {
  gender: "Male",
  seniorCitizen: false,
  partner: false,
  dependents: false,
  tenure: 12,
  phoneService: true,
  multipleLines: "No",
  internetService: "Fiber optic",
  onlineSecurity: "No",
  onlineBackup: "No",
  deviceProtection: "No",
  techSupport: "No",
  streamingTv: "No",
  streamingMovies: "No",
  contract: "Month-to-month",
  paperlessBilling: true,
  paymentMethod: "Electronic check",
  monthlyCharges: 75,
  totalCharges: 900,
};

const selectClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";
const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";
const labelClass = "block text-sm font-medium text-slate-700";

export function PredictionForm() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CustomerFeatures & { customerId: string }>({
    defaultValues: { ...defaultValues, customerId: "" },
  });

  const internetService = watch("internetService");
  const phoneService = watch("phoneService");

  const onSubmit = async (data: CustomerFeatures & { customerId: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          customerId: data.customerId || undefined,
        }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.message || "Prediction failed");
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset({ ...defaultValues, customerId: "" });
    setResult(null);
    setError(null);
  };

  const internetOptionsDisabled = internetService === "No";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Customer details</h2>
            <p className="text-sm text-slate-500">Enter customer information to predict churn risk.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Customer ID (optional)</label>
            <input
              type="text"
              {...register("customerId")}
              className={inputClass}
              placeholder="e.g. CUST-12345"
            />
          </div>

          <div>
            <label className={labelClass}>Gender</label>
            <select {...register("gender")} className={selectClass}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("seniorCitizen")} className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
              Senior citizen
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("partner")} className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
              Partner
            </label>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("dependents")} className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
              Dependents
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("paperlessBilling")} className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
              Paperless billing
            </label>
          </div>

          <div>
            <label className={labelClass}>Tenure (months)</label>
            <input
              type="number"
              {...register("tenure", { valueAsNumber: true, min: 0, max: 100 })}
              className={inputClass}
            />
            {errors.tenure && <p className="mt-1 text-xs text-red-600">Enter a value between 0 and 100.</p>}
          </div>

          <div>
            <label className={labelClass}>Contract type</label>
            <select {...register("contract")} className={selectClass}>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Monthly charges</label>
            <input
              type="number"
              step="0.01"
              {...register("monthlyCharges", { valueAsNumber: true, min: 0 })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Total charges</label>
            <input
              type="number"
              step="0.01"
              {...register("totalCharges", { valueAsNumber: true, min: 0 })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Payment method</label>
            <select {...register("paymentMethod")} className={selectClass}>
              <option value="Electronic check">Electronic check</option>
              <option value="Mailed check">Mailed check</option>
              <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
              <option value="Credit card (automatic)">Credit card (automatic)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Internet service</label>
            <select {...register("internetService")} className={selectClass}>
              <option value="DSL">DSL</option>
              <option value="Fiber optic">Fiber optic</option>
              <option value="No">No internet</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Phone service</label>
            <select {...register("phoneService")} className={selectClass}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Multiple lines</label>
            <select {...register("multipleLines")} className={selectClass} disabled={!phoneService}>
              <option value="No">No</option>
              <option value="No phone service">No phone service</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Online security</label>
            <select {...register("onlineSecurity")} className={selectClass} disabled={internetOptionsDisabled}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              {internetOptionsDisabled && <option value="No internet service">No internet service</option>}
            </select>
          </div>

          <div>
            <label className={labelClass}>Online backup</label>
            <select {...register("onlineBackup")} className={selectClass} disabled={internetOptionsDisabled}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              {internetOptionsDisabled && <option value="No internet service">No internet service</option>}
            </select>
          </div>

          <div>
            <label className={labelClass}>Device protection</label>
            <select {...register("deviceProtection")} className={selectClass} disabled={internetOptionsDisabled}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              {internetOptionsDisabled && <option value="No internet service">No internet service</option>}
            </select>
          </div>

          <div>
            <label className={labelClass}>Tech support</label>
            <select {...register("techSupport")} className={selectClass} disabled={internetOptionsDisabled}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              {internetOptionsDisabled && <option value="No internet service">No internet service</option>}
            </select>
          </div>

          <div>
            <label className={labelClass}>Streaming TV</label>
            <select {...register("streamingTv")} className={selectClass} disabled={internetOptionsDisabled}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              {internetOptionsDisabled && <option value="No internet service">No internet service</option>}
            </select>
          </div>

          <div>
            <label className={labelClass}>Streaming movies</label>
            <select {...register("streamingMovies")} className={selectClass} disabled={internetOptionsDisabled}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              {internetOptionsDisabled && <option value="No internet service">No internet service</option>}
            </select>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button type="submit" isLoading={loading} size="lg" className="min-w-[160px]">
            <Sparkles className="mr-2 h-4 w-4" />
            Predict churn
          </Button>
        </div>
      </form>

      {result ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-lg font-semibold text-slate-900">Prediction result</h3>
            <p className="text-sm text-slate-500">Churn probability and risk assessment.</p>

            <div className="mt-6 flex flex-col items-center">
              <GaugeChart value={result.probability} label="Churn probability" />
              <div className="mt-4 text-center">
                <Badge
                  variant={
                    result.riskLevel === "High"
                      ? "high"
                      : result.riskLevel === "Medium"
                      ? "medium"
                      : "low"
                  }
                  className="text-sm"
                >
                  {result.riskLevel} risk
                </Badge>
                <p className="mt-3 text-sm text-slate-600">
                  Prediction: <span className="font-semibold text-slate-900">{result.prediction ? "Likely to churn" : "Likely to stay"}</span>
                </p>
                <p className="text-sm text-slate-600">
                  Confidence: <span className="font-semibold text-slate-900">{result.confidence.toFixed(1)}%</span>
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-orange-600" />
                <p className="text-sm text-slate-700">
                  {result.prediction
                    ? "This customer shows signals associated with elevated churn risk. Review the key factors below and consider proactive retention actions."
                    : "This customer shows strong retention signals. Continue engagement and look for upsell opportunities."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-base font-semibold text-slate-900">Key factors</h3>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  Increasing churn risk
                </p>
                <ul className="space-y-1.5">
                  {result.topPositiveFactors.map((factor, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-700">{factor.feature}</span>
                      <span className="font-medium text-red-700">+{(factor.contribution * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                  {result.topPositiveFactors.length === 0 && (
                    <li className="text-sm text-slate-500">No significant risk-increasing factors.</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Reducing churn risk
                </p>
                <ul className="space-y-1.5">
                  {result.topNegativeFactors.map((factor, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-700">{factor.feature}</span>
                      <span className="font-medium text-emerald-700">-{(factor.contribution * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                  {result.topNegativeFactors.length === 0 && (
                    <li className="text-sm text-slate-500">No significant risk-reducing factors.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-4 font-medium text-slate-900">No prediction yet</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Fill in the customer details and click Predict churn to see the result.
          </p>
        </div>
      )}
    </div>
  );
}
