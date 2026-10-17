# Project 3 - Ethereum Payment App

Project 3 xây dựng một phiên bản phi tập trung của Splitwise trên Ethereum.
Ứng dụng chỉ ghi nhận quan hệ nợ; không chuyển ETH giữa người dùng. ETH chỉ
được dùng để thanh toán gas khi gọi smart contract.

- [Đề bài chính thức](https://securitylab.github.io/cs251-fall23/hw/proj3.pdf)
- [Starter code](https://securitylab.github.io/cs251-fall23/hw/proj3.zip)

## Yêu cầu

### Smart contract

File `contracts/mycontract.sol` phải cung cấp:

- `lookup(debtor, creditor)`: trả về số tiền `debtor` đang nợ `creditor`.
- `add_IOU(creditor, amount, ...)`: cộng thêm một khoản nợ do
  `msg.sender` tạo. `amount` phải lớn hơn 0.
- Cơ chế triệt chu trình nợ phải được kiểm tra ở contract để client độc hại
  không thể gửi dữ liệu giả nhằm xóa nợ đã ghi nhận.

Contract cần dùng ít storage và computation để giảm gas. Vì client có thể quét
lịch sử blockchain, contract không cần lưu danh sách người dùng hoặc thời gian
hoạt động.

### Client

File `web_app/script.js` phải cài đặt bốn hàm async:

- `getUsers()`: danh sách mọi địa chỉ từng gửi hoặc nhận IOU.
- `getTotalOwed(user)`: tổng số tiền `user` đang nợ.
- `getLastActive(user)`: UNIX timestamp gần nhất khi `user` gửi hoặc nhận IOU;
  trả về `null` nếu chưa có hoạt động.
- `add_IOU(creditor, amount)`: tìm chu trình nợ nếu có rồi gửi giao dịch tới
  contract.

Mọi địa chỉ phải được so sánh không phân biệt chữ hoa/chữ thường. Bốn hàm trên
phải trả về `Promise` theo giao diện có sẵn của starter code.

## Triệt chu trình nợ

Mỗi cạnh `A -> B` trọng số `x` biểu diễn việc A nợ B số tiền x. Khi thêm cạnh
mới tạo thành một chu trình, ứng dụng trừ trọng số nhỏ nhất trong chu trình khỏi
tất cả các cạnh của chu trình. Ít nhất một cạnh sẽ trở về 0.

Ví dụ, trước khi thêm IOU mới:

```text
A --15--> B --11--> C
```

Nếu C thêm khoản nợ 16 cho A, giá trị nhỏ nhất của chu trình là 11. Kết quả:

```text
A --4--> B    B --0--> C    C --5--> A
```

Thiết kế của lời giải phân chia trách nhiệm như sau:

1. Client dựng đồ thị nợ từ `getUsers()` và `lookup()`.
2. Client dùng BFS tìm đường từ chủ nợ mới về người gửi IOU.
3. Contract xác minh hai đầu đường đi, từng cạnh hiện hữu và tự tính giá trị
   nhỏ nhất trước khi cập nhật các khoản nợ.

Nhờ vậy, việc tìm đường được thực hiện miễn phí ở client, còn các điều kiện ảnh
hưởng tới số dư được contract kiểm chứng.

## File nộp

Theo đề bài, chỉ nộp hai file:

```text
contracts/mycontract.sol
web_app/script.js
```

Địa chỉ contract và ABI trong `web_app/script.js` phải được cập nhật sau mỗi lần
deploy trước khi mở giao diện web.
