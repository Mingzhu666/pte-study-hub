import type { PTEModule } from '@/types/pte';

export interface StrategyItem {
  id: string;
  text: string;
}

export function fnv1a32(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const MAX_ITEMS = 8;

export function buildStrategyList(module: PTEModule, lang: 'en' | 'zh'): StrategyItem[] {
  const enSource = [...(module.content.strategy ?? []), ...(module.content.tips ?? [])];
  const zhSource = module.contentZh
    ? [...(module.contentZh.strategy ?? []), ...(module.contentZh.tips ?? [])]
    : [];

  const seen = new Set<string>();
  const items: StrategyItem[] = [];

  for (let i = 0; i < enSource.length && items.length < MAX_ITEMS; i++) {
    const enText = enSource[i];
    const key = enText.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const zhText = zhSource[i];
    const display = lang === 'zh' && zhText ? zhText : enText;

    items.push({
      id: `${module.id}:${fnv1a32(key)}`,
      text: display,
    });
  }

  return items;
}
