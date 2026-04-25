import { NgModule } from '@angular/core';
import { ItemImagePipe } from './item-image.pipe';

@NgModule({
  declarations: [ItemImagePipe],
  exports: [ItemImagePipe],
})
export class SharedPipesModule {}
