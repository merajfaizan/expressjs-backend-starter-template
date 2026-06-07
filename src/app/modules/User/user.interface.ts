import { UserRole, UserStatus } from '@prisma/client';

export interface IUser {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  profileImage?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserFilterRequest = {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  username?: string | undefined;
  role?: string | undefined;
  searchTerm?: string | undefined;
};
