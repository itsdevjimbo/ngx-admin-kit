import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IResource } from '../interfaces/resource.interface';

@Component({
  selector: 'app-resource-form-page',
  imports: [RouterLink],
  template: `
    <h2>{{ mode() === 'create' ? 'Create' : 'Edit' }} {{ resource().title }}</h2>
    @if (mode() === 'edit') {
      <p>Record ID: {{ recordId() }}</p>
      <a [routerLink]="['create']" [relativeTo]="resourceRoute">Create {{ resource().title }}</a>
    }
    <p>
      <a [routerLink]="['.']" [relativeTo]="resourceRoute">Back to {{ resource().title }}</a>
    </p>
  `,
})
export class ResourceFormPage {
  protected readonly resourceRoute = inject(ActivatedRoute).parent;
  readonly resource = input.required<IResource>();
  readonly mode = input.required<'create' | 'edit'>();
  readonly recordId = input<string>();
}
