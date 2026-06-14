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
    id: 'about',
    question: 'ELE-CALとは？',
    answer: [
      '内線規程 第14版　JEAC8001-2022を参考に、許容電流量・電圧降下・配管選定・ブレーカー選定を条件入力だけで必要な計算結果をすばやく算出するツールです。',
    ],
  },
  {
    id: 'price',
    question: '利用料金は？',
    answer: [
      '月額550円（税込）ですべての機能をお使い頂けます。',
      'スマホ、タブレット、パソコンなどからご利用可能です。',
    ],
  },
  {
    id: 'cancel',
    question: 'キャンセルするには？',
    answer: [
      '「設定」→「アカウント」→「プランを解約する」から、Stripe画面で解約手続きを完了してください。',
      'キャンセル料金はありませんが、契約期間途中の解約による日割り返金はありません。',
    ],
  },
];
