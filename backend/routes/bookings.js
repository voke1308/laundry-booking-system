import { Router } from 'express';
import Joi from 'joi';
import { appendFile } from 'fs/promises';
import { join } from 'path';
import Booking from '../models/Booking.js';
import { calculatePrice, SERVICE_RATES } from '../utils/pricing.js';

const router = Router();

const allowedServices = Object.keys(SERVICE_RATES);
const allowedStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];

function getMinPickupDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate());
  return d;
}

const baseSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  address: Joi.string().min(5).max(500).required(),
  serviceType: Joi.string().valid(...allowedServices).required(),
  items: Joi.object().pattern(Joi.string(), Joi.number().integer().min(0)).required(),
  pickupDate: Joi.date().iso().required(),
});

router.post('/', async (req, res, next) => {
  try {
    // Log incoming request for debugging
    const debugLog = `\n[${new Date().toISOString()}] BOOKING ATTEMPT\n` +
      `Request body: ${JSON.stringify(req.body, null, 2)}\n`;
    try {
      await appendFile(join(process.cwd(), 'bookings.txt'), debugLog, 'utf-8');
    } catch (err) {
      console.error('Failed to write debug log:', err);
    }

    const { value, error } = baseSchema.validate(req.body, { abortEarly: false, convert: true });
    if (error) {
      // Log validation error details
      const errorLog = `Validation error: ${JSON.stringify(error.details, null, 2)}\n`;
      try {
        await appendFile(join(process.cwd(), 'bookings.txt'), errorLog, 'utf-8');
      } catch (err) {
        console.error('Failed to write error log:', err);
      }
      return res.status(400).json({ message: 'Validation failed', details: error.details });
    }

    const minDate = getMinPickupDate();
    const pick = new Date(value.pickupDate);
    pick.setHours(0, 0, 0, 0);
    if (isNaN(pick.getTime()) || pick < minDate) {
      return res.status(400).json({ message: 'Pickup date must be at least 7 days from today' });
    }

    // Check at least one item
    const hasItems = Object.values(value.items).some((qty) => qty > 0);
    if (!hasItems) {
      return res.status(400).json({ message: 'Please select at least one item' });
    }

    const price = calculatePrice(value.serviceType, value.items);

    const booking = await Booking.create({
      ...value,
      pickupDate: pick,
      price,
    });

    // Write to text file
    const logEntry = `\n[${new Date().toISOString()}] NEW BOOKING\n` +
      `ID: ${booking._id}\n` +
      `Name: ${booking.name}\n` +
      `Phone: ${booking.phone}\n` +
      `Address: ${booking.address}\n` +
      `Service: ${booking.serviceType}\n` +
      `Items: ${JSON.stringify(Object.fromEntries(booking.items))}\n` +
      `Pickup Date: ${booking.pickupDate.toISOString().split('T')[0]}\n` +
      `Price: ₹${booking.price}\n` +
      `Status: ${booking.status}\n` +
      `Created: ${booking.createdAt}\n` +
      `${'='.repeat(60)}\n`;
    
    try {
      await appendFile(join(process.cwd(), 'bookings.txt'), logEntry, 'utf-8');
    } catch (err) {
      console.error('Failed to write to bookings.txt:', err);
    }

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Booking not found' });

    // Log status update
    const logEntry = `\n[${new Date().toISOString()}] STATUS UPDATE\n` +
      `ID: ${updated._id}\n` +
      `New Status: ${updated.status}\n` +
      `${'='.repeat(60)}\n`;
    
    try {
      await appendFile(join(process.cwd(), 'bookings.txt'), logEntry, 'utf-8');
    } catch (err) {
      console.error('Failed to write to bookings.txt:', err);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Booking not found' });

    // Log deletion
    const logEntry = `\n[${new Date().toISOString()}] DELETED BOOKING\n` +
      `ID: ${deleted._id}\n` +
      `Name: ${deleted.name}\n` +
      `Phone: ${deleted.phone}\n` +
      `${'='.repeat(60)}\n`;
    
    try {
      await appendFile(join(process.cwd(), 'bookings.txt'), logEntry, 'utf-8');
    } catch (err) {
      console.error('Failed to write to bookings.txt:', err);
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
