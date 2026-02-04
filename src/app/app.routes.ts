import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard-rh' },

    {
        path: 'dashboard-rh',
        loadComponent: () =>
            import('./GPE_RH/dashboard/dashboard.component')
                .then(m => m.DashboardComponent)
    }
];
