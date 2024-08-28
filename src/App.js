import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { DarkModeToggle } from "./components/DarkModeToggle";
import MainPage from "./pages/MainPage";
import EnterObservation from "./pages/EnterObservation";
import ViewObservations from "./pages/ViewObservations";
import PendingPage from "./pages/PendingPage";
import {
  useAuthorizer,
  AuthorizerProvider,
} from "@authorizerdev/authorizer-react";

function UserInfo() {
  const { user, logout } = useAuthorizer();
  return (
    <div className="flex items-center space-x-4">
      <span>Welcome, {user.email}</span>
      <button
        onClick={() => logout()}
        className="text-sm text-blue-500 hover:underline"
      >
        Logout
      </button>
    </div>
  );
}

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuthorizer();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;

  if (!user.roles) {
    console.error("User has no roles or roles not found");
    return;
  }

  // Check if the user has at least one of the allowed roles
  const userHasRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!userHasRole) {
    return user.roles.includes("pending") ? (
      <Navigate to="/pending" />
    ) : (
      <Navigate to="/" />
    );
  }

  return <>{children}</>;
};

function App() {
  const { user } = useAuthorizer();

  return (
    <Router>
      <div className="container mx-auto p-4">
        <Routes>
          <Route
            path="/pending"
            element={
              <ProtectedRoute allowedRoles={["pending"]}>
                <PendingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<MainPage />} />
          <Route
            path="/enter"
            element={
              <ProtectedRoute allowedRoles={["obs-create"]}>
                <EnterObservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view"
            element={
              <ProtectedRoute allowedRoles={["obs-view"]}>
                <ViewObservations />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function AppWithAuth() {
  return (
    <AuthorizerProvider
      config={{
        authorizerURL: process.env.REACT_APP_AUTHORIZER_URL,
        redirectURL: window.location.origin,
        clientID: process.env.REACT_APP_AUTHORIZER_CLIENT_ID,
      }}
    >
      <App />
    </AuthorizerProvider>
  );
}

export default AppWithAuth;
