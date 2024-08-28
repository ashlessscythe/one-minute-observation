import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuthorizer } from "@authorizerdev/authorizer-react";
import LoginSignupModal from "../components/LoginSignupModal";
import { ThemeProvider } from "../components/ThemeProvider";
import { MUIThemeProvider } from "../components/MUIThemeProvider";
import Header from "../components/Header";

function MainPage() {
  const { user, loading, logout } = useAuthorizer();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider>
      <MUIThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <main className="container mx-auto p-4 mt-20 pt-6"></main>
          {!user ? (
            <>
              <h1 className="text-2xl font-bold mx-auto">
                One Minute Observations
              </h1>
              <p className="mb-4">
                Please log in or create an account to continue.
              </p>
              <Button onClick={() => setIsLoginModalOpen(true)}>
                Log In / Sign Up
              </Button>
              <LoginSignupModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
              />
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">One Minute Observations</h1>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-row space-y-4 sm:space-y-0 md:space-y-0 sm:space-x-4 md:space-x-6">
                <Link to="/view" className="w-full sm:w-1/2 md:w-1/2">
                  <Button className="w-full h-16 text-lg font-semibold transition-all hover:bg-primary/90 hover:text-primary-foreground hover:shadow-lg hover:scale-105">
                    View Observations
                  </Button>
                </Link>
                <Link to="/enter" className="w-full sm:w-1/2 md:w-1/2">
                  <Button className="w-full h-16 text-lg font-semibold transition-all hover:bg-primary/90 hover:text-primary-foreground hover:shadow-lg hover:scale-105">
                    Enter Observations
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </MUIThemeProvider>
    </ThemeProvider>
  );
}

export default MainPage;
