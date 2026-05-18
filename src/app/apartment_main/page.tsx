'use client'

import SiteHeader from '@/components/SiteHeader'
// import { usePaywall } from '@/components/PaywallProvider'  // 課金制限を追加する時に有効化

export default function ApartmentMainPage() {
  // const { requirePaid } = usePaywall()  // 課金ガードを追加する時に有効化

  return (
    <>
      <SiteHeader mode="sub" title="集合住宅幹線設計" />
      <main className="main-content">

        <div className="card">
          <p className="card-title">集合住宅幹線設計</p>
          <p className="msg-placeholder">このページは現在準備中です。</p>
        </div>

        <div className="disclaimer">
          <strong>⚠️ 免責事項</strong>
          本ツールの計算結果は参考値です。実務では最新の規格・基準を必ずご確認ください。
        </div>

      </main>
    </>
  )
}
