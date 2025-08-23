import ChatBox from "@/components/ChatBox";

export default function Page() {
  // lazy client import keeps server components clean

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <ChatBox />
    </main>
  );
}
