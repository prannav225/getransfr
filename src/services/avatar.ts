import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';

export function generateAvatar(name: string): string {
  const avatar = createAvatar(botttsNeutral, {
    seed: name,
    size: 128,
  });
  return avatar.toDataUri();
}