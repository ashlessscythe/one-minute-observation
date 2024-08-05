import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { DarkModeToggle } from './components/DarkModeToggle';
import MainPage from './components/MainPage';
import EnterObservation from './components/EnterObservation';
import ViewObservations from './components/ViewObservations';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="container mx-auto p-4">
          <div className="flex justify-end mb-6">
            <DarkModeToggle />
          </div>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/enter" element={<EnterObservation />} />
            <Route path="/view" element={<ViewObservations />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;