
const express = require('express');            // 1. Express app
const mongoose = require('mongoose');          // 2. Mongoose for MongoDB
const cors = require('cors');                  // 3. Allow cross-origin requests
const morgan = require('morgan');              // 4. Logger for requests
require('dotenv').config();                    // 5. Load .env file

const app = express();

app.use(cors());             // allow frontend to call backend
app.use(express.json());     // parse JSON bodies
app.use(morgan('dev'));      // log requests in console

// --- Mongoose model ---
const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

// --- Routes ---
// GET /api/transactions  -> list transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const items = await Transaction.find().sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions -> create transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const t = await Transaction.create(req.body);
    res.status(201).json(t);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT /api/transactions/:id -> update
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const t = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(t);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE /api/transactions/:id -> delete
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch(e) {
    res.status(400).json({ message: e.message });
  }
});

// GET /api/summary -> totals (income, expense, balance)
app.get('/api/summary', async (req, res) => {
  const agg = await Transaction.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' } } }]);
  const totals = { income: 0, expense: 0 };
  agg.forEach(x => (totals[x._id] = x.total));
  totals.balance = totals.income - totals.expense;
  res.json(totals);
});

// --- Start server ---
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { dbName: 'money_tracker' })
  .then(() => {
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  });
