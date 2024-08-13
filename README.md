
# 要件定義（簡易的）
### 一言サービスコンセプト
**シンプルでリラックス感のある動画共有体験**

### 課題の解決
   - メモ感覚で、YouTube動画やその他の動画をアプリに追加したり削除することができる。->> 動画管理の煩雑さを軽 減する。

   - 親戚間や友人同士や習い事の教室などの小規模グループ内で、動画を見ながらコメントを互いにやり取りすることができる。->> 遠隔地間であってもスムーズにコミュニケーションを図れるようにする。また、一人暮らしの高齢者の安否確認ツールとしての活用。

### 機能要件
   1. お気に入り動画をストレージにアップロードして表示する機能。
      - ファイル容量制限：50MBに設定
      - 50MBを超えるファイルについては、YouTubeにpublicまたはprivateにてアップロードした後、次項の方法（2. YouTube動画をURLを介して表示する機能。）を使って表示することが可能。
      - 50MB以下のファイルであっても上記の方法でアップロード可能。
      - 再生速度変更機能。
      - ファイルダウンロード機能。

   2. YouTube動画をURLを介して表示する機能。
     - 表示後、ワンクリックでYouTubeへ遷移可。

   3. いいねボタンを押せる機能やコメントを書き込める機能。

   4. カテゴリーを追加・更新・削除する機能。

   5. ユーザーを登録・更新 (管理者権限のみ)・削除する機能。

   6. Google認証機能

# 使用言語・ツール
**フロントエンド**
- Next.js(React)
- TypeScript
- Tailwind CSS

**バックエンド**
- supabase

**データベース**
- PostgreSQL

**バージョン管理**
- Github

**デプロイ**
- Vercel