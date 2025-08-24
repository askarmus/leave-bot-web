"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, Bot, User, Loader2, Copy, Check, X } from "lucide-react";

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

/** Small utility so the textarea grows like ChatGPT's composer */
function autosize(el?: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "0px";
  el.style.height = Math.min(el.scrollHeight, 200) + "px"; // cap growth
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [rememberedId, setRememberedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    autosize(taRef.current);
  }, [input]);

  async function post(body: ChatRequest): Promise<ChatResponse> {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await r.json()) as ChatResponse;
  }

  async function handleSend(msgRaw?: string): Promise<void> {
    const msg = (msgRaw ?? input).trim();
    if (!msg || loading) return;

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
      handleSend().catch(() => {});
    }
  }

  function copyMessage(i: number, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1200);
    });
  }

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex h-[100dvh] w-full flex-col">
      {/* Header (like ChatGPT top bar) */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Leave Assistant</span>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              v1 • BALANCE
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {rememberedId && (
              <Badge variant="outline" className="text-xs">
                ID: {rememberedId}
                <button
                  aria-label="Clear ID"
                  className="ml-2 inline-flex rounded p-0.5 hover:bg-muted"
                  onClick={() => setRememberedId(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className="group relative flex w-full gap-3">
                {/* Avatar column */}
                <div className="mt-1 shrink-0">
                  {m.role === "assistant" ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-foreground/70" />
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <Card
                  className={
                    "max-w-[92%] whitespace-pre-wrap leading-relaxed shadow-sm " +
                    (m.role === "assistant"
                      ? "bg-muted/60"
                      : "border-primary/20")
                  }
                >
                  <div className="prose prose-sm p-3 dark:prose-invert">
                    {m.text}
                  </div>
                </Card>

                {/* Hover copy button */}
                <div className="absolute right-0 top-0 hidden translate-x-10 gap-1 group-hover:flex">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => copyMessage(i, m.text)}
                    title="Copy"
                  >
                    {copiedIdx === i ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}

            <div ref={endRef} />
          </div>

          {showSuggestions && (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "What is my annual leave?",
                  "Show sick leave for E001",
                  "My ID is E001",
                  "Get my leave balance",
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="rounded-xl border p-3 text-left text-sm transition hover:bg-muted/60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </ScrollArea>

        {/* Composer (sticky like ChatGPT) */}
        <div className="sticky bottom-0 z-10 mb-4 mt-2">
          <div className="mx-auto w-full">
            <div className="relative rounded-2xl border bg-background shadow-sm">
              <Textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onInput={(e) => autosize(e.currentTarget)}
                onKeyDown={onKeyDown}
                placeholder="Message Leave Assistant…  (Shift+Enter for new line)"
                className="min-h-[52px] resize-none border-0 bg-transparent px-4 py-3 focus-visible:ring-0"
                disabled={loading}
                rows={1}
              />

              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-2 pl-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={getBalance}
                    disabled={loading}
                  >
                    {loading ? "…" : "Get Balance"}
                  </Button>
                </div>
                <div className="flex items-center gap-2 pr-1">
                  <Button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    title="Send"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <p className="mt-2 px-2 text-center text-[11px] leading-5 text-muted-foreground">
              This assistant can look up balances when you provide an ID (e.g.,{" "}
              <span className="font-mono">E001</span> or your email). Avoid
              sharing sensitive data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
