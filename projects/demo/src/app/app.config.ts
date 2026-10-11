import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideResource } from 'ngx-admin-kit';
import { routes } from './app.routes';
import { usersResource } from './resources/users.resource';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideResource(usersResource),
  ],
};
