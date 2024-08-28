import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

function MainPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">One Minute Observations</h1>
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
    </div>
  );
}

export default MainPage;
