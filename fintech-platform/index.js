const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const HASURA_URL = 'http://localhost:8080/v1/graphql';
const SECRET_KEY = 'your_secret_key';

// Middleware for JWT authentication
function authenticate(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    try {
      const decoded = jwt.verify(req.token, SECRET_KEY);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(400).json({ message: 'Invalid token.' });
    }
  } else {
    res.status(401).json({ message: 'Access denied. No token provided.' });
  }
}

// Register User
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
  
    // Check if the email is already in use
    const checkUserQuery = `
      query {
        users(where: {email: {_eq: "${email}"}}) {
          id
        }
      }
    `;
  
    try {
      const checkUserResponse = await axios.post(HASURA_URL, { query: checkUserQuery });
      if (checkUserResponse.data.data.users.length > 0) {
        return res.status(400).json({ message: 'Email is already in use.' });
      }
  
      // Hash the password and insert the new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertUserQuery = `
        mutation {
          insert_users_one(object: {name: "${name}", email: "${email}", password: "${hashedPassword}"}) {
            id
            name
            email
          }
        }
      `;
  
      const response = await axios.post(HASURA_URL, { query: insertUserQuery });
      res.send(response.data.data.insert_users_one);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred while registering the user.' });
    }
  });
  

// Login User
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const query = `
    query {
      users(where: {email: {_eq: "${email}"}}) {
        id
        name
        email
        password
      }
    }
  `;

  try {
    const response = await axios.post(HASURA_URL, { query });
    const user = response.data.data.users[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
      res.send({ token });
    } else {
      res.status(400).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

// Deposit & Withdraw
app.post('/transaction', authenticate, async (req, res) => {
  const { type, amount } = req.body;
  const userId = req.user.id;

  // Input validation
  if (!type || !['deposit', 'withdrawal'].includes(type)) {
    return res.status(400).json({ message: 'Invalid transaction type.' });
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount.' });
  }

  try {
    // Fetch the user's current balance
    const balanceQuery = `
      query {
        users_by_pk(id: ${userId}) {
          balance
        }
      }
    `;
    const balanceResponse = await axios.post(HASURA_URL, { query: balanceQuery });
    const currentBalance = balanceResponse.data.data.users_by_pk.balance;

    // Check if the user has sufficient balance for withdrawal
    if (type === 'withdrawal' && currentBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    // Perform the transaction
    const transactionQuery = `
      mutation {
        insert_transactions_one(object: {user_id: ${userId}, type: "${type}", amount: ${amount}}) {
          id
          user_id
          type
          amount
        }
      }
    `;
    const transactionResponse = await axios.post(HASURA_URL, { query: transactionQuery });
    const transaction = transactionResponse.data.data.insert_transactions_one;

    // Update the user's balance
    const updateBalanceQuery = `
      mutation {
        update_users(where: {id: {_eq: ${userId}}}, _inc: {balance: ${type === 'deposit' ? amount : -amount}}) {
          affected_rows
        }
      }
    `;
    await axios.post(HASURA_URL, { query: updateBalanceQuery });

    res.send(transaction);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred during the transaction.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
