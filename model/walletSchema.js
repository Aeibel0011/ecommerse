// models/Wallet.js

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactions: [TransactionSchema],
  pendingOrder:{
        orderId:{
            type:String
        },
        amount:{

            type:Number,
            min:0
        },
        currency:{
            type:String
        }
  },
},{
    timestamps:true
});

module.exports = mongoose.model('Wallet', WalletSchema);
