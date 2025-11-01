# 🏷️ AI Image Gallery Challenge

---

## 🧩 1. Overview

**AI Image Gallery** is a web application that allows users to upload, view, and search their personal image collections with the help of AI.  
Each uploaded image is automatically analyzed to generate descriptive tags, a one-sentence caption, and the top three dominant colors.  

Users can:
- Authenticate securely with Supabase (email/password)
- Upload single or multiple images
- Browse images in a responsive grid
- Search by tags or description
- Filter images by color
- Find similar images by tags or color
- View image details in a modal
- See upload progress and AI processing status  

AI processing runs automatically in the background via a scheduled **Vercel Cron Job**, which analyzes pending images and updates their metadata.

---

## ⚙️ 2. Setup Instructions

### **Prerequisites**
- Node.js 18 or higher  
- npm or yarn  
- A Supabase project  
- An OpenAI API key  

### **Installation**

1. Clone this repository:

    ```bash
    git clone https://github.com/yourusername/ai-image-gallery.git
    cd ai-image-gallery
    ````

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment example file:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in the required environment variables (see below).
   You can find Supabase keys in your project settings.

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open your browser at [http://localhost:3000](http://localhost:3000)

### **Database & Migrations**
All SQL migration files are stored inside the `/supabase` directory.

To apply migrations manually:
1. Open your Supabase SQL editor.
2. Copy and run the contents of each migration file in `/supabase`.
3. This will create the necessary tables (`images`, `image_metadata`) and apply RLS (Row Level Security) policies, and RPC functions.

```bash
/supabase
 ├─ 001_create_tables.sql
 ├─ 002_rls_policies.sql
 └─ 003_rpc.sql

---

## 🔑 3. API Keys Needed

The following keys are required for the app to run:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

| Key                             | Purpose                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Frontend Supabase client connection                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key for client-side auth                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Secure key used server-side for admin operations           |
| `OPENAI_API_KEY`                | Used for AI image analysis (tags, description, and colors) |

> ⚠️ All API keys except `NEXT_PUBLIC_*` must remain private and **should never be exposed to the client.**

---

## 🧠 4. Architecture Decisions

| Component              | Technology               | Purpose                                                          |
| ---------------------- | ------------------------ | ---------------------------------------------------------------- |
| **Frontend & Backend** | **Next.js (App Router)** | Unified full-stack app for both UI and API routes                |
| **Database & Auth**    | **Supabase**             | Handles PostgreSQL database, file storage, and authentication    |
| **AI Service**         | **OpenAI Vision**        | Generates tags, descriptions, and color data from images         |
| **Styling**            | **TailwindCSS**          | Simple, responsive UI components                                 |
| **Caching**            | **SWR**                  | Client-side revalidation for faster UI performance               |
| **Cron Jobs**          | **Vercel Cron**          | Runs every **12 hours** to process pending images asynchronously |
| **Hosting**            | **Vercel + Supabase**    | Zero-config deployment and managed backend                       |

**Key Architectural Highlights**

* **Serverless-first**: Using Vercel’s API routes and Cron for backend automation.
* **Secure & Multi-tenant**: Supabase Row Level Security ensures each user only accesses their own images.
* **Async AI Processing**: Images are uploaded instantly; AI metadata is generated in the background.
* **Persistent Caching**: AI results are stored in the database to avoid reprocessing.
* **SWR Revalidation**: Lightweight caching and automatic background refresh of image data.
* **Scalable foundation**: Future-ready for adding vector similarity or open-source AI models.

---

## 🤖 5. AI Service Comparison

A detailed comparison of evaluated AI services — including **AWS Rekognition**, **Google Cloud Vision**, **Clarifai**, and **OpenAI Vision** — can be found in the dedicated document below:

> 📄 [AI-Service-Comparison.md](./AI-Service-Comparison.md)

In summary:

* **OpenAI Vision** was chosen for this project due to its strong natural-language understanding, flexible tagging, and integrated color extraction capabilities.
* The service provides descriptive text and contextual tags that are more human-like compared to traditional image classifiers.
* Cost and rate limits were acceptable for a small-scale challenge, and the setup was simpler than AWS or GCP equivalents.

---

## 🚀 6. How It Works

The AI Image Gallery follows a simple but scalable flow from upload to discovery:

