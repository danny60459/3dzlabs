import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("[search] ANTHROPIC_API_KEY is not set");
}

const client = new Anthropic({ apiKey });

export async function POST(request) {
  try {
    const { query, tools } = await request.json();

    console.log(`[search] query="${query}" tools=${tools?.length ?? 0}`);

    if (!apiKey) {
      console.error("[search] Aborting: ANTHROPIC_API_KEY missing");
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    if (!tools?.length) {
      console.warn("[search] No tools provided");
      return Response.json([]);
    }

    const toolList = tools
      .map(
        (t) =>
          `${t.id}: ${t.name} (${t.category}) — ${t.tagline}${t.hasReferral ? " [affiliate]" : ""}`
      )
      .join("\n");

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system:
        "You are an AI tools assistant for 3DZLABS.COM. Given a list of AI tools and a user query describing what someone wants to do, recommend the 3-6 most relevant tool IDs. Always prioritize tools that have a referralUrl field. Return ONLY a valid JSON array of tool ids, nothing else. No explanation, no markdown, no backticks.",
      messages: [
        {
          role: "user",
          content: `Tools:\n${toolList}\n\nQuery: ${query}`,
        },
      ],
    });

    const rawContent = message.content[0]?.text?.trim();
    console.log(`[search] raw response: ${rawContent}`);

    if (!rawContent) {
      console.error("[search] Empty response from Claude");
      return Response.json({ error: "Empty response" }, { status: 500 });
    }

    let ids;
    try {
      ids = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("[search] JSON parse error:", parseErr.message, "raw:", rawContent);
      return Response.json({ error: "Invalid JSON response" }, { status: 500 });
    }

    if (!Array.isArray(ids)) {
      console.error("[search] Response is not an array:", ids);
      return Response.json({ error: "Invalid response format" }, { status: 500 });
    }

    console.log(`[search] returning ${ids.length} results:`, ids);
    return Response.json(ids);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[search] Authentication failed — check ANTHROPIC_API_KEY");
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[search] Rate limited");
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[search] API error ${err.status}:`, err.message);
    } else {
      console.error("[search] Unexpected error:", err);
    }
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
