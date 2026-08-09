export type * from './auth';
export type * from './category';
export type * from './menu';
export type * from './navigation';
export type * from './order';
export type * from './package';
export type * from './ui';

import type { Auth } from './auth';

export type SharedData = {
    name?: string;
    auth: Auth;
    sidebarOpen?: boolean;
    [key: string]: unknown;
};
