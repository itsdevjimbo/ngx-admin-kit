// THROWAWAY: application-owned sample content for the responsive shell review.
import { Component, computed, inject, input } from '@angular/core';
import { ROUTER_OUTLET_DATA, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="page-heading">
      <div>
        <h1>{{ title() }}</h1>
        <p>Manage the people in your workspace.</p>
      </div>
      <a mat-stroked-button routerLink="/users/create" queryParamsHandling="preserve"
        >Invite user</a
      >
    </div>
    <dl class="metrics" aria-label="Workspace metrics">
      <div>
        <dt>Total users</dt>
        <dd>248</dd>
      </div>
      <div>
        <dt>Active this month</dt>
        <dd>192</dd>
      </div>
      <div>
        <dt>Pending invitations</dt>
        <dd>12</dd>
      </div>
    </dl>
    <div
      class="table-scroll"
      tabindex="0"
      role="region"
      aria-label="Workspace members, scroll for more columns"
    >
      <table aria-label="Workspace members">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          @for (row of visibleRows(); track row.id) {
            <tr>
              <td>{{ row.name }}</td>
              <td>{{ row.email }}</td>
              <td><span class="status">Active</span></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .page-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0 0 6px;
      font: var(--mat-sys-headline-small);
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
    .page-heading a {
      flex-shrink: 0;
      border-radius: 8px;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
      padding-bottom: 20px;
      margin: 0 0 24px;
      border-bottom: 1px solid color-mix(in srgb, var(--mat-sys-outline-variant) 65%, transparent);
    }
    dt {
      color: var(--mat-sys-on-surface-variant);
      font-size: 12px;
      line-height: 18px;
    }
    dd {
      margin: 6px 0 0;
      font: var(--mat-sys-headline-small);
      font-weight: 500;
    }
    .table-scroll {
      overflow: auto;
      border-radius: 8px;
      outline-offset: 2px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      text-align: left;
      white-space: nowrap;
    }
    th {
      font-size: 12px;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-container-low);
    }
    th,
    td {
      padding: 12px 16px;
      border-bottom: 1px solid color-mix(in srgb, var(--mat-sys-outline-variant) 55%, transparent);
    }
    td {
      font-size: 14px;
    }
    td:first-child {
      font-weight: 500;
    }
    .status {
      color: var(--mat-sys-on-surface-variant);
      font-size: 12px;
    }
    a:focus-visible,
    .table-scroll:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
    @media (max-width: 959.98px) {
      .page-heading {
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 12px;
      }
      .metrics {
        gap: 12px;
        padding-bottom: 16px;
        margin-bottom: 20px;
      }
      dd {
        font-size: 24px;
      }
      th,
      td {
        padding: 12px;
      }
    }
  `,
})
export class ShellPagePrototype {
  readonly page = input('users');
  readonly title = computed(() => {
    switch (this.page()) {
      case 'overview':
        return 'Overview';
      case 'billing':
        return 'Billing';
      case 'preferences':
        return 'Workspace preferences';
      default:
        return 'Users';
    }
  });
  private readonly contentMode = inject(ROUTER_OUTLET_DATA);
  private readonly rows = Array.from({ length: 35 }, (_, index) => ({
    id: index + 1,
    name: `Example user ${index + 1}`,
    email: `person${index + 1}@example.com`,
  }));
  readonly visibleRows = computed(() =>
    this.contentMode() === 'long' ? this.rows : this.rows.slice(0, 7),
  );
}
