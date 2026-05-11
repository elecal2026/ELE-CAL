export type FaqCategory =
  | 'basic'
  | 'allowable_current'
  | 'voltage_drop'
  | 'pipe_size'
  | 'breaker';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  title: string;
  youtubeId: string;
  description?: string;
}

export const FAQ_CATEGORIES: { id: FaqCategory | 'all'; label: string }[] = [
  { id: 'all',               label: 'すべて' },
  { id: 'basic',             label: '基本的な使い方' },
  { id: 'allowable_current', label: '許容電流表' },
  { id: 'voltage_drop',      label: '電圧降下計算' },
  { id: 'pipe_size',         label: '配管サイズ計算' },
  { id: 'breaker',           label: 'ブレーカー選定' },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'basic-01',
    category: 'basic',
    title: 'ELE-CALの基本的な使い方',
    youtubeId: 'x286YBa4K-E',
  },
  {
    id: 'allowable-01',
    category: 'allowable_current',
    title: '許容電流表の見方・使い方',
    youtubeId: '',
  },
  {
    id: 'voltage-01',
    category: 'voltage_drop',
    title: '電圧降下計算の入力方法',
    youtubeId: '',
  },
  {
    id: 'pipe-01',
    category: 'pipe_size',
    title: '配管サイズ計算の基本操作',
    youtubeId: '',
  },
  {
    id: 'breaker-01',
    category: 'breaker',
    title: 'ブレーカー選定の手順',
    youtubeId: '',
  },
];
