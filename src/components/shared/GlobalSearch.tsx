import { useState, useRef, useEffect } from 'react';
import { Search, Filter, FileText, Users, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearch } from '@/hooks/useSearch';

export const GlobalSearch = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    searchQuery, 
    setSearchQuery, 
    searchType, 
    setSearchType, 
    searchResults, 
    isLoading, 
    hasResults 
  } = useSearch();

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close the expanded search when clicking outside or pressing Escape
  useEffect(() => {
    const onDocMouse = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };

    document.addEventListener('mousedown', onDocMouse);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onDocMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
  <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, clients, payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="pl-10 pr-4"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {(isExpanded || hasResults) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={searchType} onValueChange={(value: any) => setSearchType(value)}>
              <TabsList className="w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="tasks">
                  <FileText className="h-4 w-4 mr-1" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="clients">
                  <Users className="h-4 w-4 mr-1" />
                  Clients
                </TabsTrigger>
                <TabsTrigger value="payments">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Payments
                </TabsTrigger>
              </TabsList>

              <div className="max-h-80 overflow-y-auto">
                <TabsContent value="all" className="mt-0">
                  {isLoading ? (
                    <div className="p-4 text-center text-muted-foreground">Searching...</div>
                  ) : hasResults ? (
                    <div className="space-y-2 p-2">
                      {searchResults.tasks.slice(0, 3).map((task: any) => (
                        <div key={task.id} className="p-2 hover:bg-muted rounded-lg cursor-pointer">
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{task.category}</Badge>
                            {task.client_name && <span>{task.client_name}</span>}
                          </div>
                        </div>
                      ))}
                      {searchResults.clients.slice(0, 3).map((client: any) => (
                        <div key={client.id} className="p-2 hover:bg-muted rounded-lg cursor-pointer">
                          <div className="font-medium text-sm">{client.name}</div>
                          <div className="text-xs text-muted-foreground">{client.email}</div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length > 2 ? (
                    <div className="p-4 text-center text-muted-foreground">No results found</div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">Type to search...</div>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="mt-0">
                  {searchResults.tasks.map((task: any) => (
                    <div key={task.id} className="p-2 hover:bg-muted rounded-lg cursor-pointer">
                      <div className="font-medium text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.description}</div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="clients" className="mt-0">
                  {searchResults.clients.map((client: any) => (
                    <div key={client.id} className="p-2 hover:bg-muted rounded-lg cursor-pointer">
                      <div className="font-medium text-sm">{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="payments" className="mt-0">
                  {searchResults.payments.map((payment: any) => (
                    <div key={payment.id} className="p-2 hover:bg-muted rounded-lg cursor-pointer">
                      <div className="font-medium text-sm">₹{payment.amount}</div>
                      <div className="text-xs text-muted-foreground">{payment.payment_id}</div>
                    </div>
                  ))}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};