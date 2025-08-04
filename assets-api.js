const express = require('express');
const router = express.Router();

// Mock data representing the application's assets
const assets = {
  accounts: [
    { id: 'acc001', name: 'Savings Account', type: 'savings' },
    { id: 'acc002', name: 'Checking Account', type: 'checking' }
  ],
  branches: [
    { id: 'br001', name: 'Main Branch', city: 'New York' },
    { id: 'br002', name: 'Downtown Branch', city: 'Chicago' }
  ],
  creditCards: [
    { id: 'cc001', name: 'Platinum Card', limit: 10000 },
    { id: 'cc002', name: 'Gold Card', limit: 5000 }
  ],
  loans: [
    { id: 'ln001', name: 'Home Loan', amount: 200000 },
    { id: 'ln002', name: 'Car Loan', amount: 25000 }
  ],
  payments: [
    { id: 'pm001', from: 'acc001', to: 'vendor001', amount: 200 },
    { id: 'pm002', from: 'acc002', to: 'vendor002', amount: 100 }
  ],
  investments: [
    { id: 'inv001', name: 'Mutual Fund A', value: 5000 },
    { id: 'inv002', name: 'Stock Portfolio', value: 12000 }
  ]
};

// Generic route to list all assets
router.get('/', (req, res) => {
  res.json({ message: 'Available asset types', types: Object.keys(assets) });
});

// Specific route for each asset type
router.get('/:type', (req, res) => {
  const { type } = req.params;
  if (!assets[type]) {
    return res.status(404).json({ error: 'Asset type not found' });
  }
  res.json(assets[type]);
});

module.exports = router;
