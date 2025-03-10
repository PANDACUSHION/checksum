import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { FileText, Home, MessageSquare, LogOut } from "lucide-react";

export default function NavBar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <NavigationMenu>
          <NavigationMenuList className="gap-6">
            <NavigationMenuItem>
              <Button variant="ghost" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button variant="ghost" asChild>
                <Link href="/forum" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Forum
                </Link>
              </Button>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Button variant="ghost" asChild>
                <Link href="/resources" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Resources
                </Link>
              </Button>
            </NavigationMenuItem>

            {user.isAdmin && (
              <NavigationMenuItem>
                <Button variant="ghost" asChild>
                  <Link href="/admin" className="text-blue-600">
                    Admin Dashboard
                  </Link>
                </Button>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {user.username}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
