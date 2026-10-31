#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
output="$script_dir/../Nhom12-proj4.zip"

rm -f -- "$output"
zip -j "$output" \
  "$script_dir/contracts/exchange.sol" \
  "$script_dir/contracts/token.sol" \
  "$script_dir/web_app/exchange.js" \
  "$script_dir/DesignDoc.txt" \
  "$script_dir/Nhom12-ThongTinNhom.txt"

printf 'Created %s\n' "$output"
