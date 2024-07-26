import React, { useState } from 'react';

const Transaction = () => {
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTransaction = async () => {
    setError('');
    setSuccess('');
  
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You need to log in to perform a transaction.');
      return;
    }
  
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type, amount: parseFloat(amount) }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message || 'Transaction failed.');
        return;
      }
  
      setSuccess('Transaction successful!');
      setAmount('');
    } catch (error) {
      console.error('Error during transaction:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className='Middle'>
      <h2>Transactions</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <div className='transaction-boxes'>
        <label>
          Transaction Type:
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
        </label>
      </div>
      <div className='transaction-boxes'>
        <label>
          Amount:
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      </div>
      <button onClick={handleTransaction} className='button'>Submit</button>
    </div>
  );
};

export default Transaction;
