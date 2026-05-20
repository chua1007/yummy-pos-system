#!/bin/bash
set -e

echo "🍽️  Setting up Yummy development environment..."
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "📦 Installing pnpm..."; npm install -g pnpm; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker not found. You'll need it for local databases."; }

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🐳 Starting infrastructure services..."
if command -v docker >/dev/null 2>&1; then
  docker compose -f infrastructure/docker/docker-compose.yml up -d
  echo "   ✓ PostgreSQL on localhost:5432"
  echo "   ✓ Redis on localhost:6379"
  echo "   ✓ Kafka on localhost:19092"
  echo "   ✓ Kafka UI on localhost:8080"
else
  echo "   ⚠️  Skipping Docker services (Docker not available)"
fi

echo ""
echo "📋 Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   ✓ Created .env from .env.example"
else
  echo "   ✓ .env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm dev              - Start all apps in development mode"
echo "  pnpm --filter @yummy/web dev    - Start web dashboard (port 3000)"
echo "  pnpm --filter @yummy/pos dev    - Start POS terminal (port 3001)"
echo "  pnpm build            - Build all packages"
echo "  pnpm lint             - Lint all packages"
echo ""
echo "Infrastructure:"
echo "  docker compose -f infrastructure/docker/docker-compose.yml up -d"
echo "  docker compose -f infrastructure/docker/docker-compose.yml down"
echo ""
