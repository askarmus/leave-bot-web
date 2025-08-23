"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatBox() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi! Ask me your leave balance. (Try: E001 annual)",
    },
  ]);
  const [input, setInput] = useState("");
  const [employeeId, setEmployeeId] = useState("E001"); // default for dev
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const msg = input.trim();
    if (!msg) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, employee_id: employeeId }),
      });
      const data = await r.json();
      const reply = data?.reply ?? data?.error ?? "No reply";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Employee ID (e.g., E001)"
            className="w-44 rounded-md border px-3 py-2 text-sm"
          />
          <Separator orientation="vertical" className="mx-2 h-6" />
          <span className="text-sm text-muted-foreground">
            Press Enter to send (Shift+Enter for new line)
          </span>
        </div>

        <Separator className="my-4" />

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
            placeholder="Ask: what is my annual leave?"
            className="min-h-[60px]"
            disabled={loading}
          />
          <Button onClick={send} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
