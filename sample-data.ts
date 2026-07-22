import type { CustomerFeatures } from "@/lib/ai/churn-model";

export interface SampleCustomer extends CustomerFeatures {
  customerId: string;
  churn: boolean;
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randBool(prob = 0.5): boolean {
  return Math.random() < prob;
}

const GENDERS: CustomerFeatures["gender"][] = ["Male", "Female"];
const MULTIPLE_LINES: CustomerFeatures["multipleLines"][] = [
  "No",
  "No phone service",
  "Yes",
];
const INTERNET_SERVICE: CustomerFeatures["internetService"][] = [
  "DSL",
  "Fiber optic",
  "No",
];
const YES_NO_INTERNET: CustomerFeatures["onlineSecurity"][] = [
  "No",
  "No internet service",
  "Yes",
];
const CONTRACT: CustomerFeatures["contract"][] = [
  "Month-to-month",
  "One year",
  "Two year",
];
const PAYMENT_METHOD: CustomerFeatures["paymentMethod"][] = [
  "Electronic check",
  "Mailed check",
  "Bank transfer (automatic)",
  "Credit card (automatic)",
];

export function generateSampleCustomers(count = 200): SampleCustomer[] {
  const customers: SampleCustomer[] = [];

  for (let i = 0; i < count; i++) {
    const tenure = randInt(1, 72);
    const contract = rand(CONTRACT);
    const internetService = rand(INTERNET_SERVICE);
    const paymentMethod = rand(PAYMENT_METHOD);
    const monthlyCharges =
      internetService === "No"
        ? randInt(20, 60)
        : internetService === "DSL"
        ? randInt(40, 90)
        : randInt(60, 120);
    const totalCharges = Math.round(monthlyCharges * tenure * (0.9 + Math.random() * 0.2));

    const customer: SampleCustomer = {
      customerId: `CUST-${String(i + 1).padStart(5, "0")}`,
      gender: rand(GENDERS),
      seniorCitizen: randBool(0.16),
      partner: randBool(0.48),
      dependents: randBool(0.3),
      tenure,
      phoneService: randBool(0.9),
      multipleLines: rand(MULTIPLE_LINES),
      internetService,
      onlineSecurity: internetService === "No" ? "No internet service" : rand(YES_NO_INTERNET),
      onlineBackup: internetService === "No" ? "No internet service" : rand(YES_NO_INTERNET),
      deviceProtection: internetService === "No" ? "No internet service" : rand(YES_NO_INTERNET),
      techSupport: internetService === "No" ? "No internet service" : rand(YES_NO_INTERNET),
      streamingTv: internetService === "No" ? "No internet service" : rand(YES_NO_INTERNET),
      streamingMovies: internetService === "No" ? "No internet service" : rand(YES_NO_INTERNET),
      contract,
      paperlessBilling: randBool(0.59),
      paymentMethod,
      monthlyCharges,
      totalCharges,
      churn: false,
    };

    // Simulate churn with realistic rules
    let churnScore = 0;
    if (contract === "Month-to-month") churnScore += 0.35;
    if (contract === "One year") churnScore += 0.12;
    if (internetService === "Fiber optic") churnScore += 0.25;
    if (paymentMethod === "Electronic check") churnScore += 0.18;
    if (tenure < 12) churnScore += 0.22;
    else if (tenure < 24) churnScore += 0.1;
    if (customer.onlineSecurity === "No") churnScore += 0.12;
    if (customer.techSupport === "No") churnScore += 0.1;
    if (monthlyCharges > 80) churnScore += 0.1;
    if (customer.seniorCitizen) churnScore += 0.06;

    customer.churn = Math.random() < churnScore;
    customers.push(customer);
  }

  return customers;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
