import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { BugReportComment, BugReportService } from './bug-report.service';
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

describe('BugReportService comments', () => {
  function setup(
    handlers: {
      listResult?: { data: unknown[] | null; error: { message: string } | null };
      insertResult?: { error: { message: string } | null };
      rpcResult?: { error: { message: string } | null };
    } = {},
  ) {
    const listResult = handlers.listResult ?? { data: [], error: null };
    const insertResult = handlers.insertResult ?? { error: null };
    const rpcResult = handlers.rpcResult ?? { error: null };

    const insert = jasmine.createSpy('insert').and.returnValue(Promise.resolve(insertResult));
    // Chainable + awaitable query stub: select/eq/order return the builder,
    // awaiting it resolves to listResult.
    const query: any = {
      insert,
      then: (resolve: (value: unknown) => void) => Promise.resolve(listResult).then(resolve),
    };
    query.select = jasmine.createSpy('select').and.returnValue(query);
    query.eq = jasmine.createSpy('eq').and.returnValue(query);
    query.order = jasmine.createSpy('order').and.returnValue(query);

    const from = jasmine.createSpy('from').and.returnValue(query);
    const rpc = jasmine.createSpy('rpc').and.returnValue(Promise.resolve(rpcResult));
    const clientStub = { client: { from, rpc } } as unknown as SupabaseClientService;
    const authStub = { getProfile: () => ({ id: 'admin-1', name: 'Admin', email: 'a@a.com' }) } as unknown as AuthService;

    TestBed.configureTestingModule({
      providers: [
        BugReportService,
        { provide: SupabaseClientService, useValue: clientStub },
        { provide: AuthService, useValue: authStub },
      ],
    });
    return { service: TestBed.inject(BugReportService), from, insert, rpc, query };
  }

  it('listComments queries the comments table for the report, oldest first', async () => {
    const rows = [{ id: 1, report_id: 7, author_role: 'admin', author_id: null, body: 'hi', created_at: '2026-07-08T00:00:00Z' }];
    const { service, from, query } = setup({ listResult: { data: rows, error: null } });

    const result = await service.listComments(7);

    expect(from).toHaveBeenCalledWith('bug_report_comments');
    expect(query.eq).toHaveBeenCalledWith('report_id', 7);
    expect(result).toEqual(rows as BugReportComment[]);
  });

  it('addAdminComment inserts an admin comment with trimmed body', async () => {
    const { service, from, insert } = setup();

    await service.addAdminComment(7, '  fixed in next patch  ');

    expect(from).toHaveBeenCalledWith('bug_report_comments');
    expect(insert.calls.mostRecent().args[0]).toEqual({
      report_id: 7,
      author_role: 'admin',
      author_id: 'admin-1',
      body: 'fixed in next patch',
    });
  });

  it('addAdminComment rejects an empty body without inserting', async () => {
    const { service, insert } = setup();
    await expectAsync(service.addAdminComment(7, '   ')).toBeRejectedWithError('Comment is required.');
    expect(insert).not.toHaveBeenCalled();
  });

  it('addPublicComment calls the pingpong RPC', async () => {
    const { service, rpc } = setup();
    await service.addPublicComment(7, 'thanks');
    expect(rpc).toHaveBeenCalledWith('add_bug_report_comment', { report_id: 7, body: 'thanks' });
  });

  it('addPublicComment surfaces the RPC error message', async () => {
    const { service } = setup({ rpcResult: { error: { message: 'wait for admin' } } });
    await expectAsync(service.addPublicComment(7, 'x')).toBeRejectedWithError('wait for admin');
  });
});
