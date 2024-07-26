import './App.css';
import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Transaction from './components/Transaction';

const App = () => {
  const [page, setPage] = useState('login'); // Page state to manage current view

  const handleLogin = () => {
    setPage('transaction');
  };

  const handleRegister = () => {
    setPage('login'); // Redirect to login after successful registration
  };

  const goToRegister = () => {
    setPage('register'); // Navigate to the register page
  };

  return (
    <div>
      <h1>Fintech Platform</h1>
      {page === 'login' && (
        <>
          <Login onLogin={handleLogin} />
          <button onClick={goToRegister} className='regbutton'>Go to Register</button>
        </>
      )}
      {page === 'register' && (
        <Register onRegister={handleRegister} />
      )}
      {page === 'transaction' && <Transaction />}
    </div>
  );
};

export default App;
