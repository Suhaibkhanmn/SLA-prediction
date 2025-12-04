import { useState, useEffect } from 'react';
import { getHealth } from '../services/api';

export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await getHealth();
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) return null;

  return (
    <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full ${
      isConnected 
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
        : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
      <span>{isConnected ? 'Backend Connected' : 'Backend Offline'}</span>
    </div>
  );
};

