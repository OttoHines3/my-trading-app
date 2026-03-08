import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { name, impact, forecast, previous, time, day } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Missing event name" }, { status: 400 });
    }

    const prompt = `You are an expert macro-economist and market strategist. Analyze the following upcoming economic data release and explain its significance.

Economic Release: ${name}
Scheduled: ${day}, ${time}
Impact Level: ${impact}
Forecast: ${forecast}
Previous: ${previous}

Provide your analysis in the following structure. Use markdown formatting.

## What This Report Measures
A brief 2-3 sentence explanation of what this economic indicator measures and how it's calculated.

## Why It Matters
Explain why traders and investors care about this release. What does it tell us about the economy? (3-4 sentences)

## Market Impact Scenarios

### If the number comes in ABOVE forecast (${forecast})
- **Stocks**: How would equities likely react and why?
- **Bonds/Yields**: Expected move in treasury yields?
- **US Dollar**: Stronger or weaker and why?
- **Fed Policy Implications**: How does this affect rate expectations?

### If the number comes in BELOW forecast (${forecast})
- **Stocks**: How would equities likely react and why?
- **Bonds/Yields**: Expected move in treasury yields?
- **US Dollar**: Stronger or weaker and why?
- **Fed Policy Implications**: How does this affect rate expectations?

## Historical Context
Compare the forecast (${forecast}) to the previous reading (${previous}). What trend does this suggest? Is the economy strengthening or weakening based on this series? (2-3 sentences)

## Key Sectors to Watch
List 3-4 stock sectors or asset classes that are most sensitive to this particular release and briefly explain why.

Keep the analysis practical and actionable for a day trader or swing trader. Be specific about likely price reactions rather than vague.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return NextResponse.json({ analysis: text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Analysis API error:", msg);

    if (msg.includes("API key") || msg.includes("authentication") || msg.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is missing or invalid. Add it to .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `Analysis failed: ${msg}` },
      { status: 500 }
    );
  }
}
