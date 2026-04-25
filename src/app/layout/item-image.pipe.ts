import { Pipe, PipeTransform } from '@angular/core';
import { ITEM_IMAGE_MAP } from '../constants/item-image-map';

@Pipe({
  name: 'itemImage',
  pure: true,
})
export class ItemImagePipe implements PipeTransform {
  transform(itemId: number | string | null | undefined): string | number {
    if (itemId == null) return itemId as any;
    const key = String(itemId);
    return ITEM_IMAGE_MAP[key] ?? itemId;
  }
}
