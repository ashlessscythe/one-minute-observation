import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeProvider } from '../components/ThemeProvider';
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { DatePicker } from "../components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { SearchableSelect } from '../components/SearchableSelect';

function ViewObservations() {
  const [observations, setObservations] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    supervisorName: '',
  });
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_URL}/api/users?isSupervisor=true`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setSupervisors(data);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const fetchObservations = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      let url = `${API_URL}/api/observations?`;
      if (filters.startDate) url += `startDate=${filters.startDate.toISOString()}&`;
      if (filters.endDate) url += `endDate=${filters.endDate.toISOString()}&`;
      if (filters.supervisorName) url += `supervisorName=${filters.supervisorName}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setObservations(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error fetching observations:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchObservations();
  };

  const formatDate = (dateString) => {
    return dateString.split('T')[0];
  };

  return (
    <ThemeProvider>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">View Observations</h1>
          <Link to="/">
            <Button variant="outline" className="hover:scale-105 hover:bg-red-100">Back to Home</Button>
          </Link>
        </div>
      
        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <DatePicker
                date={filters.startDate}
                setDate={(newDate) => setFilters({...filters, startDate: newDate})}
                />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <DatePicker
                date={filters.endDate}
                setDate={(newDate) => setFilters({...filters, endDate: newDate})}
                />
            </div>
          </div>
          <div>
            <Label htmlFor="supervisorName">Supervisor</Label>
            <SearchableSelect
              options={supervisors}
              onSelect={(s) => setFilters(prev => ({...prev, supervisorName: s.name}))}
              placeholder="Select a Supervisor"
              />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {showResults && observations.map((obs) => (
          <div key={obs.id} className="border p-4 mb-4 rounded">
            <p>Date: {formatDate(obs.date)}</p>
            <p>Supervisor: {obs.supervisorName}</p>
            <p>Associate: {obs.associateName}</p>
            <p>Topic: {obs.topic}</p>
            <p>Action Addressed: {obs.actionAddressed}</p>
          </div>
        ))}
      </div>
    </ThemeProvider>
  );
}

export default ViewObservations;