import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { BugReportService } from './bug-report.service';
import { SupabaseClientService } from './supabase-client.service';

describe('BugReportService.submit', () => {
  function setup(insertResult: { error: unknown }) {
    // `insert()` resolves to a plain result with NO `.select()` method. If submit()
    // chained `.select()` (the read-back that fails the SELECT RLS policy for
    // anonymous reporters), this stub would throw "select is not a function".
    const insert = jasmine.createSpy('insert').and.returnValue(Promise.resolve(insertResult));
    const from = jasmine.createSpy('from').and.returnValue({ insert });
    const clientStub = { client: { from } } as unknown as SupabaseClientService;
    const authStub = { getProfile: () => null } as unknown as AuthService;

    TestBed.configureTestingModule({
      providers: [
        BugReportService,
        { provide: SupabaseClientService, useValue: clientStub },
        { provide: AuthService, useValue: authStub },
      ],
    });
    return { service: TestBed.inject(BugReportService), from, insert };
  }

  it('inserts without reading the row back (anon-safe: avoids the SELECT-policy RLS error)', async () => {
    const { service, from, insert } = setup({ error: null });

    await service.submit({ title: 'Something is broken' });

    expect(from).toHaveBeenCalledWith('bug_reports');
    expect(insert).toHaveBeenCalledTimes(1);
    const row = insert.calls.mostRecent().args[0];
    expect(row.title).toBe('Something is broken');
    expect(row.reporter_id).toBeNull(); // anonymous reporter
  });

  it('surfaces a Supabase error', async () => {
    const { service } = setup({ error: { message: 'boom' } });
    await expectAsync(service.submit({ title: 'x' })).toBeRejectedWithError('boom');
  });

  it('requires a title', async () => {
    const { service, insert } = setup({ error: null });
    await expectAsync(service.submit({ title: '   ' })).toBeRejectedWithError('Title is required.');
    expect(insert).not.toHaveBeenCalled();
  });
});
