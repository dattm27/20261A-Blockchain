#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
output="$script_dir/../Nhom12-proj4.zip"
staging=$(mktemp -d "${TMPDIR:-/tmp}/proj4-submit.XXXXXX")

cleanup() {
  rm -rf -- "$staging"
}
trap cleanup EXIT HUP INT TERM

# Gradescope expects DesignDoc.txt. Keep the English source in the repository,
# but submit only the Vietnamese version under the required filename.
cp "$script_dir/DesignDoc-vi.txt" "$staging/DesignDoc.txt"

rm -f -- "$output"
zip -j "$output" \
  "$script_dir/contracts/exchange.sol" \
  "$script_dir/contracts/token.sol" \
  "$script_dir/web_app/exchange.js" \
  "$staging/DesignDoc.txt" \
  "$script_dir/Nhom12-ThongTinNhom.txt"

printf 'Created %s\n' "$output"
