#!/bin/bash

# 出力ファイル名
output_file="file_contents.md"

# 出力ファイルを初期化
echo "# プロジェクトのソース一覧" > "$output_file"

# バッククォートをエスケープした文字列を変数に格納
code_block='```'

# ファイルを再帰的に検索し、内容を出力ファイルに追記
find . -type f \
    ! -path "./dist/*" \
    ! -path "./node_modules/*" \
    ! -path "./.git/*" \
    ! -name "pnpm-lock.yaml" \
    ! -name "$output_file" \
    -print0 | while IFS= read -r -d '' file; do
    echo -e "\n## $file\n" >> "$output_file"
    # ファイルの拡張子を取得
    extension="${file##*.}"
    # 拡張子が存在する場合のみ、コードブロックに追加
    if [ "$extension" != "$file" ]; then
        echo "${code_block}${extension}" >> "$output_file"
    else
        echo "${code_block}" >> "$output_file"
    fi
    cat "$file" >> "$output_file"
    echo -e "\n${code_block}\n" >> "$output_file"
done

echo "ファイル内容を $output_file に書き出しました。"