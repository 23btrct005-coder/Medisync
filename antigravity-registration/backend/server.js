const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Set up detailed MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/antigravity-medical';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to Cosmic MongoDB successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema Definition covering all Antigravity requirements
const patientSchema = new mongoose.Schema({
  // Personal Info
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  nationalId: { type: String },
  maritalStatus: { type: String },
  occupation: { type: String },
  profilePhotoUrl: { type: String },

  // Contact Details
  mobileNumber: { type: String, required: true },
  altMobileNumber: { type: String },
  email: { type: String, required: true, unique: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },

  // Emergency Contact
  emergencyContactName: { type: String, required: true },
  emergencyRelationship: { type: String },
  emergencyPhone: { type: String, required: true },
  altEmergencyPhone: { type: String },

  // Medical Info
  bloodGroup: { type: String, required: true },
  height: String,
  weight: String,
  allergies: [String],
  existingDiseases: [String],
  currentMedications: String,
  pastSurgeries: String,
  disability: {
    hasDisability: Boolean,
    details: String
  },
  insuranceProvider: String,
  insuranceId: String,

  // Advanced Health Data
  familyHistory: String,
  lifestyle: {
    smoking: Boolean,
    alcohol: Boolean,
    exerciseLevel: String
  },
  organDonor: Boolean,

  // Security
  password: { type: String, required: true }

}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);

// Configure Multer for local uploads mimicking Cloudinary
const upload = multer({ dest: 'uploads/' });

// Routes
app.post('/api/patients/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const rawData = JSON.parse(req.body.data);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawData.password, salt);
    
    rawData.password = hashedPassword;
    
    if (req.file) {
      // In real scenario, upload to Cloudinary. Here we just save the local path.
      rawData.profilePhotoUrl = `/uploads/${req.file.filename}`;
    }

    const newPatient = new Patient(rawData);
    await newPatient.save();
    
    res.status(201).json({ success: true, message: 'Patient onboarding successful!', patientId: newPatient._id });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Failed to offboard into cosmos. Database error.' });
  }
});

app.listen(PORT, () => console.log(`Antigravity Backend hovering on port ${PORT}`));
