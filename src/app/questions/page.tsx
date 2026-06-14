import SiteHeader from '@/components/SiteHeader';
import { FAQ_ITEMS } from '@/data/faq-data';
import styles from './page.module.css';

export default function QuestionsPage() {
  return (
    <div className={styles.page}>
      <SiteHeader mode="sub" title="よくある質問" />

      <main className={styles.main}>
        <div className={styles.list}>
          {FAQ_ITEMS.map((item) => (
            <article key={item.id} className={styles.card}>
              {/* 質問 */}
              <div className={styles.qRow}>
                <span className={styles.qMark}>Q</span>
                <h2 className={styles.question}>{item.question}</h2>
              </div>

              <hr className={styles.divider} />

              {/* 回答 */}
              <div className={styles.aRow}>
                <span className={styles.aMark}>A</span>
                <div className={styles.answer}>
                  {item.answer.map((para, i) => (
                    <p key={i} className={styles.paragraph}>{para}</p>
                  ))}

                  {item.youtubeId && (
                    <div className={styles.videoWrap}>
                      <iframe
                        src={`https://www.youtube.com/embed/${item.youtubeId}`}
                        title={item.question}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
