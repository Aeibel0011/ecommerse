const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    maxDiscountAmount: {
        type: Number
    },
    minAmount: {
        type: Number,
        required: true
    },
    maxAmount: {
        type: Number
    },
    expiryDate: {
        type: Date,
        required: true
    },
    islist: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number,
        default: 1
    },
    usageCount: {
        type: Number,
        default: 0
    }
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
