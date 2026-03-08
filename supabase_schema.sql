-- Database Schema for Supabase (PostgreSQL)
-- Project: Opera-o-Hexa

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cnpj TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    fantasia TEXT NOT NULL,
    endereco TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    cpf TEXT NOT NULL,
    phone TEXT NOT NULL,
    store TEXT NOT NULL,
    coupon_number TEXT NOT NULL,
    receipt_path TEXT,
    is_winner SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_registrations_cpf ON registrations(cpf);
CREATE INDEX IF NOT EXISTS idx_registrations_store_coupon ON registrations(store, coupon_number);
CREATE INDEX IF NOT EXISTS idx_stores_fantasia ON stores(fantasia);

-- Row Level Security (RLS) - Example policies (adjust as needed)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow public to read stores
CREATE POLICY "Enable read access for all users" ON stores FOR SELECT USING (true);

-- Allow admin (public for now) to insert stores
-- IMPORTANT: In production, restrict this to admin users only!
CREATE POLICY "Enable insert for all users" ON stores FOR INSERT WITH CHECK (true);

-- Allow public to register (insert)
CREATE POLICY "Enable insert for registrations" ON registrations FOR INSERT WITH CHECK (true);

-- Note: In a production Supabase environment, you would typically restrict 
-- access further using Supabase Auth and specific roles.
