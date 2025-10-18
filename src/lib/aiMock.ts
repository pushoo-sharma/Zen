export function classifyEmail(subject: string, body: string): string {
  const text = (subject + " " + body).toLowerCase();
  
  // Priority keywords
  if (text.includes("urgent") || text.includes("asap") || text.includes("critical") || text.includes("immediately")) {
    return "Priority";
  }
  
  // Action needed keywords
  if (
    text.includes("follow up") || 
    text.includes("reminder") || 
    text.includes("confirm") ||
    text.includes("review") ||
    text.includes("feedback") ||
    text.includes("respond")
  ) {
    return "Action Needed";
  }
  
  // Default to informational
  return "Informational";
}

export function generateReply(body: string, tone: string = "friendly"): string {
  const templates = {
    formal: [
      "Thank you for your email. I have reviewed the information and would like to confirm that I will address this matter promptly.",
      "I appreciate you reaching out. I will review this carefully and respond with my feedback shortly.",
      "Thank you for bringing this to my attention. I will ensure this receives the appropriate consideration."
    ],
    friendly: [
      "Thanks for reaching out! I've got this on my radar and will get back to you soon.",
      "Hey! Thanks for the message. I'll take a look at this and circle back with you shortly.",
      "Appreciate you sending this over! Let me review and I'll get back to you with my thoughts."
    ],
    brief: [
      "Thanks. Will review and respond soon.",
      "Got it. Will follow up shortly.",
      "Acknowledged. Will get back to you."
    ]
  };

  const toneTemplates = templates[tone as keyof typeof templates] || templates.friendly;
  return toneTemplates[Math.floor(Math.random() * toneTemplates.length)];
}
