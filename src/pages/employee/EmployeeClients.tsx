import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Eye, 
  Mail, 
  Phone, 
  Building,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useTasks } from '@/hooks/useTasks';

const EmployeeClients = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { clients, isLoading: clientsLoading } = useClients();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');

  // Get clients that have tasks assigned to current employee
  const assignedClients = useMemo(() => {
    if (!tasks || !clients || !user) return [];

    // Get unique client IDs from tasks assigned to this employee
    const assignedClientIds = new Set(
      tasks
        .filter(task => {
          if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false;
          
          // Handle both string IDs and user objects with _id property
          return task.assignedTo.some((assigned: any) => {
            if (typeof assigned === 'string') {
              // Direct string ID comparison
              return assigned === user.id || assigned === user.email;
            } else if (assigned && typeof assigned === 'object') {
              // User object comparison - check _id property
              return assigned._id === user.id || assigned.email === user.email;
            }
            return false;
          });
        })
        .map(task => task.clientId)
        .filter(Boolean)
    );

    // Filter clients by assigned IDs
    return clients.filter(client => assignedClientIds.has(client.id));
  }, [tasks, clients, user]);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return assignedClients;

    const query = searchQuery.toLowerCase();
    return assignedClients.filter(client =>
      client.name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.includes(query) ||
      client.gst_number?.toLowerCase().includes(query) ||
      client.cin_number?.toLowerCase().includes(query)
    );
  }, [assignedClients, searchQuery]);

  // Get task count for each client
  const getClientTaskCount = (clientId: string) => {
    if (!tasks) return { total: 0, active: 0, completed: 0 };
    
    const clientTasks = tasks.filter(task => task.clientId === clientId);
    return {
      total: clientTasks.length,
      active: clientTasks.filter(t => t.status !== 'completed').length,
      completed: clientTasks.filter(t => t.status === 'completed').length
    };
  };

  const isLoading = clientsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-ca-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Assigned Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            Clients with tasks assigned to you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {assignedClients.length} {assignedClients.length === 1 ? 'Client' : 'Clients'}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, email, phone, GST, or CIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              {assignedClients.length === 0 ? (
                <>
                  <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Clients Assigned
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have any clients assigned to you yet.
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Results Found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>GST/CIN</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const taskStats = getClientTaskCount(client.id);
                    return (
                      <TableRow key={client.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {client.name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <div>
                              <div className="font-medium">{client.name || 'Unnamed Client'}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {client.client_code || client.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[200px]">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            {client.gst_number && (
                              <div>
                                <span className="text-muted-foreground">GST:</span> {client.gst_number}
                              </div>
                            )}
                            {client.cin_number && (
                              <div>
                                <span className="text-muted-foreground">CIN:</span> {client.cin_number}
                              </div>
                            )}
                            {!client.gst_number && !client.cin_number && (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {taskStats.total} total
                            </Badge>
                            {taskStats.active > 0 && (
                              <Badge variant="default" className="text-xs bg-blue-500">
                                {taskStats.active} active
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={client.status === 'active' ? 'default' : 'secondary'}
                            className={
                              client.status === 'active'
                                ? 'bg-green-500'
                                : client.status === 'inactive'
                                ? 'bg-gray-500'
                                : 'bg-red-500'
                            }
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="View client details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="View tasks"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {assignedClients.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedClients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Assigned to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignedClients.filter(c => c.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                With active status
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignedClients.reduce((sum, client) => 
                  sum + getClientTaskCount(client.id).total, 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all clients
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeeClients;
