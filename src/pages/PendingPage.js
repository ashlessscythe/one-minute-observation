import React from "react";
import Header from "../components/Header";

const PendingPage = () => {
  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="container mx-auto p-4"></main>
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
          Account Pending Approval
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Your account is currently pending approval. Please check back later or
          contact an administrator.
        </p>
      </div>
    </>
  );
};

export default PendingPage;
