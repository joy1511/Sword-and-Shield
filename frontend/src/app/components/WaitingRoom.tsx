import { Users, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface WaitingRoomProps {
  playerCount: number;
  currentRound: number;
}

export function WaitingRoom({ playerCount, currentRound }: WaitingRoomProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-12">
        {/* Radar Animation */}
        <div className="relative mx-auto w-48 h-48">
          {/* Outer rings */}
          <div className="absolute inset-0 rounded-full border-2 border-[#06B6D4]/20 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-4 rounded-full border-2 border-[#06B6D4]/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <div className="absolute inset-8 rounded-full border-2 border-[#06B6D4]/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#06B6D4]/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#06B6D4] animate-spin" />
            </div>
          </div>
          
          {/* Scanning line */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, #06B6D4 30deg, transparent 60deg)',
              animation: 'spin 3s linear infinite'
            }}
          />
        </div>

        {/* Status Text */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Waiting for Host
          </h2>
          <p className="text-muted-foreground">
            {currentRound === 0 
              ? "Ready to start Round 1..." 
              : `Preparing Round ${currentRound} results...`}
          </p>
        </div>

        {/* Player Count Badge */}
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className="px-6 py-3 text-base border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4] gap-2"
          >
            <Users className="w-5 h-5" />
            <span className="font-mono font-semibold">{playerCount}</span>
            <span className="text-muted-foreground">Players in Room</span>
          </Badge>
        </div>
      </div>

      {/* Background Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#06B6D4]/5 rounded-full blur-[120px]" />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
