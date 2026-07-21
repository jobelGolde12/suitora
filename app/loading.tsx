export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent overflow-hidden">
          <img
            src="/suitora_logo.png"
            alt="Suitora"
            width={48}
            height={48}
            className="object-cover animate-pulse"
          />
        </div>
        <p className="text-sm text-muted animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
