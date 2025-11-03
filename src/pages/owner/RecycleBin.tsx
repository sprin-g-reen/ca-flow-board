import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recycleBinAPI, RecycleBinItem } from '@/services/recycleBinAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function RecycleBin() {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch deleted items
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recycle-bin', typeFilter],
    queryFn: async () => {
      const response = await recycleBinAPI.getItems({
        type: typeFilter === 'all' ? undefined : typeFilter
      }) as any;
      return response.data;
    }
  });

  // Fetch storage stats
  const { data: stats } = useQuery({
    queryKey: ['recycle-bin-stats'],
    queryFn: async () => {
      const response = await recycleBinAPI.getStats() as any;
      return response.data;
    }
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (items: Array<{ id: string; type: string }>) => 
      recycleBinAPI.restore(items),
    onSuccess: () => {
      toast.success('Items restored successfully');
      setSelectedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
      queryClient.invalidateQueries({ queryKey: ['recycle-bin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: () => {
      toast.error('Failed to restore items');
    }
  });

  // Permanent delete mutation
  const deleteMutation = useMutation({
    mutationFn: (items: Array<{ id: string; type: string }>) =>
      recycleBinAPI.permanentDelete(items),
    onSuccess: () => {
      toast.success('Items permanently deleted');
      setSelectedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
      queryClient.invalidateQueries({ queryKey: ['recycle-bin-stats'] });
    },
    onError: () => {
      toast.error('Failed to delete items');
    }
  });

  // Empty bin mutation
  const emptyMutation = useMutation({
    mutationFn: () => recycleBinAPI.emptyBin(),
    onSuccess: () => {
      toast.success('Recycle bin emptied');
      setSelectedItems(new Set());
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
      queryClient.invalidateQueries({ queryKey: ['recycle-bin-stats'] });
    },
    onError: () => {
      toast.error('Failed to empty recycle bin');
    }
  });

  const items: RecycleBinItem[] = data?.items || [];
  const totalSize = data?.totalSize || 0;

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item._id)));
    }
  };

  const handleRestore = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to restore');
      return;
    }

    const itemsToRestore = items
      .filter(item => selectedItems.has(item._id))
      .map(item => ({ id: item._id, type: item.type }));

    restoreMutation.mutate(itemsToRestore);
  };

  const handlePermanentDelete = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to delete');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${selectedItems.size} items? This action cannot be undone.`)) {
      return;
    }

    const itemsToDelete = items
      .filter(item => selectedItems.has(item._id))
      .map(item => ({ id: item._id, type: item.type }));

    deleteMutation.mutate(itemsToDelete);
  };

  const handleEmptyBin = () => {
    if (items.length === 0) {
      toast.error('Recycle bin is already empty');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ALL ${items.length} items? This action cannot be undone.`)) {
      return;
    }

    emptyMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recycle Bin</h1>
          <p className="text-muted-foreground mt-1">
            Deleted items are kept for 30 days before permanent deletion
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleEmptyBin}
          disabled={items.length === 0 || emptyMutation.isPending}
        >
          {emptyMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Empty Bin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recycleBin.itemCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.breakdown?.clients || 0} clients, {data?.breakdown?.documents || 0} documents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats?.recycleBin.storage || 0)}</div>
            <p className="text-xs text-muted-foreground">In recycle bin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats?.total.storage || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(stats?.active.storage || 0)} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRestore}
                disabled={selectedItems.size === 0 || restoreMutation.isPending}
              >
                {restoreMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Restore
              </Button>
              <Button
                variant="destructive"
                onClick={handlePermanentDelete}
                disabled={selectedItems.size === 0 || deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Permanently
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Recycle bin is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Deleted items will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size === items.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead>Deleted By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item._id)}
                        onCheckedChange={() => toggleItem(item._id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.displayName}
                      {item.clientName && (
                        <div className="text-sm text-muted-foreground">
                          Client: {item.clientName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary">
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell>{formatFileSize(item.size)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {item.deletedBy?.name || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Warning Message */}
      {items.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Auto-deletion in 30 days</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Items in the recycle bin will be automatically and permanently deleted after 30 days.
                  Restore items you want to keep before they're permanently removed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
