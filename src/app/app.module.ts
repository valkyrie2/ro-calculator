import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ErrorHandler } from '@angular/core';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';
import { RoService } from './api-services/ro.service';
import { PrettyJsonPipe } from './layout/prettier-json.pipe';
import { ApiServiceModule } from './api-services';
import { SummaryService } from './api-services/summary.service';
import { AppLogErrorHandler } from './api-services/app-log-error-handler';

const customComponent = [PrettyJsonPipe];

@NgModule({
  declarations: [AppComponent],
  imports: [AppRoutingModule, AppLayoutModule, ApiServiceModule],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: ErrorHandler, useClass: AppLogErrorHandler },
    RoService,
    SummaryService,
    ...customComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
