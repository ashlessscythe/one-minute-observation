import React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { ThemeProvider } from "../components/ThemeProvider";
import { MUIThemeProvider } from "../components/MUIThemeProvider";
import Header from "../components/Header";
import { useSite } from "../contexts/SiteContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { SearchableSelect } from "../components/SearchableSelect";
import { useAuthorizer } from "@authorizerdev/authorizer-react";

function ChartsPage() {
  const navigate = useNavigate();
  const { siteCode, isAdmin } = useSite();
  const { token } = useAuthorizer();
  const [observationData, setObservationData] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [supervisorData, setSupervisorData] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [sites, setSites] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    supervisorName: "",
    siteCode: "",
  });

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const fetchSites = useCallback(async () => {
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
      if (response.status === 401) {
        console.log("Token expired or invalid, redirecting to login");
        navigate("/");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch sites");
      }
      const data = await response.json();
      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
      setError("Failed to load sites. Please try again.");
    }
  }, [token, siteCode, navigate]);

  const fetchSupervisors = useCallback(
    async (selectedSiteCode = null) => {
      if (!token) return;
      try {
        const API_URL = process.env.REACT_APP_API_URL || "";
        const url = `${API_URL}/api/users?isSupervisor=true`;
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
        if (!response.ok) {
          throw new Error("Failed to fetch supervisors");
        }
        const data = await response.json();
        setSupervisors(data);
      } catch (error) {
        console.error("Error fetching supervisors:", error);
        setError("Failed to load supervisors. Please try again.");
      }
    },
    [token, siteCode, isAdmin, filters.siteCode, navigate]
  );

  const fetchObservations = useCallback(async () => {
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

      // Process data for site-based chart
      if (isAdmin) {
        const siteCounts = data.reduce((acc, curr) => {
          acc[curr.site.code] = (acc[curr.site.code] || 0) + 1;
          return acc;
        }, {});

        const siteChartData = Object.entries(siteCounts).map(
          ([site, count]) => ({
            site,
            count,
          })
        );
        setSiteData(siteChartData);
      } else {
        setSiteData([
          {
            site: siteCode,
            count: data.length,
          },
        ]);
      }

      // Process data for supervisor chart
      const supervisorCounts = data.reduce((acc, curr) => {
        acc[curr.supervisorName] = (acc[curr.supervisorName] || 0) + 1;
        return acc;
      }, {});

      const supervisorChartData = Object.entries(supervisorCounts)
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count); // Sort by count descending

      setSupervisorData(supervisorChartData);

      // Process data for timeline chart
      const processedData = data
        .reduce((acc, curr) => {
          const date = new Date(curr.date).toISOString().split("T")[0];
          const existing = acc.find((item) => item.date === date);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ date, count: 1 });
          }
          return acc;
        }, [])
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setObservationData(processedData);
    } catch (error) {
      console.error("Error fetching observations:", error);
      setError("Failed to load observations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, siteCode, isAdmin, filters, navigate]);

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
    fetchObservations();
  }, [
    token,
    siteCode,
    isAdmin,
    navigate,
    fetchSites,
    fetchSupervisors,
    fetchObservations,
  ]);

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

  if (!siteCode || !token) {
    return null; // Will redirect in useEffect
  }

  return (
    <ThemeProvider>
      <MUIThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <main className="container mx-auto p-4 mt-20">
            <h1 className="text-2xl font-bold mb-6">Observation Analytics</h1>
            {isAdmin && (
              <p className="text-sm text-gray-600 mt-2 mb-6">
                Viewing all sites (Admin)
              </p>
            )}

            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              {/* Site selection for admin */}
              {isAdmin && (
                <div>
                  <Label htmlFor="siteCode">Site</Label>
                  <select
                    id="siteCode"
                    value={filters.siteCode}
                    onChange={(e) =>
                      handleInputChange("siteCode", e.target.value)
                    }
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
                  {loading ? "Loading..." : "Update Charts"}
                </Button>
              </div>
            </form>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="grid gap-8">
              {isAdmin && (
                <div className="p-6 bg-card rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">
                    Observations by Site
                  </h2>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={siteData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="site" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="count"
                          fill="#8884d8"
                          name="Number of Observations"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="p-6 bg-card rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">
                  Observations by Supervisor
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={supervisorData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#82ca9d"
                        name="Number of Observations"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 bg-card rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">
                  Observations Timeline
                </h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={observationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString()
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(date) =>
                          new Date(date).toLocaleDateString()
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#82ca9d"
                        name="Number of Observations"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </main>
        </div>
      </MUIThemeProvider>
    </ThemeProvider>
  );
}

export default ChartsPage;
