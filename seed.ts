import "dotenv/config";
import { db } from "../src/db";
import { customers, predictions } from "../src/db/schema";
import { predictChurn, type CustomerFeatures } from "../src/lib/ai/churn-model";
import { generateSampleCustomers } from "../src/lib/data/sample-data";
import { sql } from "drizzle-orm";

async function seed() {
  const existing = await db.select({ count: sql<number>`count(*)` }).from(customers);
  if (existing[0].count > 0) {
    console.log("Database already contains customer data. Skipping seed.");
    process.exit(0);
  }

  const sampleCustomers = generateSampleCustomers(200);

  await db.insert(customers).values(sampleCustomers);

  const predictionsData = sampleCustomers.map((customer) => {
    const prediction = predictChurn(customer);
    return {
      customerId: customer.customerId,
      probability: prediction.probability,
      prediction: prediction.prediction,
      riskLevel: prediction.riskLevel,
      confidence: prediction.confidence,
      topPositiveFactors: prediction.topPositiveFactors,
      topNegativeFactors: prediction.topNegativeFactors,
    };
  });

  await db.insert(predictions).values(predictionsData);

  console.log(`Seeded ${sampleCustomers.length} customers and predictions.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
