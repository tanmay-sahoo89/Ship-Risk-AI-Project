import type { Shipment } from "../types/shipment";
import type { ShipmentAlert } from "../types/alert";
import type { Recommendation } from "../types/risk";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";

interface AIResponse {
  summary: string;
  source: string;
}

export interface ShipmentContext {
  shipment: Shipment;
  alerts?: ShipmentAlert[];
  recommendations?: Recommendation[];
}

/**
 * Build a context prompt from shipment data for the AI
 */
function buildPrompt(context: ShipmentContext, query: string): string {
  const s = context.shipment;
  const delayProb = s.delay_probability ?? 0;
  const progress = s.days_in_transit ?? 0;
  const total = s.planned_transit_days ?? 1;
  const pct = Math.min(Math.round((progress / total) * 100), 100);

  let prompt =
    `You are an expert logistics advisor for Ship Risk AI platform. ` +
    `Provide clear, actionable insights about shipments. ` +
    `Keep responses concise (2-4 sentences). Answer the user's specific question.\n\n` +
    `SHIPMENT DATA:\n` +
    `- ID: ${s.shipment_id}\n` +
    `- Carrier: ${s.carrier} (reliability: ${((s.carrier_reliability_score ?? 0) * 100).toFixed(0)}%)\n` +
    `- Route: ${s.origin} → ${s.destination}\n` +
    `- Transport Mode: ${s.transport_mode}\n` +
    `- Status: ${s.shipment_status || "In Transit"}\n` +
    `- Shipped: ${s.shipment_date}\n` +
    `- ETA: ${s.planned_eta}\n` +
    `- Progress: ${progress}/${total} days (${pct}%)\n` +
    `- Delay Probability: ${(delayProb * 100).toFixed(1)}%\n` +
    `- Is Delayed: ${s.is_delayed ? `Yes, by ${s.actual_delay_hours?.toFixed(1)} hours` : "No"}\n` +
    `- Weather: ${s.weather_condition} (severity: ${s.weather_severity_score ?? 0}/10)\n` +
    `- Traffic Congestion: ${s.traffic_congestion_level ?? 0}/10\n` +
    `- Port Congestion: ${s.port_congestion_score ?? 0}/10\n` +
    `- Historical Delay Rate: ${((s.historical_delay_rate ?? 0) * 100).toFixed(1)}%\n` +
    `- Route Risk Score: ${((s.route_risk_score ?? 0) * 100).toFixed(0)}%\n` +
    `- Disruption: ${s.disruption_type || "None"} (impact: ${s.disruption_impact_score ?? 0}/10)\n` +
    `- Package Weight: ${s.package_weight_kg ?? 0} kg\n` +
    `- Stops: ${s.num_stops ?? 0}\n` +
    `- Customs Required: ${s.customs_clearance_flag ? "Yes" : "No"}\n\n`;

  if (context.alerts && context.alerts.length > 0) {
    prompt += `ACTIVE ALERTS (${context.alerts.length}):\n`;
    context.alerts.slice(0, 3).forEach((a) => {
      prompt += `- ${a.risk_tier}: ${Array.isArray(a.top_risk_factors) ? a.top_risk_factors.join(", ") : "N/A"}\n`;
    });
    prompt += "\n";
  }

  if (context.recommendations && context.recommendations.length > 0) {
    prompt += `RECOMMENDATIONS (${context.recommendations.length}):\n`;
    context.recommendations.slice(0, 3).forEach((r) => {
      prompt +=
        `- ${r.primary_action || "Action"}: ${r.primary_description || "N/A"}\n` +
        `  Cost: ${r.cost_impact || "N/A"}, Time saving: ${r.estimated_time_saving || "N/A"}, ` +
        `Confidence: ${r.confidence || "N/A"}\n`;
      if (r.reasoning && r.reasoning.length > 0) {
        prompt += `  Reasoning: ${r.reasoning.slice(0, 2).join("; ")}\n`;
      }
    });
    prompt += "\n";
  }

  prompt += `USER QUESTION: ${query}\n\nAnswer:`;
  return prompt;
}

