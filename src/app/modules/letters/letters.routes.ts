import { Routes } from '@angular/router';
import { LettersListComponent } from './pages/letters-list/letters-list.component';
import { LettersFormComponent } from './pages/letters-form/letters-form.component';

export const lettersRoutes: Routes = [
    { path: '', component: LettersListComponent },
    { path: 'new', component: LettersFormComponent },
    { path: ':id', component: LettersFormComponent },
];
