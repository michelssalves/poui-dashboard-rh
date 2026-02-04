import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { PoBreadcrumbItem, PoBreadcrumbModule, PoMenuItem } from '@po-ui/ng-components';

import { AppComponentService } from './app.component.service';

import { ProAppConfigService } from '@totvs/protheus-lib-core';

import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  PoMenuModule,
  PoPageModule,
  PoToolbarModule
} from '@po-ui/ng-components';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    PoToolbarModule,
    PoMenuModule,
    PoPageModule, PoBreadcrumbModule,
    RouterOutlet,

  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [AppComponentService]
})
export class AppComponent {

  breadcrumbItems: PoBreadcrumbItem[] = [];

  menuItemSelected: string = '';

  menus: Array<PoMenuItem> = [

    {
      label: 'Gestão', action: this.printMenuAction.bind(this), icon: 'an an-users-four', shortLabel: 'Gestão',
      subItems: [
        { label: '📊 Dashboard', action: this.dashboardClick.bind(this) },
      ]
    },
    {
      label: 'Sair',
      icon: 'an an-door-open',
      shortLabel: 'Sair',
      action: this.closeApp.bind(this)
    }

  ];

  constructor(
    public AppComponentService: AppComponentService,
    private proAppConfigService: ProAppConfigService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.atualizaTituloDinamico()
    this.menuItemSelected = 'Dashboard'

    if (this.router.url === '/' || this.router.url === '') {
      this.router.navigate(['/dashboard-rh']);
    }

  }

  printMenuAction(menu: PoMenuItem) {
    AppComponentService
    this.menuItemSelected = menu.label;
    console.log('asa' + this.menuItemSelected)
  }

  private atualizaTituloDinamico() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      let route = this.activatedRoute.firstChild;

      while (route?.firstChild) {
        route = route.firstChild;
      }

      const breadcrumb = route?.snapshot.data?.['breadcrumb'] || '';

      console.log('Breadcrumb atualizado:', breadcrumb);

      this.breadcrumbItems = [
        { label: this.menuItemSelected },
        { label: breadcrumb }
      ];
    });
  }

  private dashboardClick() {
    this.router.navigate(['/', '/dashboard-rh']);
  }

  private closeApp() {
    if (this.proAppConfigService.insideProtheus()) {
      this.proAppConfigService.callAppClose();
    } else {
      alert('O App não está sendo executado dentro do Protheus.');
    }
  }
}
