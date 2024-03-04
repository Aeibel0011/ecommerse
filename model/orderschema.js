const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ordersSchema = new Schema({
    orderId: {
        type: String,
        default: function() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    date: {
        type: Date,
        default: Date.now,
        required: false,
    },
    totalAmount: {
        type: Number,
    },
    paymentMethod: {
        type: String,
        required: false
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products'
        },
        quantity: {
            type: Number,
            required: false,
        },
        salesPrice: {
            type: Number,
            required: false
        },
        total: {
            type: Number,
            required: false
        },
        Status: {
            type: String,
            default:"pending"
        },
        reason: {
            type: String,
        }
    }],
    address: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        
        
        address: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        }
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    orderStatus: {
        type: String,
        default: 'pending'
    },
    deliveredDate: {
        type: Date,
        default: null,
    },
    deliveredData: {
        type: Date,
        default: null
    },
    paymentStatus: {
        type: String,
        default: 'pending'
    }

}, {
    timestamps: true
});

const orderModel = mongoose.model('orders', ordersSchema);

module.exports = orderModel;















