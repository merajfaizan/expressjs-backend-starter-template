import { UserRole } from '@prisma/client';
import prisma from '../../shared/prisma';
import config from '../../config';
import * as bcrypt from 'bcrypt';

export const initiateSuperAdmin = async () => {
  const payload = {
    firstName: config.superAdmin.firstName,
    lastName: config.superAdmin.lastName,
    username: config.superAdmin.username,
    phone: config.superAdmin.phone,
    email: config.superAdmin.email,
    password: config.superAdmin.password,
    role: UserRole.SUPER_ADMIN,
  };

  const hashedPassword: string = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds)
  );

  const isExistUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isExistUser) return;

  await prisma.user.create({
    data: { ...payload, password: hashedPassword },
  });
};
