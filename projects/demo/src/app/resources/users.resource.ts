import type { IResource } from 'ngx-admin-kit';

export const usersResource: IResource = {
  id: 'users',
  title: 'Users',
  route: 'users',
  apiEndpoint: '/api/users',
  form: () => [
    { name: 'Name', key: 'name', type: 'text' },
    { name: 'Email', key: 'email', type: 'email' },
  ],
};
