import React from 'react';
import { HardDrive, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface StorageStats {
  active: {
    clients: number;
    documents: number;
    storage: number;
  };
  deleted: {
    clients: number;
    documents: number;
    storage: number;
  };
  total: {
    clients: number;
    documents: number;
    storage: number;
  };
  recycleBin: {
    itemCount: number;
    storage: number;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const StorageWidget: React.FC = () => {
  const { data: stats, isLoading } = useQuery<StorageStats>({
    queryKey: ['storage-stats'],
    queryFn: async () => {
      const response = await api.get('/recycle-bin/stats') as { data: StorageStats };
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <HardDrive className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  const storageLimit = 10 * 1024 * 1024 * 1024; // 10 GB limit (example)
  const usagePercentage = (stats.total.storage / storageLimit) * 100;
  const isNearLimit = usagePercentage > 80;

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <HardDrive className={`h-4 w-4 ${isNearLimit ? 'text-destructive' : 'text-muted-foreground'}`} />
        <div className="flex flex-col">
          <span className="font-medium">
            {formatBytes(stats.active.storage)} / {formatBytes(storageLimit)}
          </span>
          <span className="text-xs text-muted-foreground">
            {usagePercentage.toFixed(1)}% used
          </span>
        </div>
      </div>

      {stats.recycleBin.storage > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground border-l pl-3">
          <TrendingDown className="h-3 w-3" />
          <span>{formatBytes(stats.recycleBin.storage)} in bin</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-muted-foreground border-l pl-3">
        <span>{stats.active.documents} docs</span>
      </div>
    </div>
  );
};

export default StorageWidget;
