import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableComponent } from './table.component';
import { TableColumn } from '@shared/models/table.model';
import { describe, it, expect, beforeEach } from 'vitest';

interface TestItem {
  id: number;
  name: string;
  role: string;
}

describe('TableComponent', () => {
  let component: TableComponent<TestItem>;
  let fixture: ComponentFixture<TableComponent<TestItem>>;

  const mockColumns: TableColumn<TestItem>[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'role', label: 'Rôle' },
  ];

  const mockData: TestItem[] = [
    { id: 1, name: 'Jean', role: 'Curé' },
    { id: 2, name: 'Paul', role: 'Vicaire' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent<TestItem>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.detectChanges();
  });

  it('should create the table component', () => {
    expect(component).toBeTruthy();
  });

  it('should render table headers based on columns input', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();

    const thElements = fixture.nativeElement.querySelectorAll('th');
    expect(thElements.length).toBe(3);
    expect(thElements[0].textContent).toContain('ID');
    expect(thElements[1].textContent).toContain('Nom');
  });

  it('should render data rows correctly', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();

    const trElements = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(trElements.length).toBe(2);
    expect(trElements[0].textContent).toContain('Jean');
  });

  it('should show empty state when data is empty and not loading', () => {
    fixture.componentRef.setInput('columns', mockColumns);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.empty-table-cell');
    expect(empty).toBeTruthy();
  });
});
