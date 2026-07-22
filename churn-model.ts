export interface CustomerFeatures {
  gender: "Male" | "Female";
  seniorCitizen: boolean;
  partner: boolean;
  dependents: boolean;
  tenure: number;
  phoneService: boolean;
  multipleLines: "No" | "No phone service" | "Yes";
  internetService: "DSL" | "Fiber optic" | "No";
  onlineSecurity: "No" | "No internet service" | "Yes";
  onlineBackup: "No" | "No internet service" | "Yes";
  deviceProtection: "No" | "No internet service" | "Yes";
  techSupport: "No" | "No internet service" | "Yes";
  streamingTv: "No" | "No internet service" | "Yes";
  streamingMovies: "No" | "No internet service" | "Yes";
  contract: "Month-to-month" | "One year" | "Two year";
  paperlessBilling: boolean;
  paymentMethod:
    | "Electronic check"
    | "Mailed check"
    | "Bank transfer (automatic)"
    | "Credit card (automatic)";
  monthlyCharges: number;
  totalCharges: number;
}

const MODEL_MEAN: Record<string, number> = {
  tenure: 32.4,
  monthlyCharges: 64.8,
  totalCharges: 2283.3,
};

const MODEL_STD: Record<string, number> = {
  tenure: 24.6,
  monthlyCharges: 30.1,
  totalCharges: 2266.8,
};

function zScore(value: number, key: string): number {
  return (value - MODEL_MEAN[key]) / MODEL_STD[key];
}

const WEIGHTS: Record<string, number> = {
  bias: -0.85,
  tenureScaled: -0.92,
  monthlyChargesScaled: 0.62,
  totalChargesScaled: -0.34,
  seniorCitizen: 0.38,
  partner: -0.31,
  dependents: -0.28,
  paperlessBilling: 0.22,
  genderMale: 0.05,
  phoneService: 0.12,
  multipleLinesYes: 0.15,
  internetServiceFiber: 0.88,
  internetServiceDsl: 0.08,
  onlineSecurityYes: -0.55,
  onlineBackupYes: -0.22,
  deviceProtectionYes: -0.18,
  techSupportYes: -0.48,
  streamingTvYes: 0.12,
  streamingMoviesYes: 0.1,
  contractOneYear: -0.72,
  contractTwoYear: -1.18,
  paymentMethodElectronicCheck: 0.52,
  paymentMethodMailedCheck: 0.08,
  paymentMethodBankTransfer: -0.15,
};

export interface FeatureContribution {
  feature: string;
  contribution: number;
}