/**
 * Call Gemini API directly from the browser
 */
async function callGeminiDirect(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key not configured. Set VITE_GEMINI_API_KEY in your environment.",
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = "";
    try {
      const parsed = JSON.parse(errorText);
      detail = parsed?.error?.message || errorText;
    } catch {
      detail = errorText;
    }
    throw new Error(`Gemini API error (${response.status}): ${detail}`);
  }

  const data = await response.json();
  const candidates = data.candidates || [];
  if (candidates.length > 0) {
    const parts = candidates[0]?.content?.parts || [];
    if (parts.length > 0) {
      return parts[0].text || "";
    }
  }

  throw new Error("No response from Gemini");
}

// ── Query-aware fallback engine ───────────────────────────────────────────────

type QueryCategory =
  | "summary"
  | "risks"
  | "recommendations"
  | "eta"
  | "actions"
  | "general";

function classifyQuery(query: string): QueryCategory {
  const q = query.toLowerCase();
  if (q.includes("summar") || q.includes("overview") || q.includes("status"))
    return "summary";
  if (
    q.includes("risk") ||
    q.includes("danger") ||
    q.includes("threat") ||
    q.includes("problem")
  )
    return "risks";
  if (
    q.includes("recommend") ||
    q.includes("accept") ||
    q.includes("suggestion")
  )
    return "recommendations";
  if (
    q.includes("arrive") ||
    q.includes("eta") ||
    q.includes("when") ||
    q.includes("deliver") ||
    q.includes("time")
  )
    return "eta";
  if (
    q.includes("action") ||
    q.includes("should") ||
    q.includes("do") ||
    q.includes("step") ||
    q.includes("fix")
  )
    return "actions";
  return "general";
}

function generateFallbackSummary(ctx: ShipmentContext): string {
  const s = ctx.shipment;
  const delayProb = s.delay_probability ?? 0;
  const riskLevel =
    delayProb >= 0.9
      ? "CRITICAL"
      : delayProb >= 0.6
        ? "HIGH"
        : delayProb >= 0.3
          ? "MEDIUM"
          : "LOW";
  const progress = s.days_in_transit ?? 0;
  const total = s.planned_transit_days ?? 1;
  const pct = Math.min(Math.round((progress / total) * 100), 100);

  let result =
    `Shipment ${s.shipment_id} is traveling from ${s.origin} to ${s.destination} ` +
    `via ${s.carrier} (${s.transport_mode}). ` +
    `It is currently ${pct}% through its planned ${total}-day transit. `;

  if (s.is_delayed) {
    result += `The shipment is currently delayed by ${s.actual_delay_hours?.toFixed(1)} hours. `;
  }

  result += `Overall risk level: ${riskLevel} with ${(delayProb * 100).toFixed(0)}% delay probability. `;

  if (s.weather_condition && s.weather_condition !== "Clear") {
    result += `Weather: ${s.weather_condition} (severity ${s.weather_severity_score}/10). `;
  }
  if (s.disruption_type && s.disruption_type !== "None") {
    result += `Active disruption: ${s.disruption_type} (impact ${s.disruption_impact_score}/10). `;
  }

  return result;
}

