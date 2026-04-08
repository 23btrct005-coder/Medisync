const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabase');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      name, dob, gender, phone, email, address,
      bloodGroup, allergies, diseases, medications,
      emergencyContactName, emergencyContactPhone, password
    } = req.body;

    // Validate inputs
    if (!name || !dob || !gender || !phone || !email || !address || !bloodGroup || !emergencyContactName || !emergencyContactPhone || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    // Check if patient already exists in Supabase
    const { data: existingPatients, error: checkError } = await supabase
      .from('patients')
      .select('email')
      .eq('email', email);

    if (checkError) {
      console.error(checkError);
      return res.status(500).json({ success: false, message: 'Database error checking existing user.' });
    }

    if (existingPatients && existingPatients.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save patient in Supabase
    const { data: insertData, error: insertError } = await supabase
      .from('patients')
      .insert([
        {
          name,
          dob,
          gender,
          phone,
          email,
          address,
          blood_group: bloodGroup, // Map to snake_case column
          allergies,
          diseases,
          medications,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          password: hashedPassword,
          verified: false
        }
      ])
      .select(); // Ask Supabase to return the inserted row

    if (insertError) {
      console.error(insertError);
      return res.status(500).json({ success: false, message: 'Failed to save patient to database.' });
    }

    const newPatient = insertData[0];

    // Create JWT
    const token = jwt.sign({ id: newPatient.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    res.status(201).json({ success: true, message: 'Patient registered successfully.', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Fetch user from Supabase
    const { data: users, error } = await supabase
      .from('patients')
      .select('id, email, password, name')
      .eq('email', email);

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error during login.' });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const patient = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: patient.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    res.status(200).json({ 
      success: true, 
      message: 'Login successful.',
      token,
      patient: { id: patient.id, name: patient.name, email: patient.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

module.exports = router;
