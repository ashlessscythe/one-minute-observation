import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ThemeProvider } from "../components/ThemeProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { SearchableSelect } from "../components/SearchableSelect";
import Header from "../components/Header";

function ViewObservations() {
  const [observations, setObservations] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    supervisorName: "",
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      const url = `${API_URL}/api/users?isSupervisor=true`;
      console.log("Fetching from URL:", url);
      const response = await fetch(url);
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
    setLoading(true);
    setError("");
    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.supervisorName)
        queryParams.append("supervisorName", filters.supervisorName);

      const url = `${API_URL}/api/observations?${queryParams.toString()}`;
      const response = await fetch(url);
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
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <ThemeProvider>
      <div className="container mx-auto p-4">
        <Header />
        <div className="container mx-auto p-4 mt-20 pt-6">
          <h1 className="text-2xl font-bold">View Observations</h1>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 mb-6">
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
            </div>
          ))}
      </div>
    </ThemeProvider>
  );
}

export default ViewObservations;
