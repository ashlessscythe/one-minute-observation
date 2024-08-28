import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

function Header() {
  const { user, logout } = useAuthorizer();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isHomePage = location.pathname === "/";

  return (
    <header className="bg-background border-b border-border fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        {!isHomePage && (
          <Button variant="outline" onClick={() => navigate("/")}>
            Back Home
          </Button>
        )}

        <div className="flex items-center space-x-4 ml-auto">
          {user && (
            <span className="text-foreground">Welcome, {user.email}</span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {user && (
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
