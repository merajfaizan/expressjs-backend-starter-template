import { PrismaClient } from '@prisma/client';
import { initiateSuperAdmin } from '../app/db/db';

const prisma = new PrismaClient();

async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('Prisma connected to the database successfully!');

    try {
      await initiateSuperAdmin();
    } catch (error) {
      console.warn(
        'Super admin seed skipped. Ensure MongoDB is running as a replica set for write operations.',
        error
      );
    }
  } catch (error) {
    console.error('Prisma connection failed:', error);
    process.exit(1);
  }

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('Prisma disconnected due to application termination.');
    process.exit(0);
  });
}

connectPrisma();

export default prisma;
