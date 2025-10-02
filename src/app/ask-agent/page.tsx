"use client";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LucideBrain, LucideDatabase, LucideGlobe, LucideGlobe2, LucideSendHorizontal, LucideUser } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { runAgent } from "@/lib/AiProvider/agent";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { AuroraText } from "@/components/magicui/aurora-text";

type Message = {
  role: "user" | "ai";
  text: string;
};

const AskAgentPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) {
      toast.error("Please enter a message to send.");
      return;
    }
    if (aiLoading) return;

    setAiLoading(true);
    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");

    try {
      const aiReply = await runAgent(userInput);
      console.log("AI Reply:", aiReply);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: typeof aiReply === "string" ? aiReply : String(aiReply),
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong." },
      ]);
      setAiLoading(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  return (
    <div className="h-screen w-full relative bg-black  p-4">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(120, 180, 255, 0.25), transparent 70%), #000000",
        }}
      />

      <main className="z-50 h-full w-full relative">
        <div className="h-full flex flex-col z-50">
          {messages.length == 0 ? (
            <div>
              <h1 className="text-center my-5 text-4xl font-inter  font-bold text-white tracking-tight">Anonymous Searches <span className="bg-gradient-to-r from-indigo-300 via-red-500 to-yellow-500 bg-clip-text text-transparent">Powerful Agents</span></h1>
              <div className="grid grid-cols-2 gap-7 px-2 mt-14 max-w-[800px] mx-auto">
                <div className="p-3 rounded-sm bg-gray-800 border-2 cursor-pointer border-gray-200 text-white font-sora text-base tracking-tight text-center font-medium hover:bg-gray-700 hover:scale-105 transition-all duration-200">
                  <p><LucideGlobe className="inline mr-5 text-white"/> Search the web, and get real time results</p>
                </div>
                <div className="p-3 rounded-sm bg-gray-800 border-2 cursor-pointer border-gray-200 text-white font-sora text-base tracking-tight text-center font-medium hover:bg-gray-700 hover:scale-105 transition-all duration-200">
                  <p><LucideDatabase className="inline mr-5 text-white"/>Ask inside your PDF/DOCS </p>
                </div>
                <div className="p-3 rounded-sm bg-gray-800 border-2 cursor-pointer border-gray-200 text-white font-sora text-base tracking-tight text-center font-medium hover:bg-gray-700 hover:scale-105 transition-all duration-200">
                  <p><LucideUser className="inline mr-5 text-white"/>Anonymous Searches , who prefer Privacy</p>
                </div>
                <div className="p-3 rounded-sm bg-gray-800 border-2 cursor-pointer border-gray-200 text-white font-sora text-base tracking-tight text-center font-medium hover:bg-gray-700 hover:scale-105 transition-all duration-200">
                  <p><LucideBrain className="inline mr-5 text-white"/>Build your knowlwdge</p>
                </div>
              </div>
            </div>
          ): (
              <ScrollArea className="h-[65vh] px-4 py-2 w-[850px] mx-auto mt-5 ">
              <div className="flex flex-col gap-5">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[75%] px-3 py-2 rounded-md text-base font-inter ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white self-end"
                        : "bg-gray-200/10 text-gray-200 self-start"
                    }`}
                  >
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex items-center gap-2 text-gray-500 self-start">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-base font-sora">Thinking…</span>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          )}
        </div>
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-[580px] mx-auto">
          <div className="bg-gray-700/80 rounded-md pb-2 pt-3 px-2">
            <div className="flex items-center justify-between px-6 mb-2">
              <p className="font-inter text-sm text-muted-foreground tracking-tight">
                Fully Anonymous
              </p>
              <p className="text-gray-200 font-sora text-sm">Try Now</p>
            </div>
            <div className="relative">
              <Textarea
                placeholder="Ask me anything"
                rows={60}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="resize-none h-32 bg-gray-800 placeholder:text-gray-300 text-gray-100 font-sora text-sm"
              />

              <div className="absolute bottom-2 left-4">
                <div className="flex items-center gap-2 bg-blue-100/30 px-4 py-2 rounded-full border border-blue-500 text-blue-300">
                  <LucideGlobe size={18} />
                  <p className="text-sm tracking-tight">Search</p>
                </div>
              </div>
              <div className="absolute bottom-2 right-4">
                <div
                  className="flex items-center gap-2 bg-blue-100/30 p-2 rounded  text-gray-400 hover:text-white cursor-pointer"
                  onClick={sendMessage}
                >
                  <LucideSendHorizontal size={18} className="-rotate-45" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AskAgentPage;
