-- Initialize Yummy development database
-- Creates schemas for multi-tenant testing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application role
CREATE ROLE yummy_app WITH LOGIN PASSWORD 'yummy_app_dev';
GRANT ALL PRIVILEGES ON DATABASE yummy_dev TO yummy_app;

-- Create schemas for service isolation
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS menu;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS customers;
CREATE SCHEMA IF NOT EXISTS tenants;

-- Grant schema access
GRANT ALL ON SCHEMA orders TO yummy_app;
GRANT ALL ON SCHEMA menu TO yummy_app;
GRANT ALL ON SCHEMA inventory TO yummy_app;
GRANT ALL ON SCHEMA customers TO yummy_app;
GRANT ALL ON SCHEMA tenants TO yummy_app;

-- Seed a default tenant for development
INSERT INTO public.tenants (id, name, slug, plan, status, region, currency, timezone, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Yummy Dev Cafe',
  'yummy-dev-cafe',
  'growth',
  'active',
  'ap-southeast-1',
  'MYR',
  'Asia/Kuala_Lumpur',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
