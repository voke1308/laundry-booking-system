import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    serviceType: {
      type: String,
      required: true,
      enum: ['WASH_FOLD', 'WASH_IRON', 'DRY_CLEAN'],
    },
    items: { type: Map, of: Number, default: {} },
    pickupDate: { type: Date, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Booking', BookingSchema);
