// models/ProductOffer.js

const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
  offerName: {
    type: String, 
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',  
  },

  discountValue: {
    type: Number,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,

  },
  discountAmount: {
    type: Number,
    default: 0
},
  islist: {
    type: Boolean,
    default: false
},
});

const ProductOffer = mongoose.model('ProductOffer', productOfferSchema);

module.exports = ProductOffer;
