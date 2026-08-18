import TiltHouses from "./TiltHouses";

export default function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 overflow-hidden">
      <TiltHouses variant="accent" className="opacity-70" />
      <div className="relative z-10 w-full max-w-sm bg-paper-raised border border-ink/10 rounded-xl shadow-raised p-8">
        {children}
      </div>
    </div>
  );
}
