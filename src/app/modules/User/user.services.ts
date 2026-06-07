import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { IUser, IUserFilterRequest } from './user.interface';
import * as bcrypt from 'bcrypt';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { Prisma, User } from '@prisma/client';
import { userSearchAbleFields } from './user.constant';
import config from '../../../config';
import httpStatus from 'http-status';

const userSelectFields = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  profileImage: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const createUserIntoDb = async (payload: User) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { username: payload.username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === payload.email) {
      throw new ApiError(
        400,
        `User with this email ${payload.email} already exists`
      );
    }
    if (existingUser.username === payload.username) {
      throw new ApiError(
        400,
        `User with this username ${payload.username} already exists`
      );
    }
  }

  const hashedPassword: string = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds)
  );

  const result = await prisma.user.create({
    data: { ...payload, password: hashedPassword },
    select: userSelectFields,
  });

  return result;
};

const getUsersFromDb = async (
  params: IUserFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as Record<string, unknown>)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: 'desc',
          },
    select: userSelectFields,
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  if (!result || result.length === 0) {
    throw new ApiError(404, 'No active users found');
  }

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const updateProfile = async (user: IUser, payload: Partial<User>) => {
  const userInfo = await prisma.user.findUnique({
    where: {
      email: user.email,
      id: user.id,
    },
  });

  if (!userInfo) {
    throw new ApiError(404, 'User not found');
  }

  const result = await prisma.user.update({
    where: {
      email: userInfo.email,
    },
    data: {
      firstName: payload.firstName ?? userInfo.firstName,
      lastName: payload.lastName ?? userInfo.lastName,
      username: payload.username ?? userInfo.username,
      email: payload.email ?? userInfo.email,
      profileImage: payload.profileImage ?? userInfo.profileImage,
      phone: payload.phone ?? userInfo.phone,
    },
    select: userSelectFields,
  });

  if (!result) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update user profile'
    );
  }

  return result;
};

const updateUserIntoDb = async (payload: Partial<IUser>, id: string) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
    },
  });

  if (!userInfo) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found with id: ' + id);
  }

  const result = await prisma.user.update({
    where: {
      id: userInfo.id,
    },
    data: payload,
    select: userSelectFields,
  });

  if (!result) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update user profile'
    );
  }

  return result;
};

export const userService = {
  createUserIntoDb,
  getUsersFromDb,
  updateProfile,
  updateUserIntoDb,
};
