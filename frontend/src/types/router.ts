import type { RouteObject } from 'react-router-dom';

export type AppRoute = RouteObject & {
  children?: AppRoute[];
  index?: boolean;
  path?: string;
};

export type RouteConfig = {
  path: string;
  element: React.ReactNode;
  children?: RouteConfig[];
  index?: boolean;
};
