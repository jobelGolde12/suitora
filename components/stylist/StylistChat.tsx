"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/ui/Toast";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Usage {
  used: number;
  limit: number;
  remaining: number;
}

const SUGGESTED_PROMPTS = [
  "What colors suit my skin tone best?",
  "How should I dress for my body shape?",
  "Suggest a weekend outfit for me",
  "How do I choose the right size when shopping online?",
];

const isMobile = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

export function StylistChat() {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const localIdRef = useRef(0);

  useEffect(() => {
    fetch("/api/stylist", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setMessages(data?.messages ?? []);
        setUsage(data?.usage ?? null);
      })
      .catch(() => addToast("Failed to load your stylist history", "error"))
      .finally(() => setIsLoading(false));
  }, [addToast]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  const handleSend = async (text: string) => {
    const message = text.trim();
    if (!message || isSending) return;

    const optimistic: ChatMessage = {
      id: `local-${++localIdRef.current}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to get a reply");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${++localIdRef.current}`,
          role: "assistant",
          content: data.message,
          createdAt: new Date().toISOString(),
        },
      ]);
      setUsage(data.usage ?? null);
    } catch (err) {
      console.error("Stylist error:", err);
      addToast(err instanceof Error ? err.message : "Failed to get a reply", "error");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setIsSending(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 border border-accent/30">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">Suitora Stylist</p>
          <p className="text-xs text-muted font-light">
            {isLoading ? "Loading…" : `${usage?.remaining ?? 0} messages left this month`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-6"
        style={{ minHeight: isMobile() ? "calc(100dvh - 340px)" : "440px", maxHeight: isMobile() ? "calc(100dvh - 340px)" : "560px" }}
        aria-live="polite"
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted font-light">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your conversation…
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-surface border border-border/60 p-4">
              <p className="text-sm text-muted font-light leading-relaxed">
                Hi — I&apos;m your AI fashion stylist. Ask me anything about fit, color,
                or putting outfits together, and I&apos;ll tailor my advice to your
                profile and past analyses.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={isSending}
                  className="rounded-full border border-border bg-card px-4 py-2 text-xs text-muted transition-colors duration-200 hover:border-accent/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-surface border border-border/60 text-foreground rounded-bl-md"
                )}
              >
                <p className="font-light whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-surface border border-border/60 px-4 py-3">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </span>
              <span className="text-xs text-muted font-light">Stylist is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            rows={1}
            placeholder="Ask your stylist anything…"
            aria-label="Message"
            maxLength={2000}
            className="flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-accent/60 focus:bg-card focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-soft transition-all duration-200 hover:bg-accent/90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
