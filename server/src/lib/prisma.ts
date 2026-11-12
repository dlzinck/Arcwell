import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

// Read the PostgreSQL connection string from the environment.
const connectionString = process.env.DATABASE_URL

// Stop startup if the database connection string is missing.
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured')
}

// Create the PostgreSQL adapter.
// This allows Prisma to communicate with our database.
const adapter = new PrismaPg({ connectionString })

// Create a Prisma Client using the PostgreSQL adapter.
// We'll reuse this instance throughout our Express backend.
export const prisma = new PrismaClient({ adapter })
