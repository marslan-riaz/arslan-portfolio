// Tiny event bus that lets any component open the chat widget,
// optionally pre-filling (and auto-sending) a question.

export const CHAT_OPEN_EVENT = "portfolio:open-chat";

export function openChat(question?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: { question } }));
}
