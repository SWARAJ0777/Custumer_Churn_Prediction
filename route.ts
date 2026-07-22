import { NextResponse } from "next/server";
import { z } from "zod";
import { predictChurn } from "@/lib/ai/churn-model";
import { db } from "@/db";
import { predictions } from "@/db/schema";

const predictionSchema = z.object({
  customerId: z.string().min(1).max(32).optional(),
  gender: z.enum(["Male", "Female"]),
  seniorCitizen: z.boolean(),
  partner: z.boolean(),
  dependents: z.boolean(),
  tenure: z.number().int().min(0).max(100),
  phoneService: z.boolean(),
  multipleLines: z.enum(["No", "No phone service", "Yes"]),
  internetService: z.enum(["DSL", "Fiber optic", "No"]),
  onlineSecurity: z.enum(["No", "No internet service", "Yes"]),
  onlineBackup: z.enum(["No", "No internet service", "Yes"]),
  deviceProtection: z.enum(["No", "No internet service", "Yes"]),
  techSupport: z.enum(["No", "No internet service", "Yes"]),
  streamingTv: z.enum(["No", "No internet service", "Yes"]),
  streamingMovies: z.enum(["No", "No internet service", "Yes"]),
  contract: z.enum(["Month-to-month", "One year", "Two year"]),
  paperlessBilling: z.boolean(),
  paymentMethod: z.enum([
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)",
  ]),
  monthlyCharges: z.number().min(0).max(500),
  totalCharges: z.number().min(0),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = predictionSchema.parse(body);

    const result = predictChurn(validated);

    await db.insert(predictions).values({
      customerId: validated.customerId || "WEB-PREDICTION",
      probability: result.probability,
      prediction: result.prediction,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      topPositiveFactors: result.topPositiveFactors,
      topNegativeFactors: result.topNegativeFactors,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        customerId: validated.customerId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Prediction error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process prediction" },
      { status: 500 }
    );
  }
}