export interface PredictionResult {
  probability: number;
  prediction: boolean;
  riskLevel: "Low" | "Medium" | "High";
  confidence: number;
  topPositiveFactors: FeatureContribution[];
  topNegativeFactors: FeatureContribution[];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function predictChurn(features: CustomerFeatures): PredictionResult {
  const contributions: FeatureContribution[] = [
    { feature: "Bias", contribution: WEIGHTS.bias },
    {
      feature: "Tenure",
      contribution: WEIGHTS.tenureScaled * zScore(features.tenure, "tenure"),
    },
    {
      feature: "Monthly charges",
      contribution:
        WEIGHTS.monthlyChargesScaled * zScore(features.monthlyCharges, "monthlyCharges"),
    },
    {
      feature: "Total charges",
      contribution:
        WEIGHTS.totalChargesScaled * zScore(features.totalCharges, "totalCharges"),
    },
  ];

  if (features.seniorCitizen)
    contributions.push({ feature: "Senior citizen", contribution: WEIGHTS.seniorCitizen });
  if (features.partner)
    contributions.push({ feature: "Has partner", contribution: WEIGHTS.partner });
  if (features.dependents)
    contributions.push({ feature: "Has dependents", contribution: WEIGHTS.dependents });
  if (features.paperlessBilling)
    contributions.push({
      feature: "Paperless billing",
      contribution: WEIGHTS.paperlessBilling,
    });
  if (features.gender === "Male")
    contributions.push({ feature: "Gender (Male)", contribution: WEIGHTS.genderMale });
  if (features.phoneService)
    contributions.push({ feature: "Phone service", contribution: WEIGHTS.phoneService });
  if (features.multipleLines === "Yes")
    contributions.push({ feature: "Multiple lines", contribution: WEIGHTS.multipleLinesYes });

  if (features.internetService === "Fiber optic")
    contributions.push({
      feature: "Fiber optic internet",
      contribution: WEIGHTS.internetServiceFiber,
    });
  else if (features.internetService === "DSL")
    contributions.push({
      feature: "DSL internet",
      contribution: WEIGHTS.internetServiceDsl,
    });

  if (features.onlineSecurity === "Yes")
    contributions.push({
      feature: "Online security enabled",
      contribution: WEIGHTS.onlineSecurityYes,
    });
  if (features.onlineBackup === "Yes")
    contributions.push({
      feature: "Online backup enabled",
      contribution: WEIGHTS.onlineBackupYes,
    });
  if (features.deviceProtection === "Yes")
    contributions.push({
      feature: "Device protection enabled",
      contribution: WEIGHTS.deviceProtectionYes,
    });
  if (features.techSupport === "Yes")
    contributions.push({
      feature: "Tech support enabled",
      contribution: WEIGHTS.techSupportYes,
    });
  if (features.streamingTv === "Yes")
    contributions.push({
      feature: "Streaming TV",
      contribution: WEIGHTS.streamingTvYes,
    });
  if (features.streamingMovies === "Yes")
    contributions.push({
      feature: "Streaming movies",
      contribution: WEIGHTS.streamingMoviesYes,
    });

  if (features.contract === "One year")
    contributions.push({
      feature: "One-year contract",
      contribution: WEIGHTS.contractOneYear,
    });
  else if (features.contract === "Two year")
    contributions.push({
      feature: "Two-year contract",
      contribution: WEIGHTS.contractTwoYear,
    });

  if (features.paymentMethod === "Electronic check")
    contributions.push({
      feature: "Pays by electronic check",
      contribution: WEIGHTS.paymentMethodElectronicCheck,
    });
  else if (features.paymentMethod === "Mailed check")
    contributions.push({
      feature: "Pays by mailed check",
      contribution: WEIGHTS.paymentMethodMailedCheck,
    });
  else if (features.paymentMethod === "Bank transfer (automatic)")
    contributions.push({
      feature: "Automatic bank transfer",
      contribution: WEIGHTS.paymentMethodBankTransfer,
    });

  const logit = contributions.reduce((sum, c) => sum + c.contribution, 0);
  const probability = sigmoid(logit);
  const prediction = probability >= 0.5;

  let riskLevel: "Low" | "Medium" | "High";
  if (probability < 0.35) riskLevel = "Low";
  else if (probability < 0.65) riskLevel = "Medium";
  else riskLevel = "High";

  const confidence = prediction
    ? Math.round(probability * 1000) / 10
    : Math.round((1 - probability) * 1000) / 10;

  const sorted = [...contributions].sort((a, b) => b.contribution - a.contribution);
  const topPositiveFactors = sorted
    .filter((c) => c.contribution > 0)
    .slice(0, 5)
    .map((c) => ({ feature: c.feature, contribution: Math.round(c.contribution * 1000) / 1000 }));
  const topNegativeFactors = sorted
    .filter((c) => c.contribution < 0)
    .slice(-5)
    .map((c) => ({ feature: c.feature, contribution: Math.round(Math.abs(c.contribution) * 1000) / 1000 }));

  return {
    probability: Math.round(probability * 1000) / 1000,
    prediction,
    riskLevel,
    confidence,
    topPositiveFactors,
    topNegativeFactors,
  };
}

export function recommendedAction(riskLevel: "Low" | "Medium" | "High"): string {
  switch (riskLevel) {
    case "High":
      return "Immediate retention outreach. Offer discount, contract upgrade, or personalized support.";
    case "Medium":
      return "Monitor closely. Send satisfaction survey and targeted loyalty offer.";
    case "Low":
      return "Low priority. Include in regular engagement and upsell campaigns.";
  }
}

export const FEATURE_IMPORTANCE: FeatureContribution[] = [
  { feature: "Tenure", contribution: 0.92 },
  { feature: "Contract type", contribution: 0.88 },
  { feature: "Internet service", contribution: 0.78 },
  { feature: "Monthly charges", contribution: 0.62 },
  { feature: "Payment method", contribution: 0.48 },
  { feature: "Online security", contribution: 0.45 },
  { feature: "Tech support", contribution: 0.41 },
  { feature: "Total charges", contribution: 0.34 },
  { feature: "Senior citizen", contribution: 0.28 },
  { feature: "Dependents", contribution: 0.22 },
];
