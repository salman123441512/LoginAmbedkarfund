import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CreateUser from './Pages/CreateUser';
import CreditDebitAmount from './Pages/CreditDebitAmount';
import Customer from './Pages/Customer';
import Ticket from './Pages/Ticket';
import Setting from './Pages/Setting';
import Login from './Pages/Login';
import Admin from './Pages/Admin';

const App = () => (
  <Router>
    <div>
      <Routes>
        <Route path="/" element={<CreateUser />} />
        <Route path="/credit-debit" element={<CreditDebitAmount />} />
        <Route path='/customer' element={<Customer/>}/>
        <Route path='/ticket' element={<Ticket/>}/>
        <Route path='/setting' element={<Setting/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/admin' element={<Admin/>}/>
      </Routes>
    </div>
  </Router>
);

export default App;
