import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAddItemComponent } from './add-item/admin-add-item.component';
import { AdminAddMonsterComponent } from './add-monster/admin-add-monster.component';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';

@NgModule({
  declarations: [AdminComponent, AdminAddItemComponent, AdminAddMonsterComponent],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule,
    TabViewModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
})
export class AdminModule {}
