import React, { useState } from 'react';
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Textarea } from "./components/ui/textarea"

function App() {
  const [formData, setFormData] = useState({
    date: '',
    supervisorName: '',
    shift: '',
    associateName: '',
    topic: '',
    actionAddressed: '',
  });

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      console.log('Observation submitted:', result);
      // Reset form or show success message
    } catch (error) {
      console.error('Error submitting observation:', error);
      // Show error message to user
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">One Minute Observation Submission Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="supervisorName">Supervisor Name</Label>
          <Input
            type="text"
            id="supervisorName"
            value={formData.supervisorName}
            onChange={(e) => handleInputChange('supervisorName', e.target.value)}
          />
        </div>
        <div>
          <Label>Shift</Label>
          <RadioGroup onValueChange={(value) => handleInputChange('shift', value)}>
            {[1, 2, 3].map((shift) => (
              <div key={shift} className="flex items-center space-x-2">
                <RadioGroupItem value={shift.toString()} id={`shift-${shift}`} />
                <Label htmlFor={`shift-${shift}`}>{shift}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div>
          <Label htmlFor="associateName">Associate Name</Label>
          <Select onValueChange={(value) => handleInputChange('associateName', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an associate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Jimmy Forks">Jimmy Forks</SelectItem>
              <SelectItem value="Sue Speed">Sue Speed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Topic</Label>
          <RadioGroup onValueChange={(value) => handleInputChange('topic', value)}>
            {['Positive Reinforcement', 'At Risk Behavior', 'Not Following Policy', 'Unsafe Condition'].map((topic) => (
              <div key={topic} className="flex items-center space-x-2">
                <RadioGroupItem value={topic} id={topic} />
                <Label htmlFor={topic}>{topic}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div>
          <Label htmlFor="actionAddressed">Action Addressed</Label>
          <Textarea
            id="actionAddressed"
            value={formData.actionAddressed}
            onChange={(e) => handleInputChange('actionAddressed', e.target.value)}
          />
        </div>
        <Button type="submit">Submit Observation</Button>
      </form>
    </div>
  );
}

export default App;