### **1️⃣ User Authentication**

* Managed through **Supabase Auth** using email and password.
* Only authenticated users can upload and view their own images.
* RLS (Row Level Security) policies ensure strict data isolation.

### **2️⃣ Image Upload**

* Users can upload one or multiple images simultaneously via a drag-and-drop interface.
* Images are uploaded to **Supabase Storage**:

  * Original images are stored under `/originals/`.
  * Thumbnails (300×300) are generated for fast display.
* Upload progress is displayed using visual indicators.

### **3️⃣ Background AI Processing**

* Each upload creates a record in `image_metadata` with `ai_processing_status = 'pending'`.
* A **Vercel Cron Job** (runs every **12 hours**) triggers a backend task that:

  1. Fetches pending images.
  2. Sends them to the **OpenAI Vision** API.
  3. Extracts tags, one-sentence descriptions, and top 3 dominant colors.
  4. Updates the metadata in Supabase and marks them as `"done"`.

### **4️⃣ Gallery Display**

* The gallery retrieves image metadata and renders thumbnails in a responsive grid using **TailwindCSS**.
* Clicking an image opens a modal with:

  * Full-size image preview
  * AI-generated description
  * Tags (as clickable chips)
  * Color swatches (for filtering)
  * A “Find Similar” button (based on tags or color)

### **5️⃣ Search and Filtering**

* **Text Search**: By tags or description.
* **Find Similar (by tags)**: Computes overlap ratio between image tags.
* **Find Similar (by color)**: Uses fuzzy RGB distance matching to find images with close color palettes.
* **Pagination**: Implemented for browsing large image sets (20 per page).

### **6️⃣ Caching and Revalidation**

* Uses **SWR (stale-while-revalidate)** for client-side caching and re-fetching freshness.
* Ensures images load instantly while still keeping the data up-to-date in the background.
* Server-side caching is handled naturally through Supabase (AI results stored persistently).

---

## 💾 7. Caching Strategy

### **Server-side (Persistent Cache)**

* AI metadata (`tags`, `description`, `colors`) is stored in the `image_metadata` table.
* Once processed, the AI data is never recomputed unless explicitly refreshed.
* This prevents unnecessary API calls — acting as a **permanent cache**.

### **Client-side (SWR)**

* The gallery uses **SWR** for data fetching with revalidation:

  * Keeps responses in memory for fast navigation.
  * Re-fetches automatically when the tab is focused or data becomes stale.
* Lightweight and minimal setup — ideal for this challenge’s scale.

### **Future Enhancement**

* Replace or complement SWR with **React Query** for more complex caching strategies:

  * Offers better control over cache invalidation, query synchronization, and pagination.
  * Ideal if this app scales to a multi-branch SaaS or enterprise tool.

---

## 🧰 8. Technical Notes

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Database:** Supabase PostgreSQL with Row Level Security
* **Auth:** Supabase Auth (email/password)
* **Styling:** TailwindCSS + shadcn/ui components (via v0.dev)
* **Caching:** SWR for revalidation, persistent cache in Supabase
* **Async Jobs:** Vercel Cron Job (every 12 hours) for background AI processing
* **AI Provider:** OpenAI Vision (for tags, descriptions, and colors)
* **Routing:** Separate endpoints for:

  * `/api/images/:id/similar/tags`
  * `/api/images/color/:colorCode`
* **Color Matching:** Fuzzy RGB distance calculation for similar color detection
* **Pagination:** Implemented with metadata and limit/offset pattern
* **Deployment:** Hosted on **Vercel**, backend powered by **Supabase**

---

## 💡 9. Potential Improvements

This project focuses on delivering the core challenge requirements — but several enhancements could improve scalability, user experience, and maintainability:

### 🧠 **Frontend**

* **Integrate React Query:**
  Replace SWR for more fine-grained cache control, better pagination, and mutation management.
  Ideal if user data grows or multiple concurrent views are added.
* **Infinite Scroll Option:**
  Implement for smoother browsing when dataset grows large.
* **Dark Mode & Theming:**
  Provide user preference support for light/dark color schemes.

### ⚙️ **Backend / Architecture**

* **Split Client & Server (React + Express):**
  As the app grows, separating frontend (React) and backend (Express/Fastify) can improve scalability, allow team specialization, and support advanced workloads like job queues or WebSockets.
  This structure is preferable beyond MVP stage or with multiple developers.
