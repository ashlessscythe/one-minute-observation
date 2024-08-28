import React, { useState, useRef, useEffect } from "react";
import {
  useAuthorizer,
  AuthorizerSignup,
} from "@authorizerdev/authorizer-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useTheme } from "next-themes";
import { Tabs, Tab, Box } from "@mui/material";
import "./authorizer-custom.css";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function LoginSignupModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { loading, setLoading, authorizerRef } = useAuthorizer();
  const modalRef = useRef(null);
  const { theme } = useTheme();
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authorizerRef.login({ email, password });
      if (response.errors && response.errors.length > 0) {
        setError(
          response.errors[0].message || "An error occurred during login"
        );
      } else if (response.data) {
        onClose();
        window.location.reload();
      } else {
        console.log("Unexpected response structure:", response);
        setError("An unexpected error occurred");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (response) => {
    if (response.errors) {
      setError(response.errors[0].message);
    } else if (response.data) {
      onClose();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div
        ref={modalRef}
        className="bg-background text-foreground p-6 rounded-lg max-w-sm w-full"
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="login signup tabs"
          >
            <Tab label="Login" />
            <Tab label="Signup" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <div className="authorizer-root dark:text-white">
            <AuthorizerSignup onSignup={handleSignup} />
          </div>
        </TabPanel>
        <Button onClick={onClose} variant="outline" className="w-full mt-4">
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default LoginSignupModal;
