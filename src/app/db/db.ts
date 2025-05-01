import { UserRole } from "@prisma/client";
import prisma from "../../shared/prisma";
import config from "../../config";
import * as bcrypt from "bcrypt";

export const initiateSuperAdmin = async () => {
  const payload: any = {
    firstName: "Mr. Super",
    lastName: "Admin",
    username: "admin",
    phone: "0112345678",
    email: "admin@gmail.com",
    password: "12345678",
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