function generateFallbackRisks(ctx: ShipmentContext): string {
  const s = ctx.shipment;
  const risks: string[] = [];

  if ((s.weather_severity_score ?? 0) >= 5) {
    risks.push(
      `${s.weather_condition} weather with severity ${s.weather_severity_score}/10 poses a significant risk`,
    );
  } else if (s.weather_condition && s.weather_condition !== "Clear") {
    risks.push(
      `${s.weather_condition} weather (severity ${s.weather_severity_score}/10) is a moderate concern`,
    );
  }

  if (s.disruption_type && s.disruption_type !== "None") {
    risks.push(
      `${s.disruption_type} disruption with impact score ${s.disruption_impact_score}/10`,
    );
  }

  if ((s.traffic_congestion_level ?? 0) >= 6) {
    risks.push(
      `High traffic congestion (level ${s.traffic_congestion_level}/10)`,
    );
  }

  if ((s.port_congestion_score ?? 0) >= 6) {
    risks.push(
      `Port congestion is elevated at ${s.port_congestion_score}/10`,
    );
  }

  if ((s.carrier_reliability_score ?? 1) < 0.7) {
    risks.push(
      `Carrier reliability is below average at ${((s.carrier_reliability_score ?? 0) * 100).toFixed(0)}%`,
    );
  }

  if ((s.historical_delay_rate ?? 0) > 0.3) {
    risks.push(
      `Historical delay rate for this route is ${((s.historical_delay_rate ?? 0) * 100).toFixed(1)}%`,
    );
  }

  if ((s.route_risk_score ?? 0) > 0.5) {
    risks.push(
      `Route risk score is elevated at ${((s.route_risk_score ?? 0) * 100).toFixed(0)}%`,
    );
  }

  if (risks.length === 0) {
    return `Shipment ${s.shipment_id} has minimal risk factors. Weather is ${s.weather_condition || "Clear"}, no active disruptions, and the carrier has a ${((s.carrier_reliability_score ?? 0) * 100).toFixed(0)}% reliability score. The shipment is on track.`;
  }

  const topRisks = risks.slice(0, 4);
  return (
    `Key risk factors for ${s.shipment_id}:\n\n` +
    topRisks.map((r, i) => `${i + 1}. ${r}`).join("\n") +
    `\n\nOverall delay probability: ${((s.delay_probability ?? 0) * 100).toFixed(0)}%.`
  );
}

function generateFallbackRecommendations(ctx: ShipmentContext): string {
  const recs = ctx.recommendations || [];
  if (recs.length === 0) {
    return `No specific recommendations are available for ${ctx.shipment.shipment_id} at this time. The current risk level is ${((ctx.shipment.delay_probability ?? 0) * 100).toFixed(0)}% delay probability.`;
  }

  let result = `There are ${recs.length} recommendation(s) for ${ctx.shipment.shipment_id}:\n\n`;
  recs.slice(0, 3).forEach((r, i) => {
    result += `${i + 1}. **${r.primary_action}**: ${r.primary_description || "N/A"}\n`;
    result += `   - Cost impact: ${r.cost_impact || "N/A"}\n`;
    result += `   - Estimated time saving: ${r.estimated_time_saving || "N/A"}\n`;
    result += `   - Confidence: ${r.confidence || "N/A"}\n`;
    if (r.fallback_action) {
      result += `   - Alternative: ${r.fallback_action}\n`;
    }
    result += "\n";
  });

  const highConf = recs.filter(
    (r) => r.confidence === "HIGH" || r.confidence === "VERY_HIGH",
  );
  if (highConf.length > 0) {
    result += `${highConf.length} recommendation(s) have high confidence and are advisable to accept.`;
  } else {
    result += `Review each recommendation carefully against the specific risk factors before accepting.`;
  }

  return result;
}

function generateFallbackETA(ctx: ShipmentContext): string {
  const s = ctx.shipment;
  const progress = s.days_in_transit ?? 0;
  const total = s.planned_transit_days ?? 1;
  const remaining = Math.max(0, total - progress);
  const delayProb = s.delay_probability ?? 0;

  let result =
    `Planned ETA: ${s.planned_eta}. ` +
    `The shipment has been in transit for ${progress} of ${total} planned days (${remaining} days remaining). `;

  if (s.is_delayed) {
    result +=
      `The shipment is currently delayed by ${s.actual_delay_hours?.toFixed(1)} hours. ` +
      `Expect arrival after the planned ETA. `;
  } else if (delayProb >= 0.7) {
    const estDelay = Math.round(delayProb * 48);
    result +=
      `With ${(delayProb * 100).toFixed(0)}% delay probability, a delay of approximately ${estDelay} hours is likely. ` +
      `Consider proactive measures to mitigate impact. `;
  } else if (delayProb >= 0.3) {
    result += `There is a moderate chance (${(delayProb * 100).toFixed(0)}%) of delay. Monitor closely. `;
  } else {
    result += `The shipment is on track for on-time delivery with only ${(delayProb * 100).toFixed(0)}% delay risk. `;
  }

  if (
    s.weather_condition &&
    s.weather_condition !== "Clear" &&
    (s.weather_severity_score ?? 0) >= 5
  ) {
    result += `Severe ${s.weather_condition} may extend transit time.`;
  }

  return result;
}

