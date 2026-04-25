import { NgModule } from '@angular/core';
import { PresetSummaryRoutingModule } from './preset-summary-routing.module';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { PresetSummaryComponent } from './preset-summary.component';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { SharedPipesModule } from '../../../layout/shared-pipes.module';

@NgModule({
  declarations: [PresetSummaryComponent],
  imports: [PresetSummaryRoutingModule, ListboxModule, ButtonModule, CommonModule, FormsModule, CheckboxModule, SharedPipesModule],
  exports: [],
})
export class PresetSummaryModule {}
