# Dietary AI Compliance Dashboard - Project Requirements & Architecture

## 1. Project Overview
The **Dietary AI Compliance Dashboard** is a Next.js-based module designed to be integrated into an existing production dashboard. It empowers clinical dietitians to audit diet plans for safety and compliance using Generative AI (OpenAI GPT-4o-mini). The system identifies conflicts between a diet template and a client's specific health profile (allergies, medical conditions, aversions) by strictly grounding its analysis in authoritative recipe data from the BN API.

---

## 2. System Architecture & Integration

The application follows a **Hybrid Frontend-Backend Architecture** using Next.js App Router, designed for seamless integration into an existing Vercel deployment.

### High-Level Data Flow:
```mermaid
graph TD
    User[Dietitian] -->|Interacts| UI[Next.js Client UI]
    UI -->|Server Actions| Server[Next.js Server Layer]
    
    subgraph "External Integrations"
        Server -->|Fetch Client/Template| BN_API[Legacy BN API]
        Server -->|Enrich Ingredients| Recipe_API[Recipe Database (Ground Truth)]
        Server -->|Audit Logic| AI_Provider[OpenAI GPT-4o-mini]
    end
    
    Server -->|Return Audit Result| UI
```

### Deployment Strategy:
*   **Target**: Vercel (Existing Dashboard).
*   **Method**: Code transfer/Module integration. This project serves as the feature implementation sandbox.
*   **Authentication**:
    *   **Development**: Mocks admin access for standalone testing.
    *   **Production**: Will inherit the existing dashboard's admin authentication session and context. No new auth system is required.

### Key Components:
1.  **Client Layer (`/components`)**: 
    -   React Server Components (RSC) for initial data fetch.
    -   Client Components for interactivity (editing profile, running audit).
2.  **Server Action Layer (`/app/actions`)**: 
    -   **Secure Middleware**: Handles API authentication and secrets server-side.
    -   **Pipeline Orchestrator**: Manages the Fetch -> Enrich -> Analyze flow.
3.  **Service Layer (`/lib/services`)**:
    -   `api-service.ts`: Handles External API comms and caching.
    -   `ai-provider.ts`: Abstraction for LLM providers.

---

## 3. Technology Stack

| Component | Technology | Reasoning |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14 (App Router)** | Server Actions, simple deployment, React integration. |
| **Language** | **TypeScript** | Type safety for complex data structures (Client profiles, Audit results). |
| **AI Integration** | **Vercel AI SDK** | Standardized API for LLMs, supports Structured Outputs (`generateObject`). |
| **Model** | **GPT-4o-mini** | Optimized for speed (<3s latency) and cost-efficiency. |
| **Validation** | **Zod** | Runtime schema validation for API responses and AI outputs. |

---

## 4. Data Pipeline (The "Audit Loop")

**CRITICAL REQUIREMENT: Data Grounding**
The AI Audit **must** be grounded in the **BN Recipe API data**. The AI is *not* allowed to "guess" or hallucinate ingredients for dishes. It must use the authoritative ingredient lists returned by the `batch-search` endpoint (or cached equivalents) to ensure accuracy.

1.  **Input Collection**:
    -   Dietitian selects a **Diet Template**.
    -   Client Profile is loaded (with optional manual session-based overrides).
    
2.  **Dish Extraction**:
    -   System regex-parses the HTML template to isolate dish names from meal slots.

3.  **Data Enrichment (The Grounding Step)**:
    -   **Cache Check**: In-memory check for known dishes.
    -   **API Lookup**: Unknow dishes are sent to BN Recipe API (`/batch-search`) to retrieve ingredient lists.
    -   *Logic*: If data is already available in the dashboard context, it is used; otherwise, the API is queried.

4.  **AI Inference**:
    -   **Prompting**: The LLM receives the **Ground Truth** (Client Constraints + Exact Dish Ingredients).
    -   **Analysis**: Function: `(Client Profile + Dish Ingredients) -> Conflicts`.
    -   **Output**: Strictly typed JSON (Red/Orange flags).

5.  **Visual Feedback**:
    -   Conflicts applied inline to the template.

---

## 5. Features & Scope

### In-Scope (Implemented)
*   **AI Compliance Audit**: One-click analysis grounded in recipe data.
*   **Client Profile Management**: View details with **Session-Based Editing** (updates apply to current audit only).
*   **Diet Plan Viewer**: HTML rendering of templates.
*   **Performance Optimization**: In-memory caching and `gpt-4o-mini` reduced audit time to ~3 seconds.

### Out-of-Scope / Constraints
*   **Data Persistence**: 
    -   Manual edits to the client profile (e.g., adding an allergy) are **ephemeral** (session only). 
    -   **No requirement** to write these changes back to the BN Client Database.
*   **Chat Interface**: 
    -   The "Chat" tab is a **UI Placeholder**. No functionality required.
*   **Authentication Logic**:
    -   Mocked for dev; handled by parent app in prod.
*   **Full Diet Creation**:
    -   Users currently view/audit existing templates; creating new ones from scratch is not part of this module.

---

## 6. Best Practices Implemented

### 1. Grounded AI Accuracy
*   **Rule**: "Never guess, always look up."
*   **Implementation**: The AI is fed precise ingredient lists from the database. It acts as a semantic analysis engine rather than a recipe knowledge base.

### 2. Performance & Caching
*   **In-Memory Caching**: `enrichDishes` uses a `Map<string, string[]>` cache. Common dishes (e.g., "Green Tea") are fetched once and reused across audits.
*   **Model Selection**: `gpt-4o-mini` chosen for speed.

### 3. Security
*   **Server Actions**: API Keys (OpenAI, BN_API_TOKEN) are kept server-side.
