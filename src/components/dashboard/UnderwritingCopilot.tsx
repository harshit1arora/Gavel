import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { apiWithAuth } from "@/lib/api-client";
import { MonitoredBorrower } from "@/lib/firestore";
import { toast } from "sonner";

interface Message {
  role: "user" | "model";
  content: string;
}

export function UnderwritingCopilot({ borrower }: { borrower: MonitoredBorrower }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Hello. I am the Gavel Underwriting Copilot. I have loaded the profile for **${borrower.applicantName}** (Current Score: ${borrower.currentScore}). How can I assist you with this application?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await apiWithAuth("/v1/copilot", {
        method: "POST",
        body: JSON.stringify({
          prompt: userMessage,
          borrowerData: borrower,
          conversationHistory: messages
        })
      });

      if (!res.ok) {
        throw new Error("Failed to communicate with Copilot");
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", content: data.reply }]);
    } catch (error) {
      toast.error("Copilot is currently offline or unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-primary/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles size={14} className="text-primary" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground">AI Underwriting Copilot</h4>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Powered by Gemini 1.5 Flash</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 min-h-[300px] max-h-[400px]">
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-primary/20 text-primary"}`}>
              {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${msg.role === "user" ? "bg-blue-500/10 text-blue-100 border border-blue-500/20 rounded-tr-sm" : "bg-foreground/5 text-foreground border border-white/5 rounded-tl-sm"}`}>
              {/* Note: In a real app, use react-markdown here */}
              <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-1">
              <Bot size={12} />
            </div>
            <div className="p-3 rounded-2xl bg-foreground/5 text-foreground border border-white/5 rounded-tl-sm flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> Analyzing data...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-background/60">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this application..."
            className="w-full bg-foreground/5 border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {["Why is this HIGH RISK?", "Summarize GST anomalies", "Recalculate without telecom penalty"].map((suggestion) => (
            <button 
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="text-[10px] whitespace-nowrap px-3 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-white/5 text-muted-foreground transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
