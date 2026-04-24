import { TestBed } from '@angular/core/testing';
import { LoggerService, logger } from './logger.service';
import { environment } from 'src/environments/environment';

describe('LoggerService', () => {
  let service: LoggerService;
  let originalProd: boolean;

  beforeEach(() => {
    originalProd = environment.production;
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    environment.production = originalProd;
  });

  it('forwards log() in dev mode', () => {
    environment.production = false;
    service = TestBed.inject(LoggerService);
    const spy = spyOn(console, 'log');
    service.log('hello');
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('always forwards error() (even in prod) so we can diagnose', () => {
    const spy = spyOn(console, 'error');
    service = TestBed.inject(LoggerService);
    service.error('boom');
    expect(spy).toHaveBeenCalledWith('boom');
  });

  describe('logger singleton (non-DI)', () => {
    it('forwards error() unconditionally', () => {
      const spy = spyOn(console, 'error');
      logger.error('x');
      expect(spy).toHaveBeenCalledWith('x');
    });

    it('no-ops log() when environment.production is true', () => {
      environment.production = true;
      const spy = spyOn(console, 'log');
      logger.log('should not appear');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
