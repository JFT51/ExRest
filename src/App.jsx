import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DailyOverview from './DailyOverview.jsx';
import HourlyAnalysis from './HourlyAnalysis.jsx';
import WeekdayAnalysis from './WeekdayAnalysis.jsx';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Daily Overview</Link>
            </li>
            <li>
              <Link to="/hourly">Hourly Analysis</Link>
            </li>
            <li>
              <Link to="/weekday">Weekday Analysis</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<DailyOverview />} />
          <Route path="/hourly" element={<HourlyAnalysis />} />
          <Route path="/weekday" element={<WeekdayAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
