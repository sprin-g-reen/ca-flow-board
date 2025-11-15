/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Search, Filter, FileText, Users, CreditCard, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearch } from '@/hooks/useSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/services/api';

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
  const inputWrapperRef = useRef<HTMLDivElement | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  // measure when expanded or when results change
  useLayoutEffect(() => {
    // no-op for portal positioning; dialog centers itself
  }, [isExpanded, hasResults]);

  // Shortcut: Cmd/Ctrl+K to open Spotlight
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsExpanded(true);
        (document.activeElement as HTMLElement)?.blur?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const askAI = async () => {
    if (!searchQuery.trim()) return;
    setIsAiLoading(true);
    setAiAnswer(null);
    try {
      const resp: any = await apiClient.post('/ai/chat', { prompt: searchQuery, privacy: true });
      setAiAnswer(resp?.response || resp?.summary || null);
    } catch (err) {
      console.error('AI search error', err);
      setAiAnswer('AI service unavailable');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1" ref={inputWrapperRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Quick Search — press ⌘/Ctrl+K"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="pl-10 pr-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Enter triggers API search results (already handled by useSearch hook via query)
              }
            }}
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

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 pb-6 px-6 pt-6">
            <DialogTitle className="text-xl font-semibold">Search — Spotlight</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto flex-1 px-6 pb-6">
            <div className="flex items-center gap-3">
              <Input
                autoFocus
                placeholder="Search tasks, clients, invoices or ask AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    askAI();
                  }
                }}
              />
              <Button 
                variant="ghost" 
                onClick={askAI} 
                title="Ask AI (privacy on)"
                className="h-11 w-11 p-0"
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {isAiLoading ? (
                  <div className="text-sm text-muted-foreground">Thinking...</div>
                ) : aiAnswer ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">AI Answer</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{aiAnswer}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Press the AI button to get a quick AI summary for your query.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
              <Tabs value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="tasks">
                    <FileText className="h-4 w-4 mr-2" />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="clients">
                    <Users className="h-4 w-4 mr-2" />
                    Clients
                  </TabsTrigger>
                  <TabsTrigger value="payments">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payments
                  </TabsTrigger>
                </TabsList>

                <div className="max-h-72 overflow-y-auto">
                  <TabsContent value="all" className="mt-0">
                    {isLoading ? (
                      <div className="py-8 text-center text-muted-foreground">Searching...</div>
                    ) : hasResults ? (
                      <div className="space-y-3 p-2">
                        {searchResults.tasks.slice(0, 5).map((task: any) => (
                          <div key={task.id} className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                            <div className="font-medium text-sm mb-1">{task.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{task.category}</Badge>
                              {task.client_name && <span>{task.client_name}</span>}
                            </div>
                          </div>
                        ))}
                        {searchResults.clients.slice(0, 5).map((client: any) => (
                          <div key={client.id} className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                            <div className="font-medium text-sm mb-1">{client.name}</div>
                            <div className="text-xs text-muted-foreground">{client.email}</div>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.length > 2 ? (
                      <div className="py-8 text-center text-muted-foreground">No results found</div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">Type to search or press the AI button</div>
                    )}
                  </TabsContent>

                  <TabsContent value="tasks" className="mt-0">
                    <div className="space-y-2">
                      {searchResults.tasks.map((task: any) => (
                        <div key={task.id} className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                          <div className="font-medium text-sm mb-1">{task.title}</div>
                          <div className="text-xs text-muted-foreground">{task.description}</div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="clients" className="mt-0">
                    <div className="space-y-2">
                      {searchResults.clients.map((client: any) => (
                        <div key={client.id} className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                          <div className="font-medium text-sm mb-1">{client.name}</div>
                          <div className="text-xs text-muted-foreground">{client.email}</div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="payments" className="mt-0">
                    <div className="space-y-2">
                      {searchResults.payments.map((payment: any) => (
                        <div key={payment.id} className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                          <div className="font-medium text-sm mb-1">₹{payment.amount}</div>
                          <div className="text-xs text-muted-foreground">{payment.payment_id}</div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};