import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IResource } from '../interfaces/resource.interface';

@Component({
  selector: 'app-resource-list-page',
  imports: [RouterLink],
  template: `
    <h2>{{ resource().title }}</h2>
    <a [routerLink]="['create']" [relativeTo]="resourceRoute">Create {{ resource().title }}</a>
  `,
})
export class ResourceListPage {
  protected readonly resourceRoute = inject(ActivatedRoute).parent;
  readonly resource = input.required<IResource>();
}
