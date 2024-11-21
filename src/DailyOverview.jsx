import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

function DailyOverview() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTgOf89gc2cwxLwQpfLTWoIw2KoZ5BOxILsXCFNoJZJCpByDT7Gd89GRfPNX_nPXlF6zb9u5vXnvCnt/pub?gid=0&single=true&output=csv');
      const csvData = await response.text();
      const parsedData = Papa.parse(csvData, { header: true }).data;
      const processedData = processData(parsedData);
      setData(processedData);
    };

    fetchData();
  }, []);

  const processData = (data) => {
    let visitorsInAcc = 0;
    let visitorsOutAcc = 0;
    let visitorsLive = 0;
    let dailyData = {};

    data.forEach((row) => {
      const date = row['Timestamp'].split(' ')[0];
      const visitorsIn = parseInt(row['Visitors Entering'] || 0);
      const visitorsOut = parseInt(row['Visitors Leaving'] || 0);

      visitorsInAcc += visitorsIn;
      visitorsOutAcc += visitorsOut;
      visitorsLive = visitorsInAcc - visitorsOutAcc;

      if (!dailyData[date]) {
        dailyData[date] = {
          visitorsIn: 0,
          visitorsOut: 0,
          visitorsLive: 0,
          dwellTime: 0,
          count: 0
        };
      }

      dailyData[date].visitorsIn += visitorsIn;
      dailyData[date].visitorsOut += visitorsOut;
      dailyData[date].visitorsLive = visitorsInAcc - visitorsOutAcc;
      dailyData[date].count++;
    });

    Object.keys(dailyData).forEach((date) => {
      dailyData[date].dwellTime = dailyData[date].count > 0 ? dailyData[date].visitorsLive / dailyData[date].count : 0;
    });

    return Object.entries(dailyData).map(([date, values]) => ({
      date,
      ...values
    }));
  };

  return (
    <div>
      <h2>Daily Overview</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Visitors Entering</th>
            <th>Visitors Leaving</th>
            <th>Visitors Live</th>
            <th>Day Dwell Time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.date}</td>
              <td>{item.visitorsIn}</td>
              <td>{item.visitorsOut}</td>
              <td>{item.visitorsLive}</td>
              <td>{item.dwellTime.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DailyOverview;
