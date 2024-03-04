const mongoose=require('mongoose')



const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    addresses: [
        {
            
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
            // Add other fields as needed
        }
    ]
});

const AddressModel = mongoose.model('Address', addressSchema);

module.exports = AddressModel;
