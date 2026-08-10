**Step-by-step recovery after the host machine is restarted**

Follow these steps in order every time you restart the computer.

---

### 1. Start n8n (Podman)

Open **WSL** terminal and run:

```bash
podman start n8n
```

If the container was removed, recreate it with CORS enabled:

```bash
podman run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_CORS_ALLOW_ORIGIN="*" \
  -v n8n_data:/home/node/.n8n \
  docker.io/n8nio/n8n:latest
```

Check that it is running:

```bash
podman ps
```

Open n8n in the browser: [http://localhost:5678](http://localhost:5678)  
→ Make sure both workflows (**Search Inventory** and **Submit Order**) are **Active**.

---

### 2. Start ngrok

In a **new** WSL terminal (or Windows terminal) run:

```bash
ngrok http 5678
```

Copy the new public URL that ngrok gives you  
(example: `https://something-new.ngrok-free.dev`)

---

### 3. Update the frontend with the new ngrok URL

Because free ngrok gives a **new URL every time**, you must update the code.

1. Open `app/page.tsx`
2. Replace the two URLs at the top with the new ones:

```ts
const SEARCH_URL = "https://YOUR-NEW-NGROK-URL.ngrok-free.dev/webhook/inventory-search";
const SUBMIT_URL = "https://YOUR-NEW-NGROK-URL.ngrok-free.dev/webhook/submit-order";
```

3. Save the file
4. Push the change:

```bash
cd ~/warehouse-request
git add .
git commit -m "Update ngrok URL after restart"
git push
```

Vercel will automatically redeploy (takes 1–2 minutes).

---

### 4. Test

1. Open your live site: [https://warehouse-request.vercel.app](https://warehouse-request.vercel.app)
2. Hard refresh (`Ctrl + Shift + R`)
3. Search for something and test a full request

---

### Quick checklist after every restart

| Step | Command / Action                              | Status |
|------|-----------------------------------------------|--------|
| 1    | `podman start n8n`                            | ☐      |
| 2    | Workflows Active in n8n                       | ☐      |
| 3    | `ngrok http 5678`                             | ☐      |
| 4    | Update SEARCH_URL + SUBMIT_URL in page.tsx    | ☐      |
| 5    | `git add . && git commit -m "..." && git push`| ☐      |
| 6    | Wait for Vercel + hard refresh                | ☐      |

---

Would you like me to also give you a small script that automates most of these steps?
