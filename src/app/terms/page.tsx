'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">出店応募規約</h1>

        <div className="prose prose-sm space-y-4 text-gray-700">
          <section>
            <h2 className="text-lg font-semibold mb-2">第1条（適用）</h2>
            <p>
              本規約は、本サービスを通じて出店を応募する際の条件を定めるものです。
              応募者は本規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">第2条（応募資格）</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>事業活動を適法に行える個人または法人であること</li>
              <li>反社会的勢力でないこと、またそれらと関係がないこと</li>
              <li>過去に本イベントで重大な問題を起こしていないこと</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">第3条（選考）</h2>
            <p>
              選考は主催者が総合的に判断し、結果の理由についての開示は致しません。
              選考結果は応募者にLINEメッセージにて通知します。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">第4条（出店料）</h2>
            <p>
              出店料は合格通知後に別途ご案内します。
              期日までにお支払いいただけない場合、出店を取り消す場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">第5条（禁止事項）</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>虚偽の情報による応募</li>
              <li>他の出店者や来場者に迷惑をかける行為</li>
              <li>法令に違反する商品・サービスの提供</li>
              <li>会場の指示に従わない行為</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">第6条（個人情報）</h2>
            <p>
              ご提供いただいた個人情報は、選考・連絡・イベント運営の目的のみに使用し、
              適切に管理します。第三者への提供は行いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">第7条（免責）</h2>
            <p>
              天災地変その他不可抗力によりイベントが中止または延期となった場合、
              主催者は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">第8条（規約の変更）</h2>
            <p>
              主催者は必要に応じて本規約を変更できるものとし、
              変更後の規約は通知した時点で効力を生じます。
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}
