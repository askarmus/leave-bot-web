"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Msg = { role: "user" | "assistant"; text: string };

type ChatIntent = "BALANCE";
type ChatRequest = {
  message: string;
  employee_id?: string;
  intent?: ChatIntent;
};
type ChatResponse = {
  reply?: string;
  error?: string;
};

function extractEmployeeId(text: string): string | null {
  const m1 = text.match(/\bE\d{3,}\b/i);
  if (m1) return m1[0].toUpperCase();
  const m2 = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  if (m2) return m2[0].toLowerCase();
  return null;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Hi! I can check your leave balance. You can say 'what is my annual leave?' or click Get Balance. " +
        "If you share your employee ID once (e.g., E001), I’ll remember it for this session.",
    },
  ]);
  const [input, setInput] = useState("");
  const [rememberedId, setRememberedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function post(body: ChatRequest): Promise<ChatResponse> {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await r.json()) as ChatResponse;
  }

  async function send(): Promise<void> {
    const msg = input.trim();
    if (!msg) return;

    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    const idInMsg = extractEmployeeId(msg);
    if (idInMsg) setRememberedId(idInMsg);

    try {
      const body: ChatRequest = { message: msg };
      if (rememberedId) body.employee_id = rememberedId;

      const data = await post(body);
      const reply = data.reply ?? data.error ?? "No reply";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Error: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function getBalance(): Promise<void> {
    const msg = input.trim() || "leave balance";

    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    const idInMsg = extractEmployeeId(msg);
    if (idInMsg) setRememberedId(idInMsg);

    try {
      const body: ChatRequest = { message: msg, intent: "BALANCE" };
      if (rememberedId) body.employee_id = rememberedId;

      const data = await post(body);
      const reply = data.reply ?? data.error ?? "No reply";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Error: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send().catch(() => {});
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <Card className="p-4">
        <ScrollArea className="h-72 rounded-md border p-3">
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-auto max-w-[80%] rounded-2xl bg-muted px-3 py-2"
                }
              >
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <div className="mt-4 flex items-center gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message… e.g., 'what is my annual leave?' or 'my id is E001'"
            className="min-h-[60px]"
            disabled={loading}
          />
          <Button onClick={send} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </Button>
          <Button variant="secondary" onClick={getBalance} disabled={loading}>
            {loading ? "…" : "Get Balance"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
