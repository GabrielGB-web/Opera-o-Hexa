-- Database Schema for Supabase (PostgreSQL)
-- Project: Diversão Premiada - Dia das Crianças
-- Francal Distribuidora

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
    prize_name TEXT,
    is_winner INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- To reset the database for the new promotion, run:
-- TRUNCATE TABLE registrations RESTART IDENTITY;
-- TRUNCATE TABLE stores RESTART IDENTITY;
