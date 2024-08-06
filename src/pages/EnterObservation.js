import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '../components/ThemeProvider';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Textarea } from "../components/ui/textarea"
import { DatePicker } from "../components/ui/date-picker"
import { Link } from 'react-router-dom';
import { ScrollArea } from '../components/ui/scroll-area';
import { Scroll } from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';


function EnterObservation() {
  const API_URL = process.env.REACT_APP_API_URL || '';
  const [formData, setFormData] = useState({
    date: '',
    supervisorName: '',
    shift: '',
    associateName: '',
    topic: '',
    actionAddressed: '',
  });
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async() => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setUsers(data);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    u.name.toLowerCase().includes(searchTerm.toLowerCase());
  })

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

const handleSubmit = async (event) => {
    event.preventDefault();
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
      // Reset form
      setFormData({
        date: '',
        supervisorName: '',
        shift: '',
        associateName: '',
        topic: '',
        actionAddressed: '',
      });
      
      // show msg
      alert('Observation submitted successfully!');

      // nav home
      Navigate('/')
    } catch (error) {
      console.error('Error submitting observation:', error);
      // Show error message to user

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
        <div className="container mx-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <DatePicker
                date={formData.date}
                setDate={(newDate) => handleInputChange('date', newDate)}
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
      </div>
    </ThemeProvider>
  );
}

export default EnterObservation;