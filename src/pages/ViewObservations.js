import React, { useContext, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router";
import { ThemeProvider } from "../components/ThemeProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useSite } from "../contexts/SiteContext";
import { SearchableSelect } from "../components/SearchableSelect";
import Header from "../components/Header";
import { useAuthorizer } from "@authorizerdev/authorizer-react";

function ViewObservations() {
  const navigate = useNavigate();
  const { siteCode, isAdmin } = useSite();
  const { token } = useAuthorizer();
  const [observations, setObservations] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [sites, setSites] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    supervisorName: "",
    siteCode: "",
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  console.log(`sitecode is ${siteCode}, isAdmin: ${isAdmin}`);

  useEffect(() => {
    if (!siteCode) {
      navigate("/");
      return;
    }
    if (!token) {
      console.log("No token available, redirecting to login");
      navigate("/");
      return;
    }
    if (isAdmin) {
      fetchSites();
    }
    fetchSupervisors();
  }, [token]);

  const fetchSites = async () => {
    if (!token) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      const response = await fetch(`${API_URL}/api/sites`, {
        headers: {
          "X-User-Site": siteCode,
          "X-User-Site-Admin": "true",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sites");
      }
      const data = await response.json();
      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
      setError("Failed to load sites. Please try again.");
    }
  };

  const fetchSupervisors = async (selectedSiteCode = null) => {
    if (!token) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      const url = `${API_URL}/api/users?isSupervisor=true`;
      console.log("Fetching from URL:", url);
      const response = await fetch(url, {
        headers: {
          "X-User-Site": isAdmin
            ? selectedSiteCode || filters.siteCode || siteCode
            : siteCode,
          "X-User-Site-Admin": isAdmin ? "true" : "false",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        console.log("Token expired or invalid, redirecting to login");
        navigate("/");
        return;
      }
      if (response.status === 403) {
        navigate("/");
        return;
      }
      console.log("Response status:", response.status);
      const text = await response.text();
      console.log("Response text:", text);
      const data = JSON.parse(text);
      setSupervisors(data);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
      setError("Failed to load supervisors. Please try again.");
    }
  };

  const fetchObservations = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.supervisorName)
        queryParams.append("supervisorName", filters.supervisorName);
      if (isAdmin && filters.siteCode)
        queryParams.append("siteCode", filters.siteCode);

      const url = `${API_URL}/api/observations?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: {
          "X-User-Site": isAdmin ? filters.siteCode || siteCode : siteCode,
          "X-User-Site-Admin": isAdmin ? "true" : "false",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        console.log("Token expired or invalid, redirecting to login");
        navigate("/");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch observations");
      }
      const data = await response.json();
      setObservations(data);
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching observations:", error);
      setError("Failed to load observations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchObservations();
  };

  const handleInputChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);

    // If admin changes site, refresh supervisors list
    if (isAdmin && name === "siteCode") {
      setSupervisors([]); // Clear current supervisors
      setFilters((prev) => ({ ...prev, supervisorName: "" })); // Clear selected supervisor
      fetchSupervisors(value); // Pass the new site code directly
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  if (!siteCode || !token) {
    return null; // Will redirect in useEffect
  }

  return (
    <ThemeProvider>
      <div className="container mx-auto p-4">
        <Header />
        <div className="container mx-auto p-4 mt-20 pt-6">
          <h1 className="text-2xl font-bold">View Observations</h1>
          {isAdmin && (
            <p className="text-sm text-gray-600 mt-2">
              Viewing all sites (Admin)
            </p>
          )}
        </div>

        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          {/* Site selection for admin */}
          {isAdmin && (
            <div>
              <Label htmlFor="siteCode">Site</Label>
              <select
                id="siteCode"
                value={filters.siteCode}
                onChange={(e) => handleInputChange("siteCode", e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.code} value={site.code}>
                    {site.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                ref={startDateRef}
                value={filters.startDate}
                onChange={(e) => {
                  const utcDate = new Date(e.target.value + "T00:00:00Z")
                    .toISOString()
                    .split("T")[0];
                  handleInputChange("startDate", utcDate);
                }}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                ref={endDateRef}
                value={filters.endDate}
                onChange={(e) => {
                  const utcDate = new Date(e.target.value + "T00:00:00Z")
                    .toISOString()
                    .split("T")[0];
                  handleInputChange("endDate", utcDate);
                }}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="supervisorName">Supervisor</Label>
            <SearchableSelect
              options={supervisors}
              onSelect={(s) => handleInputChange("supervisorName", s.name)}
              placeholder="Select a Supervisor"
              value={filters.supervisorName}
            />
          </div>
          <div className="flex items-center">
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            {showResults && observations.length > 0 && (
              <span className="ml-5">Total results: {observations.length}</span>
            )}
          </div>
        </form>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {showResults && observations.length === 0 && (
          <p className="text-gray-500">
            No observations found for the selected criteria.
          </p>
        )}

        {showResults &&
          observations.map((obs) => (
            <div
              key={obs.id}
              className="border p-4 mb-4 rounded shadow-sm hover:shadow-md transition-shadow"
            >
              <p>
                <strong>Date:</strong> {formatDate(obs.date)}
              </p>
              <p>
                <strong>Supervisor:</strong> {obs.supervisorName}
              </p>
              <p>
                <strong>Associate:</strong> {obs.associateName}
              </p>
              <p>
                <strong>Topic:</strong> {obs.topic}
              </p>
              <p>
                <strong>Action Addressed:</strong> {obs.actionAddressed}
              </p>
              {isAdmin && (
                <p>
                  <strong>Site:</strong> {obs.site.code}
                </p>
              )}
            </div>
          ))}
      </div>
    </ThemeProvider>
  );
}

export default ViewObservations;
