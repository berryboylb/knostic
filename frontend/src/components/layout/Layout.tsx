import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
//   LayoutDashboard,
  Upload,
  Database,
  CheckCircle,
  Download,
//   FileText,
  Settings,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "Upload",
    href: "/",
    icon: Upload,
  },
  {
    name: "Results",
    href: "/results",
    icon: Database,
  },
  {
    name: "Validate",
    href: "/validate",
    icon: CheckCircle,
  },
  {
    name: "Export",
    href: "/export",
    icon: Download,
  },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-semibold">CSV Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data management platform
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <Separator />

          {/* Footer */}
          <div className="p-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
