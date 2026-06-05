import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { query, tools } = await request.json();

    const toolList = tools
      .map(
        (t) =>
          `${t.id}: ${t.name} (${t.category}) — ${t.tagline}${t.hasReferral ? " [affiliate]" : ""}`
      )
      .join("\n");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
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

    const content = message.content[0].text.trim();
    const ids = JSON.parse(content);

    if (!Array.isArray(ids)) {
      return Response.json({ error: "Invalid response" }, { status: 500 });
    }

    return Response.json(ids);
  } catch (err) {
    console.error("AI search error:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
