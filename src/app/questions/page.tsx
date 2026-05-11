'use client';

import { useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { FAQ_CATEGORIES, FAQ_ITEMS, FaqCategory } from '@/data/faq-data';
import styles from './page.module.css';

export default function QuestionsPage() {
  const [active, setActive] = useState<FaqCategory | 'all'>('all');

  const filtered = active === 'all'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((item) => item.category === active);

  return (
    <div className={styles.page}>
      <SiteHeader mode="sub" title="よくある質問" />

      <main className={styles.main}>
        {/* カテゴリフィルター */}
        <div className={styles.filterBar}>
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.chip} ${styles[`chip_${cat.id}`]} ${active === cat.id ? styles.chipActive : ''}`}
              onClick={() => setActive(cat.id as FaqCategory | 'all')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 動画グリッド */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>該当するFAQがありません</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((item) => (
              <div key={item.id} className={styles.card}>
                {item.youtubeId ? (
                  <div className={styles.videoWrap}>
                    <iframe
                      src={`https://www.youtube.com/embed/${item.youtubeId}`}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className={styles.videoPlaceholder}>
                    <span>動画準備中</span>
                  </div>
                )}
                <div className={styles.cardBody}>
                  <p className={styles.cardTitle}>{item.title}</p>
                  {item.description && (
                    <p className={styles.cardDesc}>{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
