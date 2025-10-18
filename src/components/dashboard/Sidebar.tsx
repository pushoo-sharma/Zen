import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, Settings, LogOut, LayoutDashboard, BarChart3, Zap, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg">InboxZen</span>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant={isActive("/dashboard") ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => navigate("/dashboard")}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={isActive("/insights") ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => navigate("/insights")}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Insights
        </Button>
        <Button
          variant={isActive("/automation") ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => navigate("/automation")}
        >
          <Zap className="mr-2 h-4 w-4" />
          Automation
        </Button>
        <Button
          variant={isActive("/team") ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => navigate("/team")}
        >
          <Users className="mr-2 h-4 w-4" />
          Team
        </Button>
        <Button
          variant={isActive("/settings") ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => navigate("/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
