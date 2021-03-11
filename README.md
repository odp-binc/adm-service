# 行政サービスかんたん案内

## 環境
[node.js](https://nodejs.org/ja/)

## 使い方
1. データを取得する（新宿区の例）
```bash
$ sh fetch.sh
```

2. サービスのパスを設定する（.env.json）
PORT:ポート番号、ROOT:ルートパス、STATIC_DIR:静的ファイル格納場所、CREDIT:クレジット、TITLE:タイトル、TITLE_BODY:タイトル（ページ内、HTML）、DESCRIPTION:説明文章(HTML)
```
{
    "PORT": 8003,
    "ROOT": "/govmenu/",
    "STATIC_DIR": "static",
    "CREDIT": "〇〇役所",
    "TITLE": "〇〇行政サービスかんたん案内",
    "TITLE_BODY": "〇〇行政サービスかんたん案内",
    "DESCRIPTION": "〇〇の行政サービスやその問い合わせ先・ホームページを検索やカテゴリーから簡単に探せます。"
}
```

3. サービスを起動する
```bash
$ node admservice.mjs
```
