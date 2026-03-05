# 100Bold Video Generator — Hướng dẫn sử dụng & Workflow

## Giới thiệu

**100Bold Video Generator** là công cụ tạo video bằng AI, giúp bạn đi từ kịch bản văn bản → hình ảnh → video chỉ trong vài bước. Ứng dụng sử dụng **Google Gemini** để phân tích kịch bản & tạo ảnh, **Kling AI** để tạo video.

**Đối tượng:** Nhà sáng tạo nội dung, marketer, đội ngũ video production.

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────┐
│                   TRÌNH DUYỆT                   │
│          public/index.html (SPA)                │
│   HTML + CSS + JavaScript (không framework)      │
└──────────┬──────────────┬───────────────────────┘
           │              │
     POST /api/gemini   POST & GET /api/kling
           │              │
┌──────────▼──────────┐  ┌▼─────────────────────┐
│  api/gemini.js      │  │  api/kling.js         │
│  (Vercel Serverless)│  │  (Vercel Serverless)  │
│  - Tạo prompt       │  │  - Tạo JWT            │
│  - Phân tích ảnh    │  │  - Gửi task video     │
│  - Tạo ảnh (Nano)   │  │  - Poll trạng thái    │
└──────────┬──────────┘  └──────┬───────────────┘
           │                     │
   Google Gemini API        Kling AI API
```

### Cấu trúc thư mục

```
100BoldVideo-app/
├── .env                 ← API keys (KHÔNG commit)
├── package.json         ← Metadata dự án
├── vercel.json          ← Cấu hình serverless functions
├── public/
│   ├── index.html       ← Toàn bộ giao diện (SPA)
│   └── 100BOLD - OP3-09 (1).png  ← Logo
└── api/
    ├── gemini.js        ← Proxy Google Gemini API
    ├── kling.js         ← Proxy Kling AI API (có JWT)
    └── claude.js        ← Proxy Anthropic Claude (dự phòng)
```

---

## Workflow chi tiết

### Bước 1 — Upload ảnh tham chiếu (tuỳ chọn)

- Kéo thả hoặc click để upload 1–4 ảnh nhân vật
- Thêm ghi chú nhân vật (VD: "CEO, đeo kính, mặc vest đen")
- Gemini sẽ phân tích ảnh → tạo mô tả chi tiết ngoại hình
- Mô tả này được gắn vào token `{{CHARACTER}}` dùng xuyên suốt các scene

### Bước 2 — Nhập kịch bản

- Dán kịch bản / lời thoại vào ô "Nhập kịch bản video"
- Gemini sẽ tự chia thành 4–8 scene dựa trên nội dung

### Bước 3 — Cấu hình

| Tuỳ chọn | Giá trị |
|-----------|---------|
| **Tone** | Professional · Emotional · Energetic · Luxury · Storytelling |
| **Tỷ lệ khung hình** | 9:16 (dọc) · 16:9 (ngang) · 1:1 (vuông) |
| **Phong cách ảnh** | Photorealistic · Commercial · Documentary · Corporate |
| **Model tạo ảnh** | Nano Banana 2 · Nano Banana Pro |
| **Model tạo video** | Kling v2.5 · v2.1 · v1.6 |
| **Ngôn ngữ prompt** | English · Vietnamese |

### Bước 4 — Tạo prompt

- Click **"Tạo 2 Options Prompt"**
- Gemini phân tích kịch bản + ảnh tham chiếu
- Trả về cho mỗi scene:
  - **2 Image Prompt** (góc chụp, bối cảnh khác nhau)
  - **2 Video Prompt** (chuyển động camera khác nhau)
- Kết quả hiển thị dạng card có thể mở/đóng từng scene

### Bước 5 — Chọn prompt & tạo ảnh

- Duyệt từng scene, chọn prompt ưng ý
- Click **"Gen Ảnh (Nano Banana)"** → chờ 15–30 giây
- Ảnh hiển thị ngay trên giao diện
- Có thể copy prompt để chỉnh sửa thủ công

### Bước 6 — Tạo video

- Click **"Gen Video (Kling)"**
- Nếu đã có ảnh → dùng `image2video` (chất lượng cao hơn)
- Nếu chưa có ảnh → dùng `text2video`
- App tự poll trạng thái mỗi 5 giây cho đến khi hoàn thành (30–120 giây)
- Video hiển thị với nút tải xuống

### Bước 7 — Xuất kết quả

- **Export Selected** — Copy các prompt đã chọn
- **Export All** — Copy toàn bộ prompt tất cả scene
- Tải ảnh (PNG) và video (MP4) trực tiếp

---

## Ví dụ sử dụng

**Input:**
- Kịch bản: "Bạn đang bỏ lỡ hàng ngàn khách hàng mỗi ngày..."
- Tone: Professional
- Ảnh: 1 ảnh chân dung CEO
- Tỷ lệ: 16:9

**Kết quả:**
1. Gemini phân tích ảnh → "Male, 45, Asian, sharp jawline, confident expression..."
2. Kịch bản chia thành 4 scene
3. Mỗi scene có 2 option ảnh + 2 option video
4. Tạo ảnh → dùng làm frame đầu cho Kling
5. Kling tạo video 5 giây cho mỗi scene
6. Tải về toàn bộ media

---

## Cài đặt & Triển khai

### Yêu cầu

- Node.js (bất kỳ phiên bản gần đây)
- Vercel CLI: `npm install -g vercel`
- API Keys:
  - **Google AI Studio** — https://aistudio.google.com
  - **Kling AI** — https://klingai.com → Developer → API Keys

### Biến môi trường (`.env`)

```env
GOOGLE_API_KEY=AIzaSyBc...
KLING_ACCESS_KEY=...
KLING_SECRET_KEY=...
CLAUDE_API_KEY=sk-ant-api03-...   # tuỳ chọn
```

### Chạy local

```bash
# 1. Tạo file .env với API keys
# 2. Chạy dev server
vercel dev
# → http://localhost:3000
```

### Deploy lên Vercel

```bash
# 1. Deploy
vercel --prod

# 2. Thêm biến môi trường trên Vercel Dashboard
#    Settings → Environment Variables → thêm từng key

# 3. Redeploy
vercel --prod
```

---

## Cấu hình serverless (`vercel.json`)

```json
{
  "functions": {
    "api/gemini.js":  { "maxDuration": 60 },
    "api/claude.js":  { "maxDuration": 120 },
    "api/kling.js":   { "maxDuration": 60 }
  }
}
```

---

## Lưu ý quan trọng

- **Ảnh tham chiếu rất quan trọng** — giúp nhân vật nhất quán giữa các scene
- **image2video > text2video** — dùng ảnh đã gen làm frame đầu cho chất lượng tốt hơn nhiều
- **Gemini có rate limit** — tạo ảnh nhiều có thể bị 429, app tự retry (tối đa 3 lần)
- **Không có database** — toàn bộ dữ liệu nằm trên trình duyệt, mất khi refresh trang
- **Không có xác thực** — ai có URL đều dùng được, nên deploy private
- **Token `{{CHARACTER}}`** — được tự động thay bằng mô tả nhân vật trong tất cả prompt
