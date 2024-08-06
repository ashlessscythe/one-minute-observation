import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "./ui/button";

function ViewObservations() {
  const [observations, setObservations] = useState([]);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_URL}/api/observations`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setObservations(data);
    } catch (error) {
      console.error('Error fetching observations:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">View Observations</h1>
        <Link to="/">
          <Button variant="outline" className="hover:scale-105 hover:bg-red-100">Back to Home</Button>
        </Link>
      </div>
      {observations.map((obs) => (
        <div key={obs.id} className="border p-4 mb-4 rounded">
          <p>Date: {obs.date}</p>
          <p>Supervisor: {obs.supervisorName}</p>
          <p>Associate: {obs.associateName}</p>
          <p>Topic: {obs.topic}</p>
          <p>Action Addressed: {obs.actionAddressed}</p>
        </div>
      ))}
    </div>
  );
}

export default ViewObservations;