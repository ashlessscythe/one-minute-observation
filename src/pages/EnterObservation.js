import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '../components/ThemeProvider';
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Textarea } from "../components/ui/textarea"
import { Link } from 'react-router-dom';
import { SearchableSelect } from '../components/SearchableSelect';

function EnterObservation() {
  const API_URL = process.env.REACT_APP_API_URL || '';
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supervisorName: '',
    shift: '',
    associateName: '',
    topic: '',
    actionAddressed: '',
  });
  const [users, setUsers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [dateError, setDateError] = useState('');
  const dateInputRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users?isSupervisor=false`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setUsers(data);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users?isSupervisor=true`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setSupervisors(data);
    } catch (e) {
      console.error('Error fetching supervisors:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSupervisors();
  }, []);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (name === 'date') {
      validateDate(value);
    }
  };

  const validateDate = (date) => {
    const selectedDate = new Date(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      setDateError('Please enter a valid date');
      return false;
    }
    if (selectedDate > currentDate) {
      setDateError('Date cannot be in the future');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateDate(formData.date)) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/observations`, {
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
      setFormData({
        date: new Date().toISOString().split('T')[0],
        supervisorName: '',
        shift: '',
        associateName: '',
        topic: '',
        actionAddressed: '',
      });
      
      alert('Observation submitted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting observation:', error);
      alert('Error submitting observation. Please try again.');
    }
  };

  return (
    <ThemeProvider>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">One Minute Observation Submission Form</h1>
          <Link to="/">
            <Button className="transition-all bg-blue-500 hover:bg-blue/90 hover:text-primary-foreground hover:shadow-lg hover:scale-105">Back to Home</Button>
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              id="date"
              ref={dateInputRef}
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
          </div>
          <div>
            <Label htmlFor="supervisorName">Supervisor Name</Label>
            <SearchableSelect
              options={supervisors}
              onSelect={(supervisor) => handleInputChange('supervisorName', supervisor.name)}
              placeholder="Select a supervisor"
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
            <SearchableSelect
              options={users}
              onSelect={(user) => handleInputChange('associateName', user.name)}
              placeholder="Select an associate"
            />
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
          <Button className="hover:scale-105" type="submit">Submit Observation</Button>
        </form>
      </div>
    </ThemeProvider>
  );
}

export default EnterObservation;