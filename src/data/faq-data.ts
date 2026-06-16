export interface FaqItem {
  id: string;
  question: string;
  /** 回答本文。1要素 = 1段落として表示する */
  answer: string[];
  /** 任意。指定があれば回答の下に YouTube 動画を埋め込む */
  youtubeId?: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'cancel',
    question: 'キャンセルするには？',
    answer: [
      '「設定」→「アカウント」→「プランを解約する」→「サブスクリプションを解約する」からキャンセルを行って下さい。',
      'キャンセル料金は一切ありません。キャンセル手続きはいつでも可能です。',
    ],
  },
];
