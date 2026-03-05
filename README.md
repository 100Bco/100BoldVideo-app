# AI Video Prompt Generator v3

Nano Banana (Gemini Image) + Kling AI + Claude — Vietnamese video creator tool.

## Deploy lên Vercel (5 phút)

### Bước 1 — Cài Vercel CLI
```bash
npm i -g vercel
```

### Bước 2 — Deploy
```bash
cd ai-video-prompt-vercel
vercel --prod
```
Vercel sẽ hỏi vài câu → nhấn Enter hết → copy URL deploy xong.

### Bước 3 (tuỳ chọn) — Set API key cố định trên server
Nếu không muốn user nhập Google API key mỗi lần:
```bash
vercel env add GOOGLE_API_KEY
# nhập key của bạn
vercel --prod  # redeploy
```

---

## Cấu trúc project

```
/api/gemini.js      ← Serverless function proxy (bypass CORS)
/public/index.html  ← Frontend app
vercel.json         ← Config
```

## Tại sao cần proxy?

Google Gemini API không cho phép gọi trực tiếp từ browser (CORS).
Khi deploy lên Vercel, `/api/gemini` chạy trên Node.js server — không bị CORS.
Frontend gọi `/api/gemini` → server gọi Google → trả kết quả về browser.

## API Keys cần có

| Key | Lấy ở đâu |
|-----|-----------|
| Google AI Studio | [aistudio.google.com](https://aistudio.google.com) → Get API Key |
| Kling Access Key | [klingai.com](https://klingai.com) → Developer → API Keys |
| Kling Secret Key | cùng trang với Access Key |
| Anthropic (Claude) | Không cần nhập — đã embedded trong app |
