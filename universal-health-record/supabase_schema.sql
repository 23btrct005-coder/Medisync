-- Run this in your Supabase SQL Editor to create the patients table

CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    dob DATE NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    allergies TEXT,
    diseases TEXT,
    medications TEXT,
    emergency_contact_name TEXT NOT NULL,
    emergency_contact_phone TEXT NOT NULL,
    password TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: Ensure Row Level Security (RLS) is disabled if you want your backend to write to it without authentication, 
-- or enable RLS and use the Service Role Key for backend administration.
