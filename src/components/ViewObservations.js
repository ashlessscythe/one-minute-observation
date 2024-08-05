import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";

function ViewObservations() {
  const [observations, setObservations] = useState([]);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/observations');
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
      <h1 className="text-2xl font-bold mb-6">View Observations</h1>
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