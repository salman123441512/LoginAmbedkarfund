const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // Import multer
const path = require('path'); // For handling file paths

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve the uploads folder statically

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/financeDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where images will be saved
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save the file with a unique name
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png) are allowed'));
    }
  }
});

// User schema definition
const userSchema = new mongoose.Schema({
  name: { required: [true, 'User Name is required'], type: String },
  email: { required: [true, 'Email is required'], type: String, unique: [true, 'This Email already exists'] },
  password: { type: String, required: [true, 'Password is required'] },
  phone: { type: String, required: [true, 'Phone No. is required'], unique: [true, 'This Number already exists'] },
  role: { type: String, default: 'buyer' },
  address: { type: String, default: '' },
  date: { type: String, default: Date.now },
  image: { type: String, default: '' },
  otp: { type: Number },
  accountNumber: { type: String, unique: true },
  aadharCard: String,
  panCard: String,
  totalAmount: { type: Number, default: 0 },
  transactions: [
    {
      date: { type: Date, default: Date.now },
      type: { type: String }, // 'credit' or 'debit'
      amount: { type: Number },
      newTotalAmount: { type: Number }
    }
  ]
});

const User = mongoose.model('User', userSchema);

const contactusSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String
})

const Contactus = mongoose.model('contactus', contactusSchema)

// Function to generate a new sequential account number
const generateAccountNumber = async () => {
  const lastUser = await User.findOne().sort({ accountNumber: -1 });
  const lastAccountNumber = lastUser ? parseInt(lastUser.accountNumber) : 1000;
  return (lastAccountNumber + 1).toString();
};

// Create User with automatically generated account number and hashed password
app.post('/api/users', upload.single('image'), async (req, res) => {
  try {
    const accountNumber = await generateAccountNumber();

    // Generate hashed password (bcrypt)
    const salt = await bcrypt.genSalt(10); // Salt for hashing
    const hashedPassword = await bcrypt.hash(accountNumber, salt); // Hashing account number

    // Build user data object
    const userData = {
      ...req.body,
      accountNumber, // Generated account number
      password: hashedPassword, // Hashed password
      image: req.file ? `/uploads/${req.file.filename}` : '' // Save image path if uploaded
    };

    // Create new user instance
    const user = new User(userData);

    // Save user to the database
    await user.save();

    // Return success response
    res.status(201).json(user);
  } catch (error) {
    // Return error response
    res.status(400).json({ error: 'Error creating user', details: error.message });
  }
});

// GET ALL USERS FOR DATA TABLE 
app.get("/api/users", async (req, res) => {
  try {
    const allUsers = await User.find();
    if (allUsers) {
      res.send(allUsers);
    } else {
      res.status(404).send('Users not found');
    }
  } catch (error) {
    res.status(500).send({ error: 'Error fetching users', details: error.message });
  }
});

// Get User by Account Number
app.get('/api/users/:accountNumber', async (req, res) => {
  try {
    const user = await User.findOne({ accountNumber: req.params.accountNumber });
    if (!user) return res.status(404).send('User not found');
    res.send(user);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching user', details: error.message });
  }
});

// Update Amount for User (Credit/Debit)
app.put('/api/users/:accountNumber/update-amount', async (req, res) => {
  try {
    const { amount, type } = req.body;
    const accountNumber = req.params.accountNumber;

    if (amount == null || type == null) {
      return res.status(400).send({ error: 'Amount and type are required' });
    }

    if (amount <= 0 || isNaN(amount)) {
      return res.status(400).send({ error: 'Transaction amount must be a positive number' });
    }

    if (type !== 'credit' && type !== 'debit') {
      return res.status(400).send({ error: 'Invalid transaction type' });
    }

    const user = await User.findOne({ accountNumber });

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    let newTotalAmount;
    if (type === 'credit') {
      newTotalAmount = user.totalAmount + amount;
    } else if (type === 'debit') {
      if (user.totalAmount < amount) {
        return res.status(400).send({ error: 'Insufficient funds for debit' });
      }
      newTotalAmount = user.totalAmount - amount;
    }

    const transaction = {
      date: new Date(),
      type,
      amount,
      newTotalAmount
    };

    user.totalAmount = newTotalAmount;
    user.transactions.push(transaction);

    await user.save();
    res.send(user);

  } catch (error) {
    res.status(400).send({ error: 'Error updating amount', details: error.message });
  }
});

// Get last 5 transactions for passbook
app.get('/api/users/:accountNumber/transactions', async (req, res) => {
  try {
    const user = await User.findOne({ accountNumber: req.params.accountNumber });

    if (!user) return res.status(404).send('User not found');
    if (!user.transactions || user.transactions.length === 0) {
      return res.status(404).send('No transactions found for this user');
    }

    const last5Transactions = user.transactions;
    res.send(last5Transactions);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching transactions', details: error.message });
  }
});





//  Contactus API 

// POST API: Create a new contact submission
app.post('/api/contactus', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Create a new contact entry
    const newContact = new Contactus({ name, email, phone, subject, message });
    await newContact.save();

    return res.status(201).json({ message: 'Contact message saved successfully', contact: newContact });
  } catch (error) {
    return res.status(500).json({ message: 'Error saving contact message', error: error.message });
  }
});

// GET API: Retrieve all contact submissions
app.get('/api/contactus', async (req, res) => {
  try {
    const contacts = await Contactus.find();
    return res.status(200).json(contacts);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving contact messages', error: error.message });
  }
});

// DELETE API: Delete a contact submission by ID
app.delete('/api/contactus/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find contact by ID and delete it
    const deletedContact = await Contactus.findByIdAndDelete(id);

    if (!deletedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    return res.status(200).json({ message: 'Contact deleted successfully', contact: deletedContact });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting contact message', error: error.message });
  }
});

// LOGIN API 

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Login API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token with the user's ID and role
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    // Send the token and the role in response
    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      data:user
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin route (protected)
app.get('/api/admin', verifyToken, async (req, res) => {

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json({ message: 'Welcome Admin'});
});

// Buyer route (protected)
app.get('/api/buyer', verifyToken, (req, res) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json({ message: 'Welcome Buyer' });
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
