import { Pipe, PipeTransform } from '@angular/core';
import { ITEM_IMAGE_MAP } from '../constants/item-image-map';

@Pipe({
  standalone: false,
  name: 'itemImage',
  pure: true,
})
export class ItemImagePipe implements PipeTransform {
  transform(itemId: number | string | null | undefined): string | number {
    if (itemId == null) return itemId as any;
    // Expired-sim items use negative IDs — resolve image using the original positive ID
    const absId = typeof itemId === 'number' ? Math.abs(itemId) : Math.abs(Number(itemId)) || itemId;
    const key = String(absId);
    return ITEM_IMAGE_MAP[key] ?? absId;
  }
}