* **Supabase Migrations:**
  Add automatic migrations for `images` and `image_metadata` tables.
* **Enhanced AI Pipeline:**
  Integrate multiple AI providers for fallback or specialized analysis (e.g., Rekognition for labels, OpenAI for captions).
* **Unit Tests:**
  Add Jest or Vitest for core modules like image upload, AI processing, and search logic.
  (Due to time constraints, unit testing was deferred.)
* **Performance Monitoring:**
  Add error tracking and logs using Vercel Analytics or Sentry.

### 🎨 **UX**

* **Bulk Image Actions:** Delete, rename, or reprocess multiple images.
* **AI Metadata Editing:** Allow manual tag or description edits.
* **Public/Shared Galleries:** Optional visibility settings for collaboration.

---

## 🧩 10. Features Checklist

| Feature                      | Status | Description                                                        |
| ---------------------------- | :----: | ------------------------------------------------------------------ |
| 🔐 **Authentication**        |    ✅   | Supabase Auth (email/password) with protected routes               |
| 🖼️ **Image Upload**         |    ✅   | Upload single or multiple JPEG/PNG files with progress bar         |
| 🧠 **AI Analysis**           |    ✅   | OpenAI Vision for tags, one-sentence description, and top 3 colors |
| 🕒 **Async Processing**      |    ✅   | Vercel Cron job (every 12 h) analyzes pending images               |
| 🎨 **Color Extraction**      |    ✅   | Extracts dominant colors; enables color-based search               |
| 🔎 **Search & Filters**      |    ✅   | Search by tags or description; filter by color                     |
| 🧩 **Find Similar (Tags)**   |    ✅   | Finds related images by tag overlap                                |
| 🎨 **Find Similar (Colors)** |    ✅   | Finds related images by RGB distance                               |
| 📄 **Pagination**            |    ✅   | 20 images per page with metadata                                   |
| 💾 **Caching**               |    ✅   | Server-side cache in Supabase; SWR for client revalidation         |
| 📱 **Responsive UI**         |    ✅   | TailwindCSS grid with modal previews                               |
| 🧠 **RLS Security**          |    ✅   | Users only access their own images                                 |
| ⚙️ **Error Handling**        |    ✅   | Graceful API + UI error states                                     |
| 🧭 **Documentation**         |    ✅   | README + AI Service Comparison doc                                 |

---

## 📸 11. Demo

Below is an animated GIF demonstration of the core user flow —  
**login → upload → AI tagging → view metadata → find similar images.**

![AI Gallery Demo](./ai%20gallery%20demo.gif)

> 🧠 **Live Demo:** [https://image-gallery-client-seven.vercel.app/](https://image-gallery-client-seven.vercel.app/)

---

## 🏁 12. Summary

**AI Image Gallery** demonstrates a complete full-stack application that combines:

* 🧩 **Next.js** for both frontend and backend (App Router)
* 🪶 **Supabase** for authentication, database, and storage
* 🧠 **OpenAI Vision** for AI tagging, description, and color extraction
* 🕒 **Vercel Cron** for background AI processing every 12 hours
* 🎨 **TailwindCSS + shadcn/ui** for responsive, elegant design
* 🔄 **SWR** for efficient client-side caching and revalidation

The project emphasizes clarity, scalability, and good developer experience —
from background AI workflows to RLS-secured multi-tenant data.

---

> “Completed with diligence and elegance under the watchful guidance of **His Excellency**.”

---

## 🧾 Credits

Crafted by **His Excellency**, with elegance, precision, and immaculate taste in architecture.

**Special thanks to:**

* 🪄 [v0.dev](https://v0.dev) – for UI scaffolding and layout inspiration
* 🧩 [shadcn/ui](https://ui.shadcn.com) – for modular, accessible React components
* 🪶 [Supabase](https://supabase.com) – for powering auth, database, and storage
* ⚙️ [OpenAI](https://openai.com) – for AI vision capabilities
* 💻 [Vercel](https://vercel.com) – for hosting and Cron scheduling
* 🎨 [TailwindCSS](https://tailwindcss.com) – for beautiful and responsive styling

> “In the service of code, design, and elegant architecture — *His Excellency* approves this README.”
