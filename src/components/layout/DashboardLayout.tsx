
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RootState } from '@/store';
import { toggleChatSidebar } from '@/store/slices/uiSlice';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import { ChatSidebar } from '@/components/communication/ChatSidebar';
import { AIChatbox } from '@/components/ai/AIChatbox';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarCollapsed, chatSidebarOpen } = useSelector((state: RootState) => state.ui);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  
  // Hide floating chat sidebar on dedicated chat pages
  const isDedicatedChatPage = location.pathname.includes('/chat');
  
  // Close the chat sidebar when navigating to dedicated chat page
  useEffect(() => {
    if (isDedicatedChatPage && chatSidebarOpen) {
      dispatch(toggleChatSidebar());
    }
  }, [isDedicatedChatPage, chatSidebarOpen, dispatch]);
  
  const handleChatToggle = () => {
    dispatch(toggleChatSidebar());
  };
  
  const handleAIChatToggle = () => {
    setAiChatOpen(!aiChatOpen);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex flex-col">
      <AppHeader onAIChatToggle={handleAIChatToggle} />
      <div className="flex flex-1 relative">
        <AppSidebar onChatToggle={handleChatToggle} />
        <main 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out relative overflow-x-hidden",
            sidebarCollapsed ? "ml-[80px]" : "ml-64",
            chatSidebarOpen && !isDedicatedChatPage ? "mr-80" : "mr-0"
          )}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
          
          {/* Content Area */}
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className={cn(
              "relative z-10 overflow-x-hidden",
              isDedicatedChatPage ? "" : "p-6 lg:p-8"
            )}>
              <div className={cn(
                "w-full overflow-x-hidden",
                isDedicatedChatPage ? "" : "max-w-7xl mx-auto"
              )}>
                <Outlet />
              </div>
            </div>
          </ScrollArea>
          
          {/* Floating Elements for Visual Interest */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
            <div className="absolute top-3/4 left-3/4 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl"></div>
          </div>
        </main>
        
        {/* Chat Sidebar - Only show on non-chat pages */}
        {!isDedicatedChatPage && (
          <ChatSidebar 
            isOpen={chatSidebarOpen} 
            onToggle={handleChatToggle} 
          />
        )}
      </div>
      
      {/* AI Chatbox */}
      <AIChatbox isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
