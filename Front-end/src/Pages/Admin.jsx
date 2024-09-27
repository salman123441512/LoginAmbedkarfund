import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


export default function Admin() {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');

        // If no token, redirect to login
        if (!token) {
          navigate('/login');
          return;
        }

        // Send request to the protected /admin route
        const res = await axios.get('http://localhost:5000/api/admin', {
          headers: {
            Authorization: `Bearer ${token}`, // Pass JWT token
          },
        });

        // Set admin data on success
        setAdminData(res.data.message);
        console.log(res.data)
        setLoading(false);
      } catch (error) {
        // Handle unauthorized access or other errors
        if (error.response && error.response.status === 403) {
          setErrorMessage('Access denied. You are not authorized to view this page.');
        } else {
          setErrorMessage('An error occurred. Please try again.');
        }
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (errorMessage) {
    return <div className="error-message">{errorMessage}</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <ul className="admin-nav">
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#users">User Management</a></li>
          <li><a href="#reports">Reports</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </div>

      <div className="admin-content">
        <h1>{adminData}</h1>
        <div className="admin-cards">
          <div className="card">
            <h3>Total Users</h3>
            <p>1200</p>
          </div>
          <div className="card">
            <h3>New Users Today</h3>
            <p>35</p>
          </div>
          <div className="card">
            <h3>Total Transactions</h3>
            <p>$250,000</p>
          </div>
        </div>
      </div>
    </div>
  );
}
