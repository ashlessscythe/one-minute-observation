import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "./ui/button";

function MainPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">One Minute Observation System</h1>
      <div className="space-y-4">
        <Link to="/view">
          <Button className="w-full">View Observations</Button>
        </Link>
        <Link to="/enter">
          <Button className="w-full">Enter Observations</Button>
        </Link>
      </div>
    </div>
  );
}

export default MainPage;