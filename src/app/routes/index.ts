import express from 'express';
import { userRoutes } from '../modules/User/user.route';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { sessionRoutes } from '../modules/Session/session.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/sessions',
    route: sessionRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
