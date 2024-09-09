import React, { createContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import MainPage from "./pages/MainPage";
import EnterObservation from "./pages/EnterObservation";
import ViewObservations from "./pages/ViewObservations";
import PendingPage from "./pages/PendingPage";
import { SiteProvider } from "./contexts/SiteContext";
import {
  useAuthorizer,
  AuthorizerProvider,
} from "@authorizerdev/authorizer-react";

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
  // Pass the user prop to the children
  return React.Children.map(children, child => 
    React.cloneElement(child, { user })
  );
};

function App() {
  return (
    <SiteProvider>
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
    </SiteProvider>
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
