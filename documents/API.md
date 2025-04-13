# API 仕様書

## 認証関連

### POST /api/auth/signup

- 説明: ユーザー登録
- リクエストボディ:

```json
{
	"email": "string",
	"password": "string"
}
```

- レスポンス:

```json
{
	"user": {
		"id": "uuid",
		"email": "string"
	},
	"session": {
		"access_token": "string",
		"refresh_token": "string"
	}
}
```

### POST /api/auth/login

- 説明: ユーザーログイン
- リクエストボディ:

```json
{
	"email": "string",
	"password": "string"
}
```

- レスポンス: 上記と同じ

### POST /api/auth/logout

- 説明: ログアウト
- ヘッダー: Authorization: Bearer {token}

### POST /api/auth/google

- 説明: Google 認証によるログイン
- リクエストボディ:

```json
{
	"id_token": "string"
}
```

- レスポンス:

```json
{
	"user": {
		"id": "uuid",
		"email": "string",
		"provider": "google"
	},
	"session": {
		"access_token": "string",
		"refresh_token": "string"
	}
}
```

## プロファイル関連

### GET /api/profiles/{id}

- 説明: プロファイル取得
- レスポンス:

```json
{
	"id": "uuid",
	"nickname": "string",
	"avatar_url": "string",
	"created_at": "timestamp"
}
```

### PUT /api/profiles/{id}

- 説明: プロファイル更新
- リクエストボディ:

```json
{
	"nickname": "string",
	"avatar_url": "string"
}
```

## 投稿関連

### GET /api/posts

- 説明: 投稿一覧取得
- クエリパラメータ:
  - category_id: uuid (オプション)
  - page: number
  - limit: number
- レスポンス:

```json
{
	"posts": [
		{
			"id": "uuid",
			"title": "string",
			"video_url": "string",
			"is_youtube": "boolean",
			"is_private": "boolean",
			"likes": "number",
			"comments": "array",
			"created_at": "timestamp",
			"user": {
				"id": "uuid",
				"nickname": "string",
				"avatar_url": "string"
			}
		}
	],
	"total": "number"
}
```

### POST /api/posts

- 説明: 新規投稿作成
- リクエストボディ:

```json
{
	"title": "string",
	"video_url": "string",
	"is_youtube": "boolean",
	"is_private": "boolean",
	"category_id": "uuid"
}
```

### PUT /api/posts/{id}

- 説明: 投稿更新
- リクエストボディ:

```json
{
	"title": "string",
	"is_private": "boolean",
	"category_id": "uuid"
}
```

### DELETE /api/posts/{id}

- 説明: 投稿削除

## コメント関連

### POST /api/posts/{postId}/comments

- 説明: コメント追加
- リクエストボディ:

```json
{
	"content": "string"
}
```

### DELETE /api/posts/{postId}/comments/{commentId}

- 説明: コメント削除

## いいね関連

### POST /api/posts/{postId}/likes

- 説明: いいね追加

### DELETE /api/posts/{postId}/likes

- 説明: いいね削除

## カテゴリー関連

### GET /api/categories

- 説明: カテゴリー一覧取得
- レスポンス:

```json
{
	"categories": [
		{
			"id": "uuid",
			"name": "string",
			"created_at": "timestamp"
		}
	]
}
```

### POST /api/categories

- 説明: カテゴリー作成
- リクエストボディ:

```json
{
	"name": "string"
}
```

### PUT /api/categories/{id}

- 説明: カテゴリー更新
- リクエストボディ:

```json
{
	"name": "string"
}
```

### DELETE /api/categories/{id}

- 説明: カテゴリー削除

## エラーレスポンス

```json
{
	"error": {
		"code": "string",
		"message": "string"
	}
}
```
