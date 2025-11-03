import api from './api';

export interface RecycleBinItem {
  _id: string;
  type: 'client' | 'document';
  displayName: string;
  size: number;
  deletedAt: string;
  deletedBy?: {
    name: string;
    email: string;
  };
  clientName?: string;
  email?: string;
  phone?: string;
}

export interface StorageStats {
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

export const recycleBinAPI = {
  getItems: async (params?: { type?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/recycle-bin${queryString ? `?${queryString}` : ''}`;
    return api.get(url);
  },

  restore: async (items: Array<{ id: string; type: string }>) => {
    return api.post('/recycle-bin/restore', { items });
  },

  permanentDelete: async (items: Array<{ id: string; type: string }>) => {
    return api.post('/recycle-bin/permanent-delete', { items });
  },

  emptyBin: async () => {
    return api.post('/recycle-bin/empty', {});
  },

  getStats: async () => {
    return api.get('/recycle-bin/stats');
  }
};
