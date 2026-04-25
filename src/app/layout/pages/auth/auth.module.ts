import { NgModule } from '@angular/core';
import { AuthFormModule } from './auth-form.module';
import { AuthRoutingModule } from './auth-routing.module';

@NgModule({
  imports: [AuthFormModule, AuthRoutingModule],
  exports: [AuthRoutingModule],
})
export class AuthModule {}
