"use client";

import * as React from "react";
import { SquarePen, MessageSquare, Trash2, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/llm-storage";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat?: () => void;
  onSelectConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export function AppSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  ...props
}: AppSidebarProps): React.JSX.Element {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSignOut = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.title.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const sortedConversations = React.useMemo(() => {
    return [...filteredConversations].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }, [filteredConversations]);

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="h-8 w-8"
            aria-label="Start new chat"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-2">
          <SidebarInput
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {sortedConversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No chats found" : "No chats yet"}
            </div>
          ) : (
            sortedConversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <SidebarMenuButton
                  isActive={conversation.id === currentConversationId}
                  onClick={() => onSelectConversation?.(conversation.id)}
                  className="group relative"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="flex-1 truncate">{conversation.title}</span>
                </SidebarMenuButton>
                {conversation.id === currentConversationId && (
                  <SidebarMenuAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation?.(conversation.id);
                    }}
                    showOnHover
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </SidebarMenuAction>
                )}
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  Admin
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  admin@jmrinfotech.com
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
