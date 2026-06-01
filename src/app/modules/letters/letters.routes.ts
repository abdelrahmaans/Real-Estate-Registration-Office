import { Routes } from '@angular/router';

export const lettersRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/letters-list/letters-list.component').then(m => m.LettersListComponent),
    },
    {
        path: 'new',
        loadComponent: () =>
            import('./pages/letters-form/letters-form.component').then(m => m.LettersFormComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./pages/letters-form/letters-form.component').then(m => m.LettersFormComponent),
    },
];
