import { NextResponse } from 'next/server';

function generateSimulatedAIAnalysis(title: string, description: string) {
  // We simulate an AI doing a professional market analysis
  const combined = (title + " " + description).toLowerCase();
  
  let keyTakeaways = [];
  let impact = "Neutral";
  let impactColor = "var(--text-muted)";
  let analysis = "";

  if (combined.includes('surge') || combined.includes('rally') || combined.includes('gain') || combined.includes('rise')) {
    impact = "Bullish";
    impactColor = "var(--success)";
    keyTakeaways = [
      "Positive upward momentum detected in price action.",
      "Market sentiment strongly favors buyers.",
      "Potential for continued growth in the short term."
    ];
    analysis = `Our AI models interpret this news as a highly bullish signal for the market. The mention of positive growth and upward trends suggests strong investor confidence. Traders might look for continuation patterns, while long-term investors can see this as a validation of underlying fundamentals.`;
  } else if (combined.includes('fall') || combined.includes('drop') || combined.includes('plunge') || combined.includes('loss') || combined.includes('crash')) {
    impact = "Bearish";
    impactColor = "var(--critical)";
    keyTakeaways = [
      "Downward pressure on asset prices indicated.",
      "Risk-off sentiment is dominating the current session.",
      "Investors should exercise caution and review stop-losses."
    ];
    analysis = `Our AI analysis flags this event as a bearish catalyst. The language indicates significant selling pressure and heightened market anxiety. In the short term, volatility is expected to increase. Defensive posturing and capital preservation strategies are recommended until stabilization occurs.`;
  } else if (combined.includes('rate') || combined.includes('fed') || combined.includes('inflation') || combined.includes('economy')) {
    impact = "Macro/Volatility";
    impactColor = "var(--warning)";
    keyTakeaways = [
      "Macroeconomic factors are currently driving market movement.",
      "High likelihood of broad market volatility.",
      "Interest rate and inflation narratives remain central."
    ];
    analysis = `This news represents a significant macroeconomic development. Our natural language processing models suggest that broad market indices will react to this systemic news. Volatility across equities, bonds, and currencies is highly probable as markets price in this new macroeconomic data.`;
  } else {
    impact = "Neutral / Mixed";
    impactColor = "var(--text-muted)";
    keyTakeaways = [
      "Event is likely priced in by the market.",
      "No immediate directional catalyst identified.",
      "Sector-specific impacts may vary."
    ];
    analysis = `Our AI sentiment engine categorizes this news as neutral. While informative, it lacks the explicit directional catalysts required to immediately move broader markets. The impact is likely to be isolated to specific companies or sub-sectors rather than causing a macro shift.`;
  }

  // Adding some realistic looking "AI metrics"
  const confidenceScore = Math.floor(Math.random() * 15) + 85; // 85-99%
  const processingTime = (Math.random() * 0.4 + 0.1).toFixed(2); // 0.10s - 0.50s

  return {
    impact,
    impactColor,
    keyTakeaways,
    analysis,
    metrics: {
      confidenceScore: `${confidenceScore}%`,
      processingTime: `${processingTime}s`,
      model: "Fin-AI-Analyzer-v3"
    }
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const analysis = generateSimulatedAIAnalysis(title, description || '');

    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
