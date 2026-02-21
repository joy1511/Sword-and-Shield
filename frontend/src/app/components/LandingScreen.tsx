import { useState } from 'react';
import { Swords, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LandingScreenProps {
  onJoin: (username: string) => void;
  playerCount: number;
  isConnected: boolean;
}

export function LandingScreen({ onJoin, playerCount, isConnected }: LandingScreenProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#EF4444] p-0.5 mb-4">
            <div className="w-full h-full bg-background rounded-2xl flex items-center justify-center">
              <Swords className="w-10 h-10 text-[#06B6D4]" />
            </div>
          </div>
          <h1 className="font-bold tracking-tight" style={{ fontSize: '3rem', lineHeight: '1.1' }}>
            SWORD<span className="text-[#EF4444]">&</span>SHIELD
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            A psychological strategy game of prediction and risk
          </p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="username" className="block text-sm text-muted-foreground">
              Enter Your Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Player123"
              className="h-14 text-lg bg-card border-border focus-visible:ring-[#06B6D4] focus-visible:border-[#06B6D4]"
              maxLength={20}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={!username.trim()}
            className="w-full h-14 text-lg font-semibold bg-[#06B6D4] hover:bg-[#0891B2] text-background shadow-lg shadow-[#06B6D4]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Lobby
          </Button>
        </form>

        {/* Player count + Connection Status */}
        <div className="space-y-3 pt-4">
          {playerCount > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              <span className="font-mono text-[#06B6D4] font-semibold">{playerCount}</span> player{playerCount !== 1 ? 's' : ''} in lobby
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {isConnected ? (
              <>
                <div className="relative">
                  <Wifi className="w-4 h-4 text-[#10B981]" />
                  <div className="absolute inset-0 animate-ping">
                    <Wifi className="w-4 h-4 text-[#10B981] opacity-50" />
                  </div>
                </div>
                <span className="text-[#10B981]">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-[#EF4444]" />
                <span className="text-[#EF4444]">Not connected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Background Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#EF4444]/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
