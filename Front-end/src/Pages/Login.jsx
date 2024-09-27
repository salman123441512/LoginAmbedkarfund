import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    debugger;
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      const { token, role } = res.data;

      // Save token to localStorage
      localStorage.setItem('token', token);

      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'buyer') {
        navigate('/buyer');
      }
    } catch (error) {
      console.error('Login failed', error);
      setErrorMessage('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="text-center">Login</h2>
        <div className="form-group">
          <input
            type="email"
            className="form-control mb-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {errorMessage && <p className="text-danger">{errorMessage}</p>}
        <button className="btn btn-primary btn-block mt-2" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
