export async function fetchThread(accessToken: string, threadId: string) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch thread: ${errorText}`);
  }

  const data = await res.json();
  
  const messages = (data.messages || []).map((m: any) => {
    const headers = m.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
    const from = headers.find((h: any) => h.name === "From")?.value || "";
    const date = new Date(
      m.internalDate ? Number(m.internalDate) : Date.now()
    ).toISOString();
    const body = extractText(m.payload);

    return {
      id: m.id,
      subject,
      from,
      dateISO: date,
      body,
    };
  });

  return {
    id: data.id,
    messages,
  };
}

function extractText(payload: any): string {
  let text = "";

  const walk = (p: any) => {
    if (!p) return;

    if (p.mimeType?.startsWith("text/")) {
      const encodedData = p.body?.data || "";
      try {
        // Decode base64url to text
        const decoded = atob(encodedData.replace(/-/g, "+").replace(/_/g, "/"));
        text += decoded + "\n\n";
      } catch (error) {
        console.error("Error decoding email body:", error);
      }
    }

    (p.parts || []).forEach(walk);
  };

  walk(payload);
  
  // Limit to 12KB to avoid token limits
  return text.slice(0, 12000);
}

export function extractThreadId(text: string): string | null {
  // Match thread ID pattern like #1234abcd5678
  const match = /#([a-zA-Z0-9_-]{10,})/.exec(text);
  return match ? match[1] : null;
}
