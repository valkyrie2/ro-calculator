import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAddItemComponent } from './add-item/admin-add-item.component';
import { AdminAddMonsterComponent } from './add-monster/admin-add-monster.component';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { AdminBugReportsComponent } from './bug-reports/admin-bug-reports.component';

@NgModule({
  declarations: [AdminComponent, AdminAddItemComponent, AdminAddMonsterComponent, AdminBugReportsComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    AdminRoutingModule,
    TabViewModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    TableModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class AdminModule {}
