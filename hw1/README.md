# Homework 1 - Lời giải có giải thích

Đề gốc: [Stanford CS251, Assignment #1 (Fall 2023)](https://securitylab.github.io/cs251-fall23/hw/hw1.pdf).

- Nguồn LaTeX để biên dịch bản nộp: [`homework1.tex`](homework1.tex)
- Bản PDF đã biên dịch: [`../output/pdf/Homework1_Nhom12.pdf`](../output/pdf/Homework1_Nhom12.pdf)

Biên dịch bằng XeLaTeX (chạy hai lần để cập nhật mục lục):

```bash
cd hw1
xelatex -jobname=Homework1_Nhom12 -output-directory=../output/pdf homework1.tex
xelatex -jobname=Homework1_Nhom12 -output-directory=../output/pdf homework1.tex
```

Lời giải dưới đây được viết lại độc lập. Hai bài tham khảo do nhóm khác cung
cấp được dùng để đối chiếu Bài 1 và Bài 2; các lập luận, ký hiệu và phần kiểm
tra lỗi đề đã được chuẩn hóa lại.

## Bài 1 - Hàm proof of work không an toàn

Đề cho

\[
H(x,y)=\operatorname{SHA256}(x\oplus y)
\]

và yêu cầu tìm \(y\) sao cho

\[
H(x,y)<\frac{2^{256}}{D}.
\]

### Tiền tính toán trước khi biết `x`

Vì độ khó \(D\) đã cố định, kẻ tấn công chọn các chuỗi \(z\in\{0,1\}^m\)
và thử cho đến khi tìm được \(z^*\) thỏa

\[
\operatorname{SHA256}(z^*)<\frac{2^{256}}{D}.
\]

Nếu coi đầu ra SHA256 phân bố đều trên \([0,2^{256}-1]\), một lần thử thành
công với xác suất xấp xỉ

\[
p=\frac{1}{D}.
\]

Do đó số lần băm kỳ vọng trong giai đoạn chuẩn bị là \(1/p=D\). Toàn bộ công
việc này được thực hiện trước khi thử thách \(x\) xuất hiện.

### Khi `x` được công bố

Kẻ tấn công chỉ cần đặt

\[
y=x\oplus z^*.
\]

Khi đó

\[
\begin{aligned}
H(x,y)
  &=\operatorname{SHA256}(x\oplus y)\\
  &=\operatorname{SHA256}(x\oplus(x\oplus z^*))\\
  &=\operatorname{SHA256}((x\oplus x)\oplus z^*)\\
  &=\operatorname{SHA256}(z^*)\\
  &<\frac{2^{256}}{D}.
\end{aligned}
\]

Chi phí trực tuyến chỉ là một phép XOR trên \(m\) bit, không cần thử lại
SHA256. Hàm này không gắn công việc tính toán với thử thách mới \(x\), nên
không phù hợp làm proof of work.

## Bài 2 - Cây Merkle k-phân

Ký hiệu \(h\) là hàm băm, \(\|\) là phép nối chuỗi và
\(L_i=h(T_i)\).

### a. Cây tam phân với 9 phần tử

Vì \(9=3^2\), cây có hai tầng phía trên các lá:

```text
                         R
                  /      |      \
                N1       N2       N3
              / | \    / | \    / | \
             L1 L2 L3 L4 L5 L6 L7 L8 L9
                       ^
                      T4
```

Alice tính

\[
\begin{aligned}
N_1&=h(L_1\|L_2\|L_3),\\
N_2&=h(L_4\|L_5\|L_6),\\
N_3&=h(L_7\|L_8\|L_9),\\
R&=h(N_1\|N_2\|N_3).
\end{aligned}
\]

Alice công bố \(R\) làm commitment.

Để chứng minh \(T_4\in S\), Alice gửi:

- phần tử \(T_4\) và vị trí \(i=4\);
- bốn giá trị băm \(\pi=(L_5,L_6,N_1,N_3)\).

Bob tính lại

\[
L_4=h(T_4),\qquad
N_2=h(L_4\|L_5\|L_6),\qquad
R'=h(N_1\|N_2\|N_3).
\]

Nếu \(R'=R\), Bob chấp nhận. Chỉ số \(i=4\), hoặc metadata tương đương,
cho Bob biết thứ tự ghép các nút. Tính ràng buộc dựa trên giả thiết \(h\)
chống va chạm.

### b. Độ dài bằng chứng

Độ sâu tối đa của cây là

\[
d=\lceil\log_k n\rceil.
\]

Tại mỗi tầng, verifier cần nhiều nhất \(k-1\) hash anh em. Vì vậy

\[
|\pi|\le (k-1)\lceil\log_k n\rceil
\]

giá trị băm. Nếu tầng cuối không đủ \(k\) con thì bằng chứng thực tế có thể
ngắn hơn; công thức trên là cận trên khi hình dạng cây hoặc quy tắc padding đã
được thống nhất.

Kiểm tra nhanh:

- \(k=2\): \(|\pi|\le\lceil\log_2 n\rceil\), đúng với cây nhị phân;
- \(k=3,n=9\): \(|\pi|=2\cdot2=4\), đúng với câu a.

### c. Nhị phân hay tam phân?

Với \(n\) lớn và bỏ qua phép làm tròn,

\[
|\pi_k|\approx(k-1)\log_k n
=\frac{k-1}{\ln k}\ln n.
\]

Do đó

\[
|\pi_2|\approx\frac{1}{\ln2}\ln n\approx1.443\ln n,
\]

trong khi

\[
|\pi_3|\approx\frac{2}{\ln3}\ln n\approx1.820\ln n.
\]

Chọn cây nhị phân. Bằng chứng tam phân dài hơn khoảng
\(1.820/1.443-1\approx26.2\%\). Tăng \(k\) làm cây thấp hơn, nhưng số hash
anh em phải gửi ở mỗi tầng tăng từ \(1\) lên \(k-1\), và phần tăng này lớn
hơn phần giảm độ sâu.

## Bài 3 - Bitcoin Script và mật khẩu

Đề in `ScriptPubKey` sau:

```text
OP_SHA256
<0xeb271cbcc2340d0b0e6212903e29f22e578ff69b>
OP_EQUAL
```

### Lưu ý: đề Fall 2023 có lỗi độ dài

`OP_SHA256` luôn tạo digest 32 byte, trong khi hằng hex trong đề có 40 ký tự
hex, tức 20 byte. Hai byte-string khác độ dài không thể bằng nhau, nên nếu đọc
đúng nguyên văn thì UTXO này **không thể được tiêu**, kể cả khi biết \(P\).

Ý đồ của bài toán là một hashlock mật khẩu. Có thể sửa theo một trong hai cách:

1. đổi opcode thành `OP_SHA1`, phù hợp với digest 20 byte đã in; hoặc
2. giữ `OP_SHA256` nhưng thay hằng bằng digest SHA256 32 byte của \(P\).

Các câu trả lời dưới đây dùng phiên bản đã sửa đó.

### a. ScriptSig

```text
<P>
```

`ScriptSig` chỉ đẩy chính byte-string mật khẩu lên stack. `ScriptPubKey` băm
nó và so sánh với digest đã cam kết. Không cần public key hay chữ ký số.

### b. Mật khẩu 6 ký tự

Digest được công khai ngay trong output. Kẻ tấn công có thể duyệt ngoại tuyến
toàn bộ không gian mật khẩu 6 ký tự, băm từng ứng viên và so sánh với digest.
Khi tìm được \(P\), họ tạo giao dịch tiêu UTXO về địa chỉ của mình. Hàm băm
nhanh như SHA256 không thay thế cho password hashing có salt và có chi phí cao.

### c. Passphrase mạnh 30 ký tự

Passphrase mạnh ngăn được vét cạn trước khi Alice tiêu coin, nhưng script vẫn
không an toàn:

1. Alice phát giao dịch, trong đó `<P>` xuất hiện công khai trong `ScriptSig`.
2. Nút mạng hoặc miner đọc được \(P\) từ mempool.
3. Họ tạo giao dịch cạnh tranh, cũng dùng \(P\), nhưng chuyển coin đến địa chỉ
   của họ và có thể trả phí cao hơn.
4. Script chỉ kiểm tra preimage, không có chữ ký ràng buộc người nhận hoặc nội
   dung giao dịch, nên giao dịch thay thế cũng hợp lệ.

Kết luận: bí mật được công khai đúng lúc sử dụng; chỉ hashlock là chưa đủ để
bảo vệ quyền sở hữu. Cần kết hợp điều kiện chữ ký, chẳng hạn hashlock **và**
`OP_CHECKSIG`.

## Bài 4 - BitcoinLotto

Gọi \((sk_i,PK_i)\) là cặp khóa của vé trúng tuần \(i\). Nhà in đáng tin cậy
đặt \(sk_i\) dưới lớp cào của đúng một vé thắng và không giữ bản sao.

### a. Chỉ cho nhận giải vào cuối tuần

Có thể khóa output bằng `OP_CHECKLOCKTIMEVERIFY` (CLTV):

```text
<T_end> OP_CHECKLOCKTIMEVERIFY OP_DROP <PK_i> OP_CHECKSIG
```

Trong đó `T_end` là block height hoặc Unix timestamp ứng với cuối tuần. Giao
dịch nhận giải phải có:

- `nLockTime >= T_end` và cùng kiểu height/time với `T_end`;
- `nSequence` của input khác `0xffffffff`;
- chữ ký hợp lệ tạo bởi \(sk_i\).

Trước `T_end`, CLTV làm script thất bại. Sau `T_end`, chỉ người giữ vé thắng
mới tạo được chữ ký hợp lệ.

### b. Chuyển jackpot chưa nhận sang các tuần sau

Vì hệ thống có đúng 1000 tuần, nhà in có thể sinh trước 1000 cặp khóa và công
bố toàn bộ public key. Jackpot mới của tuần \(i\) được khóa theo điều kiện
`1-of-(1001-i)` giữa khóa tuần hiện tại và tất cả khóa các tuần sau:

```text
1 <PK_i> <PK_(i+1)> ... <PK_1000> (1001-i) OP_CHECKMULTISIG
```

Có thể đặt điều kiện này sau CLTV của câu a. Khi đó:

- nếu người thắng tuần \(i\) xuất hiện, \(sk_i\) tiêu được jackpot tuần \(i\);
- nếu jackpot tuần \(i\) chưa được nhận, người thắng tuần \(i+1\) có khóa
  nằm trong output tuần \(i\), nên có thể nhận cả jackpot cũ và mới;
- tổng quát, người thắng tuần \(j\) có thể gom mọi UTXO chưa nhận của các tuần
  \(i\le j\) vào một giao dịch;
- ban tổ chức không có private key nào, nên không có thêm cách biển thủ so với
  mô hình ban đầu. Giả thiết nhà in không lưu khóa vẫn là giả thiết tin cậy cốt
  lõi.

Đây là thiết kế khái niệm mà câu hỏi hướng tới. `OP_CHECKMULTISIG` thực tế có
giới hạn số public key (và script còn có giới hạn kích thước), nên không thể
đưa 1000 khóa vào một script Bitcoin hiện hành. Một hệ thống triển khai thật
cần chia thành các giai đoạn rollover, dùng các giao dịch ký sẵn hoặc một cấu
trúc script hiện đại hơn; điều đó không thay đổi ý tưởng ủy quyền trước cho các
khóa thắng tương lai.

## Bài 5 - Lightweight client

Bob chỉ giữ header của block head (đỉnh chuỗi) hiện tại và nhận header này từ
nguồn đáng tin cậy.

### a. Dữ liệu Alice phải gửi

Giả sử giao dịch nằm trong block \(B_0\), còn block Bob đang giữ là \(B_k\):

```text
B0 <- B1 <- ... <- B(k-1) <- Bk (Bob đã có)
```

Alice gửi:

1. giao dịch thanh toán để Bob kiểm tra output thực sự trả tiền cho mình;
2. Merkle inclusion proof từ TXID của giao dịch đến Merkle root trong header
   \(B_0\), kèm vị trí trái/phải;
3. header của \(B_0,B_1,\ldots,B_{k-1}\).

Bob thực hiện:

1. băm giao dịch để lấy TXID, dùng Merkle proof tính lại root và so sánh với
   `merkle_root` trong header \(B_0\);
2. băm từng header, rồi kiểm tra hash của \(B_i\) bằng trường
   `previous_block_hash` trong \(B_{i+1}\);
3. ở bước cuối, kiểm tra hash của \(B_{k-1}\) bằng `previous_block_hash` trong
   header \(B_k\) mà Bob đã tin cậy.

Như vậy Merkle proof chứng minh giao dịch thuộc \(B_0\), còn chuỗi header chứng
minh \(B_0\) là tổ tiên của head Bob đang giữ.

### b. Kích thước bằng chứng

Với \(n\) giao dịch trong một block, Merkle proof nhị phân cần
\(\lceil\log_2 n\rceil\) hash. SHA256 cho hash 32 byte. Mỗi Bitcoin block
header dài 80 byte. Nếu giao dịch nằm cách head đúng \(k\) block, Bob đã có
header head và Alice cần gửi \(k\) header còn lại.

Bỏ qua kích thước giao dịch và vài bit metadata chỉ hướng trái/phải:

\[
\boxed{S(n,k)=32\lceil\log_2 n\rceil+80k\text{ byte}.}
\]

Với \(k=6,n=1024=2^{10}\):

\[
S=32\cdot10+80\cdot6=320+480=\boxed{800\text{ byte}}.
\]

Nếu tính cả giao dịch thanh toán, cộng thêm kích thước serialized transaction
\(|tx|\). Con số 800 byte là phần bằng chứng xác thực mà đề có đủ dữ kiện để
tính.

## Tài liệu kiểm chứng

- [BIP 65 - OP_CHECKLOCKTIMEVERIFY](https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki)
- [Bitcoin Developer Reference - Block headers và Merkle tree](https://developer.bitcoin.org/reference/block_chain.html)
- [Bitcoin Developer Guide - Simplified Payment Verification](https://developer.bitcoin.org/devguide/operating_modes.html#simplified-payment-verification-spv)
- [Bitcoin Developer Reference - Transactions và Script](https://developer.bitcoin.org/reference/transactions.html)