function generateFallbackActions(ctx: ShipmentContext): string {
  const s = ctx.shipment;
  const delayProb = s.delay_probability ?? 0;
  const actions: string[] = [];

  if (delayProb >= 0.7) {
    actions.push("Notify the customer about potential delivery delays immediately");
    actions.push("Contact the carrier for a status update and priority handling");
  }

  if (s.weather_condition && s.weather_condition !== "Clear" && (s.weather_severity_score ?? 0) >= 5) {
    actions.push(
      `Monitor ${s.weather_condition} conditions along the route and consider route adjustment`,
    );
  }

  if (s.disruption_type && s.disruption_type !== "None") {
    actions.push(
      `Assess impact of ${s.disruption_type} and activate contingency plans`,
    );
  }

  if ((s.port_congestion_score ?? 0) >= 7) {
    actions.push("Consider pre-clearing customs documentation to avoid port delays");
  }

  if (s.customs_clearance_flag && (s.port_congestion_score ?? 0) >= 5) {
    actions.push("Fast-track customs documentation to prevent clearance delays");
  }

  const recs = ctx.recommendations || [];
  if (recs.length > 0) {
    const topRec = recs[0];
    actions.push(
      `Review and implement recommended action: "${topRec.primary_action}" (${topRec.estimated_time_saving || "N/A"} time saving)`,
    );
  }

  if (delayProb < 0.3 && actions.length === 0) {
    return `Shipment ${s.shipment_id} is low risk (${(delayProb * 100).toFixed(0)}% delay probability). No immediate action required. Continue standard monitoring.`;
  }

  if (actions.length === 0) {
    actions.push("Continue monitoring shipment status");
    actions.push("Keep stakeholders informed of delivery timeline");
  }

  return (
    `Recommended actions for ${s.shipment_id}:\n\n` +
    actions.map((a, i) => `${i + 1}. ${a}`).join("\n")
  );
}

function generateFallback(context: ShipmentContext, query: string): string {
  const category = classifyQuery(query);

  switch (category) {
    case "summary":
      return generateFallbackSummary(context);
    case "risks":
      return generateFallbackRisks(context);
    case "recommendations":
      return generateFallbackRecommendations(context);
    case "eta":
      return generateFallbackETA(context);
    case "actions":
      return generateFallbackActions(context);
    default:
      return generateFallbackSummary(context);
  }
}

// ── API integration ───────────────────────────────────────────────────────────

async function tryBackendAPI(
  shipmentId: string,
  query: string,
): Promise<AIResponse | null> {
  if (!API_BASE) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE}/api/ai/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: shipmentId, query }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Main entry point — generates AI summary for a shipment
 */
export async function generateAISummary(
  shipmentId: string,
  query: string,
  context?: ShipmentContext,
): Promise<AIResponse> {
  // 1. Try backend API (works when FastAPI is running locally)
  const backendResult = await tryBackendAPI(shipmentId, query);
  if (backendResult) return backendResult;

  // 2. Try Gemini directly from browser
  if (GEMINI_API_KEY && context) {
    try {
      const prompt = buildPrompt(context, query);
      const summary = await callGeminiDirect(prompt);
      return { summary: summary.trim(), source: "gemini" };
    } catch (err) {
      console.warn("Gemini direct call failed:", err);
      // If Gemini fails, show the error but also provide fallback
      const geminiError =
        err instanceof Error ? err.message : "Unknown Gemini error";
      console.error("Gemini error detail:", geminiError);
    }
  }

  // 3. Smart rule-based fallback (query-aware, always works with shipment data)
  if (context) {
    return { summary: generateFallback(context, query), source: "fallback" };
  }

  throw new Error(
    "AI Advisor unavailable. Configure VITE_GEMINI_API_KEY for cloud AI, or run the backend locally.",
  );
}
