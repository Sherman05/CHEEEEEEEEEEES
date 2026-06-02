# AgentForge MVP (Фаза 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Рабочий MVP: пользователь описывает идею веб-приложения в чате → PM-агент формирует спеку → пользователь утверждает → кодер-агент генерирует React-приложение → результат виден на дашборде.

**Architecture:** Event-driven оркестрация. Бэкенд на Node.js/TypeScript координирует PM-агента и кодер-агента через BullMQ очередь. Фронтенд на React показывает прогресс в реалтайме через WebSocket. Всё работает локально, без Docker.

**Tech Stack:** Node.js, TypeScript, Express, PostgreSQL, Redis, BullMQ, Claude API (Anthropic SDK), React, Vite, Tailwind CSS, shadcn/ui, Socket.IO, Prisma ORM.

---

## Структура проекта

```
agentforge/
├── package.json                    # Корень монорепо (npm workspaces)
├── tsconfig.base.json              # Общие настройки TS
├── docker-compose.yml              # Redis + PostgreSQL для разработки
├── .env.example                    # Шаблон переменных окружения
│
├── packages/
│   ├── shared/                     # Общие типы и контракты
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types.ts            # ProjectStatus, AgentType, Event и т.д.
│   │       └── events.ts           # Типы событий шины
│   │
│   ├── server/                     # Бэкенд
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma       # Схема БД
│   │   └── src/
│   │       ├── index.ts            # Точка входа, Express + Socket.IO
│   │       ├── routes/
│   │       │   └── projects.ts     # CRUD проектов
│   │       ├── services/
│   │       │   ├── agent-spawner.ts    # Спавн агентов в очередь
│   │       │   └── project-service.ts  # Бизнес-логика проектов
│   │       ├── agents/
│   │       │   ├── base-agent.ts       # Базовый класс агента
│   │       │   ├── pm-agent.ts         # PM-агент
│   │       │   └── coder-agent.ts      # Кодер-агент
│   │       ├── queue/
│   │       │   ├── worker.ts           # BullMQ воркер
│   │       │   └── queue.ts            # Определение очереди
│   │       └── websocket.ts            # Socket.IO события
│   │
│   └── web/                        # Фронтенд
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx                 # Роутинг
│           ├── lib/
│           │   ├── api.ts              # HTTP-клиент
│           │   └── socket.ts           # Socket.IO клиент
│           ├── components/
│           │   ├── layout.tsx          # Основной лейаут
│           │   ├── project-card.tsx    # Карточка проекта
│           │   ├── chat.tsx            # Чат с PM
│           │   ├── agent-log.tsx       # Лог агентов
│           │   └── checkpoint-modal.tsx # Контрольная точка
│           └── pages/
│               ├── home.tsx            # Список проектов
│               ├── new-project.tsx     # Создание проекта
│               └── project.tsx         # Страница проекта
```

---

## Task 1: Инициализация монорепо

**Files:**
- Create: `agentforge/package.json`
- Create: `agentforge/tsconfig.base.json`
- Create: `agentforge/.env.example`
- Create: `agentforge/.gitignore`
- Create: `agentforge/docker-compose.yml`

- [ ] **Step 1: Создать корневую папку и package.json**

```bash
mkdir -p agentforge && cd agentforge
```

```json
// agentforge/package.json
{
  "name": "agentforge",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:server": "npm run dev -w packages/server",
    "dev:web": "npm run dev -w packages/web",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:web\"",
    "build": "npm run build -w packages/shared && npm run build -w packages/server && npm run build -w packages/web",
    "test": "npm test -w packages/server"
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Создать tsconfig.base.json**

```json
// agentforge/tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Создать .env.example**

```env
# agentforge/.env.example
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentforge
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-xxx
PORT=3001
```

- [ ] **Step 4: Создать .gitignore**

```gitignore
node_modules/
dist/
.env
*.log
```

- [ ] **Step 5: Создать docker-compose.yml**

```yaml
# agentforge/docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: agentforge
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

- [ ] **Step 6: Запустить инфраструктуру и проверить**

```bash
docker-compose up -d
```

Expected: оба контейнера running.

- [ ] **Step 7: Commit**

```bash
git add agentforge/
git commit -m "feat(agentforge): init monorepo with docker-compose"
```

---

## Task 2: Пакет shared — общие типы

**Files:**
- Create: `agentforge/packages/shared/package.json`
- Create: `agentforge/packages/shared/tsconfig.json`
- Create: `agentforge/packages/shared/src/types.ts`
- Create: `agentforge/packages/shared/src/events.ts`
- Create: `agentforge/packages/shared/src/index.ts`

- [ ] **Step 1: Создать package.json**

```json
// agentforge/packages/shared/package.json
{
  "name": "@agentforge/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Создать tsconfig.json**

```json
// agentforge/packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Написать типы**

```typescript
// agentforge/packages/shared/src/types.ts

export type ProjectStatus =
  | "created"
  | "spec_in_progress"
  | "spec_review"
  | "coding_in_progress"
  | "coding_review"
  | "completed"
  | "failed";

export type AgentType = "pm" | "coder";

export type CheckpointType = "spec_approval";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  spec: string | null;
  generatedCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  role: "user" | "assistant";
  content: string;
  agentType: AgentType | null;
  createdAt: Date;
}

export interface AgentTask {
  id: string;
  projectId: string;
  agentType: AgentType;
  input: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
  output: Record<string, unknown> | null;
  createdAt: Date;
}
```

- [ ] **Step 4: Написать типы событий**

```typescript
// agentforge/packages/shared/src/events.ts

import { AgentType, ProjectStatus } from "./types";

export interface AgentProgressEvent {
  projectId: string;
  agentType: AgentType;
  message: string;
  timestamp: string;
}

export interface AgentCompletedEvent {
  projectId: string;
  agentType: AgentType;
  result: Record<string, unknown>;
  timestamp: string;
}

export interface CheckpointEvent {
  projectId: string;
  type: "spec_approval";
  data: { spec: string };
  timestamp: string;
}

export interface ProjectStatusEvent {
  projectId: string;
  status: ProjectStatus;
  timestamp: string;
}

export type ServerToClientEvents = {
  "agent:progress": (event: AgentProgressEvent) => void;
  "agent:completed": (event: AgentCompletedEvent) => void;
  "checkpoint:reached": (event: CheckpointEvent) => void;
  "project:status": (event: ProjectStatusEvent) => void;
};

export type ClientToServerEvents = {
  "project:join": (projectId: string) => void;
  "project:leave": (projectId: string) => void;
};
```

- [ ] **Step 5: Создать index.ts**

```typescript
// agentforge/packages/shared/src/index.ts
export * from "./types";
export * from "./events";
```

- [ ] **Step 6: Проверить типы**

```bash
cd agentforge && npx tsc -p packages/shared/tsconfig.json --noEmit
```

Expected: никаких ошибок.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat(agentforge): add shared types and event definitions"
```

---

## Task 3: Бэкенд — инициализация + Prisma-схема

**Files:**
- Create: `agentforge/packages/server/package.json`
- Create: `agentforge/packages/server/tsconfig.json`
- Create: `agentforge/packages/server/prisma/schema.prisma`

- [ ] **Step 1: Создать package.json**

```json
// agentforge/packages/server/package.json
{
  "name": "@agentforge/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@agentforge/shared": "*",
    "@anthropic-ai/sdk": "^0.39.0",
    "@prisma/client": "^6.4.0",
    "bullmq": "^5.34.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.0",
    "ioredis": "^5.4.2",
    "socket.io": "^4.8.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "prisma": "^6.4.0",
    "tsx": "^4.19.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Создать tsconfig.json**

```json
// agentforge/packages/server/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Создать Prisma-схему**

```prisma
// agentforge/packages/server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id            String    @id @default(uuid())
  name          String
  description   String
  status        String    @default("created")
  spec          String?   @db.Text
  generatedCode String?   @db.Text @map("generated_code")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  messages      ChatMessage[]
  tasks         AgentTask[]

  @@map("projects")
}

model ChatMessage {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  role      String
  content   String   @db.Text
  agentType String?  @map("agent_type")
  createdAt DateTime @default(now()) @map("created_at")

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("chat_messages")
}

model AgentTask {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  agentType String   @map("agent_type")
  input     Json     @default("{}")
  status    String   @default("pending")
  output    Json?
  createdAt DateTime @default(now()) @map("created_at")

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("agent_tasks")
}
```

- [ ] **Step 4: Создать .env, сгенерировать Prisma-клиент, применить миграцию**

```bash
cp .env.example .env
# вписать реальный ANTHROPIC_API_KEY в .env
cd packages/server
npx prisma generate
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 5: Commit**

```bash
git add packages/server/package.json packages/server/tsconfig.json packages/server/prisma/
git commit -m "feat(agentforge): add server package with Prisma schema"
```

---

## Task 4: Бэкенд — Express-сервер + WebSocket + маршруты проектов

**Files:**
- Create: `agentforge/packages/server/src/index.ts`
- Create: `agentforge/packages/server/src/routes/projects.ts`
- Create: `agentforge/packages/server/src/services/project-service.ts`
- Create: `agentforge/packages/server/src/websocket.ts`
- Test: `agentforge/packages/server/src/__tests__/projects.test.ts`

- [ ] **Step 1: Написать тест для CRUD проектов**

```typescript
// agentforge/packages/server/src/__tests__/projects.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const API = "http://localhost:3001/api";

describe("Projects API", () => {
  let projectId: string;

  it("POST /api/projects — creates a project", async () => {
    const res = await fetch(`${API}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test App",
        description: "A simple todo app",
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe("Test App");
    expect(data.status).toBe("created");
    projectId = data.id;
  });

  it("GET /api/projects — lists projects", async () => {
    const res = await fetch(`${API}/projects`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("GET /api/projects/:id — gets one project", async () => {
    const res = await fetch(`${API}/projects/${projectId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(projectId);
  });

  it("GET /api/projects/:id/messages — returns empty messages", async () => {
    const res = await fetch(`${API}/projects/${projectId}/messages`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

- [ ] **Step 2: Написать project-service.ts**

```typescript
// agentforge/packages/server/src/services/project-service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createProject(name: string, description: string) {
  return prisma.project.create({
    data: { name, description },
  });
}

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

export async function updateProjectStatus(id: string, status: string) {
  return prisma.project.update({
    where: { id },
    data: { status },
  });
}

export async function updateProjectSpec(id: string, spec: string) {
  return prisma.project.update({
    where: { id },
    data: { spec, status: "spec_review" },
  });
}

export async function updateProjectCode(id: string, code: string) {
  return prisma.project.update({
    where: { id },
    data: { generatedCode: code, status: "completed" },
  });
}

export async function getMessages(projectId: string) {
  return prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
}

export async function addMessage(
  projectId: string,
  role: "user" | "assistant",
  content: string,
  agentType: string | null = null
) {
  return prisma.chatMessage.create({
    data: { projectId, role, content, agentType },
  });
}
```

- [ ] **Step 3: Написать routes/projects.ts**

```typescript
// agentforge/packages/server/src/routes/projects.ts
import { Router } from "express";
import { z } from "zod";
import * as projectService from "../services/project-service.js";

const router = Router();

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

router.post("/", async (req, res) => {
  const parsed = CreateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const project = await projectService.createProject(
    parsed.data.name,
    parsed.data.description
  );
  res.status(201).json(project);
});

router.get("/", async (_req, res) => {
  const projects = await projectService.listProjects();
  res.json(projects);
});

router.get("/:id", async (req, res) => {
  const project = await projectService.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

router.get("/:id/messages", async (req, res) => {
  const messages = await projectService.getMessages(req.params.id);
  res.json(messages);
});

export default router;
```

- [ ] **Step 4: Написать websocket.ts**

```typescript
// agentforge/packages/server/src/websocket.ts
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@agentforge/shared";

let io: Server<ClientToServerEvents, ServerToClientEvents>;

export function initWebSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("project:join", (projectId) => {
      socket.join(`project:${projectId}`);
    });
    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
```

- [ ] **Step 5: Написать index.ts — точка входа**

```typescript
// agentforge/packages/server/src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import projectsRouter from "./routes/projects.js";
import { initWebSocket } from "./websocket.js";

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/projects", projectsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

initWebSocket(httpServer);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`AgentForge server running on port ${PORT}`);
});
```

- [ ] **Step 6: Установить зависимости, запустить сервер, прогнать тесты**

```bash
cd agentforge
npm install
npm run dev:server
# в другом терминале:
cd agentforge/packages/server
npx vitest run
```

Expected: все 4 теста проходят.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/
git commit -m "feat(agentforge): add Express server, project CRUD, WebSocket"
```

---

## Task 5: Бэкенд — очередь задач BullMQ + спавнер агентов

**Files:**
- Create: `agentforge/packages/server/src/queue/queue.ts`
- Create: `agentforge/packages/server/src/queue/worker.ts`
- Create: `agentforge/packages/server/src/services/agent-spawner.ts`

- [ ] **Step 1: Написать queue.ts**

```typescript
// agentforge/packages/server/src/queue/queue.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const agentQueue = new Queue("agent-tasks", { connection });

export interface AgentJob {
  projectId: string;
  agentType: "pm" | "coder";
  input: Record<string, unknown>;
}
```

- [ ] **Step 2: Написать agent-spawner.ts**

```typescript
// agentforge/packages/server/src/services/agent-spawner.ts
import { agentQueue, type AgentJob } from "../queue/queue.js";

export async function spawnAgent(job: AgentJob) {
  await agentQueue.add(`${job.agentType}-${job.projectId}`, job, {
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
  });
}
```

- [ ] **Step 3: Написать worker.ts**

```typescript
// agentforge/packages/server/src/queue/worker.ts
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { runPMAgent } from "../agents/pm-agent.js";
import { runCoderAgent } from "../agents/coder-agent.js";
import type { AgentJob } from "./queue.js";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "agent-tasks",
  async (job) => {
    const data = job.data as AgentJob;

    switch (data.agentType) {
      case "pm":
        return runPMAgent(data.projectId, data.input);
      case "coder":
        return runCoderAgent(data.projectId, data.input);
      default:
        throw new Error(`Unknown agent type: ${data.agentType}`);
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

export { worker };
```

- [ ] **Step 4: Подключить воркер к серверу**

Добавить в `agentforge/packages/server/src/index.ts` перед `httpServer.listen`:

```typescript
import "./queue/worker.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/queue/ packages/server/src/services/agent-spawner.ts packages/server/src/index.ts
git commit -m "feat(agentforge): add BullMQ queue, worker, agent spawner"
```

---

## Task 6: Бэкенд — PM-агент (Claude API)

**Files:**
- Create: `agentforge/packages/server/src/agents/base-agent.ts`
- Create: `agentforge/packages/server/src/agents/pm-agent.ts`
- Test: `agentforge/packages/server/src/__tests__/pm-agent.test.ts`

- [ ] **Step 1: Написать тест для PM-агента**

```typescript
// agentforge/packages/server/src/__tests__/pm-agent.test.ts
import { describe, it, expect } from "vitest";
import { buildPMSystemPrompt, parseSpecFromResponse } from "../agents/pm-agent.js";

describe("PM Agent", () => {
  it("builds system prompt with project description", () => {
    const prompt = buildPMSystemPrompt("todo app with auth");
    expect(prompt).toContain("todo app with auth");
    expect(prompt).toContain("спецификация");
  });

  it("parses spec from Claude response", () => {
    const response = `Вот спецификация:

<spec>
# Todo App
## Функционал
- Добавление задач
- Удаление задач
</spec>

Готово!`;
    const spec = parseSpecFromResponse(response);
    expect(spec).toContain("# Todo App");
    expect(spec).toContain("Добавление задач");
  });

  it("returns full response if no <spec> tags", () => {
    const response = "# Spec\n- feature 1\n- feature 2";
    const spec = parseSpecFromResponse(response);
    expect(spec).toBe(response);
  });
});
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
cd agentforge/packages/server && npx vitest run src/__tests__/pm-agent.test.ts
```

Expected: FAIL — модуль не найден.

- [ ] **Step 3: Написать base-agent.ts**

```typescript
// agentforge/packages/server/src/agents/base-agent.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function callClaude(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}
```

- [ ] **Step 4: Написать pm-agent.ts**

```typescript
// agentforge/packages/server/src/agents/pm-agent.ts
import { callClaude } from "./base-agent.js";
import * as projectService from "../services/project-service.js";
import { getIO } from "../websocket.js";

export function buildPMSystemPrompt(description: string): string {
  return `Ты — PM-агент платформы AgentForge. Твоя задача — получить описание идеи и создать детальную спецификацию для веб-приложения.

Описание проекта от пользователя:
${description}

Создай подробную спецификацию. Оберни итоговую спецификацию в теги <spec>...</spec>.

Спецификация должна содержать:
1. Название проекта
2. Описание и цель
3. Список страниц/экранов
4. Функциональные требования (user stories)
5. Структура данных (модели)
6. API-эндпоинты
7. Стек технологий: React + TypeScript + Tailwind CSS

Будь конкретен. Никаких TBD или TODO.`;
}

export function parseSpecFromResponse(response: string): string {
  const match = response.match(/<spec>([\s\S]*?)<\/spec>/);
  return match ? match[1].trim() : response;
}

export async function runPMAgent(
  projectId: string,
  input: Record<string, unknown>
) {
  const io = getIO();
  const description = input.description as string;

  io.to(`project:${projectId}`).emit("agent:progress", {
    projectId,
    agentType: "pm",
    message: "PM-агент анализирует идею и формирует спецификацию...",
    timestamp: new Date().toISOString(),
  });

  await projectService.updateProjectStatus(projectId, "spec_in_progress");
  io.to(`project:${projectId}`).emit("project:status", {
    projectId,
    status: "spec_in_progress",
    timestamp: new Date().toISOString(),
  });

  const response = await callClaude(buildPMSystemPrompt(description), [
    { role: "user", content: `Создай спецификацию для: ${description}` },
  ]);

  const spec = parseSpecFromResponse(response);

  await projectService.addMessage(projectId, "assistant", response, "pm");
  await projectService.updateProjectSpec(projectId, spec);

  io.to(`project:${projectId}`).emit("checkpoint:reached", {
    projectId,
    type: "spec_approval",
    data: { spec },
    timestamp: new Date().toISOString(),
  });

  io.to(`project:${projectId}`).emit("agent:completed", {
    projectId,
    agentType: "pm",
    result: { spec },
    timestamp: new Date().toISOString(),
  });

  return { spec };
}
```

- [ ] **Step 5: Запустить тесты**

```bash
npx vitest run src/__tests__/pm-agent.test.ts
```

Expected: все 3 теста проходят.

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/agents/ packages/server/src/__tests__/pm-agent.test.ts
git commit -m "feat(agentforge): add PM agent with Claude API integration"
```

---

## Task 7: Бэкенд — Кодер-агент

**Files:**
- Create: `agentforge/packages/server/src/agents/coder-agent.ts`
- Test: `agentforge/packages/server/src/__tests__/coder-agent.test.ts`

- [ ] **Step 1: Написать тест**

```typescript
// agentforge/packages/server/src/__tests__/coder-agent.test.ts
import { describe, it, expect } from "vitest";
import { buildCoderSystemPrompt, parseFilesFromResponse } from "../agents/coder-agent.js";

describe("Coder Agent", () => {
  it("builds system prompt with spec", () => {
    const prompt = buildCoderSystemPrompt("# Todo App\n- Add tasks");
    expect(prompt).toContain("# Todo App");
    expect(prompt).toContain("React");
  });

  it("parses files from response", () => {
    const response = `<file path="src/App.tsx">
import React from 'react';
export default function App() { return <div>Hello</div>; }
</file>

<file path="src/index.tsx">
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
</file>`;

    const files = parseFilesFromResponse(response);
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe("src/App.tsx");
    expect(files[0].content).toContain("Hello");
    expect(files[1].path).toBe("src/index.tsx");
  });

  it("returns empty array if no file tags", () => {
    const files = parseFilesFromResponse("no files here");
    expect(files).toEqual([]);
  });
});
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
npx vitest run src/__tests__/coder-agent.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Написать coder-agent.ts**

```typescript
// agentforge/packages/server/src/agents/coder-agent.ts
import { callClaude } from "./base-agent.js";
import * as projectService from "../services/project-service.js";
import { getIO } from "../websocket.js";

export function buildCoderSystemPrompt(spec: string): string {
  return `Ты — Кодер-агент платформы AgentForge. Твоя задача — написать полный код React-приложения по спецификации.

Спецификация:
${spec}

Правила:
1. Используй React + TypeScript + Tailwind CSS
2. Каждый файл оберни в теги: <file path="путь/к/файлу">код</file>
3. Включи ВСЕ файлы: package.json, index.html, все компоненты, стили
4. Приложение должно быть полностью рабочим после npm install && npm run dev
5. Используй Vite как сборщик
6. Пиши чистый, понятный код
7. Не используй внешние API — только фронтенд с локальным состоянием (localStorage)`;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export function parseFilesFromResponse(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const regex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match;
  while ((match = regex.exec(response)) !== null) {
    files.push({
      path: match[1],
      content: match[2].trim(),
    });
  }
  return files;
}

export async function runCoderAgent(
  projectId: string,
  input: Record<string, unknown>
) {
  const io = getIO();
  const spec = input.spec as string;

  io.to(`project:${projectId}`).emit("agent:progress", {
    projectId,
    agentType: "coder",
    message: "Кодер-агент генерирует React-приложение...",
    timestamp: new Date().toISOString(),
  });

  await projectService.updateProjectStatus(projectId, "coding_in_progress");
  io.to(`project:${projectId}`).emit("project:status", {
    projectId,
    status: "coding_in_progress",
    timestamp: new Date().toISOString(),
  });

  const response = await callClaude(buildCoderSystemPrompt(spec), [
    { role: "user", content: "Сгенерируй полный код приложения по спецификации." },
  ]);

  const files = parseFilesFromResponse(response);
  const codeBundle = JSON.stringify(files, null, 2);

  await projectService.addMessage(projectId, "assistant", response, "coder");
  await projectService.updateProjectCode(projectId, codeBundle);

  io.to(`project:${projectId}`).emit("agent:completed", {
    projectId,
    agentType: "coder",
    result: { filesCount: files.length },
    timestamp: new Date().toISOString(),
  });

  return { files };
}
```

- [ ] **Step 4: Запустить тесты**

```bash
npx vitest run src/__tests__/coder-agent.test.ts
```

Expected: все 3 теста проходят.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/agents/coder-agent.ts packages/server/src/__tests__/coder-agent.test.ts
git commit -m "feat(agentforge): add Coder agent with file generation"
```

---

## Task 8: Бэкенд — маршруты чата и запуска агентов

**Files:**
- Modify: `agentforge/packages/server/src/routes/projects.ts`

- [ ] **Step 1: Добавить эндпоинты чата и управления агентами**

Добавить в конец `routes/projects.ts`, перед `export default router`:

```typescript
import { spawnAgent } from "../services/agent-spawner.js";

// Отправить сообщение в чат проекта и запустить PM-агента
router.post("/:id/chat", async (req, res) => {
  const MessageSchema = z.object({
    message: z.string().min(1).max(10000),
  });
  const parsed = MessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const project = await projectService.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });

  const chatMessage = await projectService.addMessage(
    req.params.id,
    "user",
    parsed.data.message
  );

  // Запускаем PM-агента если проект только создан
  if (project.status === "created") {
    await spawnAgent({
      projectId: req.params.id,
      agentType: "pm",
      input: { description: `${project.description}\n\n${parsed.data.message}` },
    });
  }

  res.status(201).json(chatMessage);
});

// Утвердить контрольную точку (спеку) → запустить кодера
router.post("/:id/approve-spec", async (req, res) => {
  const project = await projectService.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  if (project.status !== "spec_review") {
    return res.status(400).json({ error: "Project is not awaiting spec approval" });
  }

  await spawnAgent({
    projectId: req.params.id,
    agentType: "coder",
    input: { spec: project.spec },
  });

  res.json({ status: "Coder agent spawned" });
});

// Отклонить спеку → вернуть статус
router.post("/:id/reject-spec", async (req, res) => {
  const project = await projectService.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });

  const FeedbackSchema = z.object({
    feedback: z.string().min(1).max(5000),
  });
  const parsed = FeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  await projectService.addMessage(req.params.id, "user", parsed.data.feedback);

  await spawnAgent({
    projectId: req.params.id,
    agentType: "pm",
    input: {
      description: project.description,
      feedback: parsed.data.feedback,
      previousSpec: project.spec,
    },
  });

  res.json({ status: "PM agent re-spawned with feedback" });
});
```

- [ ] **Step 2: Убедиться что сервер запускается**

```bash
npm run dev:server
```

Expected: `AgentForge server running on port 3001`.

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/routes/projects.ts
git commit -m "feat(agentforge): add chat, approve-spec, reject-spec endpoints"
```

---

## Task 9: Фронтенд — инициализация React + роутинг

**Files:**
- Create: `agentforge/packages/web/package.json`
- Create: `agentforge/packages/web/tsconfig.json`
- Create: `agentforge/packages/web/vite.config.ts`
- Create: `agentforge/packages/web/index.html`
- Create: `agentforge/packages/web/src/main.tsx`
- Create: `agentforge/packages/web/src/App.tsx`
- Create: `agentforge/packages/web/src/lib/api.ts`
- Create: `agentforge/packages/web/src/lib/socket.ts`

- [ ] **Step 1: Создать package.json**

```json
// agentforge/packages/web/package.json
{
  "name": "@agentforge/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@agentforge/shared": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "socket.io-client": "^4.8.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.7.0",
    "vite": "^6.1.0"
  }
}
```

- [ ] **Step 2: Создать tsconfig.json**

```json
// agentforge/packages/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Создать vite.config.ts**

```typescript
// agentforge/packages/web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
});
```

- [ ] **Step 4: Создать index.html**

```html
<!-- agentforge/packages/web/index.html -->
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AgentForge</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Создать lib/api.ts**

```typescript
// agentforge/packages/web/src/lib/api.ts
const BASE = "/api";

export async function fetchProjects() {
  const res = await fetch(`${BASE}/projects`);
  return res.json();
}

export async function fetchProject(id: string) {
  const res = await fetch(`${BASE}/projects/${id}`);
  return res.json();
}

export async function createProject(name: string, description: string) {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  return res.json();
}

export async function fetchMessages(projectId: string) {
  const res = await fetch(`${BASE}/projects/${projectId}/messages`);
  return res.json();
}

export async function sendMessage(projectId: string, message: string) {
  const res = await fetch(`${BASE}/projects/${projectId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function approveSpec(projectId: string) {
  const res = await fetch(`${BASE}/projects/${projectId}/approve-spec`, {
    method: "POST",
  });
  return res.json();
}

export async function rejectSpec(projectId: string, feedback: string) {
  const res = await fetch(`${BASE}/projects/${projectId}/reject-spec`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback }),
  });
  return res.json();
}
```

- [ ] **Step 6: Создать lib/socket.ts**

```typescript
// agentforge/packages/web/src/lib/socket.ts
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@agentforge/shared";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
});
```

- [ ] **Step 7: Создать main.tsx и App.tsx**

```tsx
// agentforge/packages/web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

```css
/* agentforge/packages/web/src/index.css */
@import "tailwindcss";
```

```tsx
// agentforge/packages/web/src/App.tsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import NewProject from "./pages/new-project";
import ProjectPage from "./pages/project";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewProject />} />
        <Route path="/project/:id" element={<ProjectPage />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add packages/web/
git commit -m "feat(agentforge): init React frontend with routing, API client, socket"
```

---

## Task 10: Фронтенд — страница списка проектов

**Files:**
- Create: `agentforge/packages/web/src/pages/home.tsx`
- Create: `agentforge/packages/web/src/components/layout.tsx`
- Create: `agentforge/packages/web/src/components/project-card.tsx`

- [ ] **Step 1: Написать layout.tsx**

```tsx
// agentforge/packages/web/src/components/layout.tsx
import { Link } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          AgentForge
        </Link>
        <Link
          to="/new"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Новый проект
        </Link>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Написать project-card.tsx**

```tsx
// agentforge/packages/web/src/components/project-card.tsx
import { Link } from "react-router-dom";
import type { Project } from "@agentforge/shared";

const statusLabels: Record<string, string> = {
  created: "Создан",
  spec_in_progress: "PM пишет спеку",
  spec_review: "Ожидает утверждения",
  coding_in_progress: "Кодер пишет код",
  completed: "Готов",
  failed: "Ошибка",
};

const statusColors: Record<string, string> = {
  created: "bg-zinc-700",
  spec_in_progress: "bg-yellow-600",
  spec_review: "bg-orange-600",
  coding_in_progress: "bg-blue-600",
  completed: "bg-green-600",
  failed: "bg-red-600",
};

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/project/${project.id}`}
      className="block border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg">{project.name}</h3>
        <span
          className={`text-xs px-2.5 py-1 rounded-full text-white ${statusColors[project.status] || "bg-zinc-700"}`}
        >
          {statusLabels[project.status] || project.status}
        </span>
      </div>
      <p className="text-zinc-400 text-sm line-clamp-2">{project.description}</p>
    </Link>
  );
}
```

- [ ] **Step 3: Написать home.tsx**

```tsx
// agentforge/packages/web/src/pages/home.tsx
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import ProjectCard from "../components/project-card";
import { fetchProjects } from "../lib/api";
import type { Project } from "@agentforge/shared";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Проекты</h2>
      {loading ? (
        <p className="text-zinc-500">Загрузка...</p>
      ) : projects.length === 0 ? (
        <p className="text-zinc-500">Нет проектов. Создайте первый!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
```

- [ ] **Step 4: Запустить и проверить**

```bash
npm run dev
```

Expected: открыть http://localhost:5173 — пустая страница с заголовком AgentForge и кнопкой "Новый проект".

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/pages/home.tsx packages/web/src/components/
git commit -m "feat(agentforge): add home page with project cards"
```

---

## Task 11: Фронтенд — создание проекта

**Files:**
- Create: `agentforge/packages/web/src/pages/new-project.tsx`

- [ ] **Step 1: Написать new-project.tsx**

```tsx
// agentforge/packages/web/src/pages/new-project.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import { createProject } from "../lib/api";

export default function NewProject() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const project = await createProject(name, description);
    navigate(`/project/${project.id}`);
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Новый проект</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Название
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мой крутой проект"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Опиши идею
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Хочу приложение для трекинга привычек с графиками и напоминаниями..."
              required
              rows={5}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !name || !description}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            {submitting ? "Создаю..." : "Создать проект"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
```

- [ ] **Step 2: Проверить в браузере**

Перейти на http://localhost:5173/new, заполнить форму, отправить — должен перекинуть на `/project/:id`.

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/pages/new-project.tsx
git commit -m "feat(agentforge): add new project page"
```

---

## Task 12: Фронтенд — страница проекта (чат + логи + контрольная точка)

**Files:**
- Create: `agentforge/packages/web/src/pages/project.tsx`
- Create: `agentforge/packages/web/src/components/chat.tsx`
- Create: `agentforge/packages/web/src/components/agent-log.tsx`
- Create: `agentforge/packages/web/src/components/checkpoint-modal.tsx`

- [ ] **Step 1: Написать chat.tsx**

```tsx
// agentforge/packages/web/src/components/chat.tsx
import { useState } from "react";
import type { ChatMessage } from "@agentforge/shared";

interface ChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function Chat({ messages, onSend, disabled }: ChatProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {msg.agentType && (
                <span className="text-xs font-medium text-zinc-400 block mb-1">
                  [{msg.agentType.toUpperCase()}]
                </span>
              )}
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Опиши свою идею подробнее..."
          disabled={disabled}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Написать agent-log.tsx**

```tsx
// agentforge/packages/web/src/components/agent-log.tsx

interface LogEntry {
  agentType: string;
  message: string;
  timestamp: string;
}

export default function AgentLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Логи агентов
      </h3>
      {entries.length === 0 ? (
        <p className="text-xs text-zinc-600">Пока пусто</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => (
            <div key={i} className="text-xs">
              <span className="text-zinc-500">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>{" "}
              <span className="text-blue-400 font-medium">
                [{entry.agentType.toUpperCase()}]
              </span>{" "}
              <span className="text-zinc-300">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Написать checkpoint-modal.tsx**

```tsx
// agentforge/packages/web/src/components/checkpoint-modal.tsx
import { useState } from "react";

interface CheckpointModalProps {
  spec: string;
  onApprove: () => void;
  onReject: (feedback: string) => void;
}

export default function CheckpointModal({
  spec,
  onApprove,
  onReject,
}: CheckpointModalProps) {
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-zinc-800">
          <h2 className="text-lg font-bold">Контрольная точка: спецификация</h2>
          <p className="text-sm text-zinc-400 mt-1">
            PM-агент сформировал спецификацию. Проверьте и утвердите.
          </p>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono bg-zinc-950 rounded-lg p-4">
            {spec}
          </pre>
        </div>
        <div className="p-5 border-t border-zinc-800">
          {showFeedback ? (
            <div className="space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Что исправить..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 resize-none focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onReject(feedback)}
                  disabled={!feedback.trim()}
                  className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Отправить на доработку
                </button>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="text-zinc-400 hover:text-zinc-200 px-4 py-2 text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onApprove}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Утвердить — запустить кодера
              </button>
              <button
                onClick={() => setShowFeedback(true)}
                className="border border-zinc-600 hover:border-zinc-500 text-zinc-300 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Вернуть на доработку
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Написать project.tsx — основная страница проекта**

```tsx
// agentforge/packages/web/src/pages/project.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layout";
import Chat from "../components/chat";
import AgentLog from "../components/agent-log";
import CheckpointModal from "../components/checkpoint-modal";
import { fetchProject, fetchMessages, sendMessage, approveSpec, rejectSpec } from "../lib/api";
import { socket } from "../lib/socket";
import type { Project, ChatMessage, AgentProgressEvent, CheckpointEvent } from "@agentforge/shared";

interface LogEntry {
  agentType: string;
  message: string;
  timestamp: string;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [checkpoint, setCheckpoint] = useState<{ spec: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [proj, msgs] = await Promise.all([fetchProject(id), fetchMessages(id)]);
    setProject(proj);
    setMessages(msgs);
    if (proj.status === "spec_review" && proj.spec) {
      setCheckpoint({ spec: proj.spec });
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!id) return;
    socket.connect();
    socket.emit("project:join", id);

    socket.on("agent:progress", (event: AgentProgressEvent) => {
      setLogs((prev) => [...prev, event]);
    });

    socket.on("checkpoint:reached", (event: CheckpointEvent) => {
      setCheckpoint({ spec: event.data.spec });
      loadData();
    });

    socket.on("agent:completed", () => {
      loadData();
    });

    socket.on("project:status", (event) => {
      setProject((prev) => (prev ? { ...prev, status: event.status } : prev));
    });

    return () => {
      socket.emit("project:leave", id);
      socket.off("agent:progress");
      socket.off("checkpoint:reached");
      socket.off("agent:completed");
      socket.off("project:status");
      socket.disconnect();
    };
  }, [id, loadData]);

  async function handleSend(message: string) {
    if (!id) return;
    await sendMessage(id, message);
    await loadData();
  }

  async function handleApprove() {
    if (!id) return;
    await approveSpec(id);
    setCheckpoint(null);
    await loadData();
  }

  async function handleReject(feedback: string) {
    if (!id) return;
    await rejectSpec(id, feedback);
    setCheckpoint(null);
    await loadData();
  }

  if (!project) return <Layout><p className="text-zinc-500">Загрузка...</p></Layout>;

  const chatDisabled = project.status !== "created";
  const showCode = project.status === "completed" && project.generatedCode;

  return (
    <Layout>
      {checkpoint && (
        <CheckpointModal
          spec={checkpoint.spec}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 h-[calc(100vh-120px)]">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold mb-1">{project.name}</h2>
          <p className="text-sm text-zinc-400 mb-4">{project.description}</p>

          {showCode ? (
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Сгенерированный код
              </h3>
              <pre className="text-xs text-zinc-300 bg-zinc-950 rounded-lg p-4 whitespace-pre-wrap font-mono overflow-auto">
                {project.generatedCode}
              </pre>
            </div>
          ) : (
            <div className="flex-1">
              <Chat
                messages={messages}
                onSend={handleSend}
                disabled={chatDisabled}
              />
            </div>
          )}
        </div>

        <div className="border-l border-zinc-800 pl-6 overflow-y-auto">
          <AgentLog entries={logs} />
        </div>
      </div>
    </Layout>
  );
}
```

- [ ] **Step 5: Проверить полный флоу в браузере**

1. Открыть http://localhost:5173
2. Создать проект
3. Написать сообщение в чат → PM-агент должен сформировать спеку
4. Утвердить спеку → кодер генерирует код
5. Увидеть результат на странице проекта

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/
git commit -m "feat(agentforge): add project page with chat, agent logs, checkpoint modal"
```

---

## Task 13: End-to-end проверка и финальная чистка

**Files:**
- Modify: при необходимости любые файлы

- [ ] **Step 1: Запустить всё**

```bash
cd agentforge
docker-compose up -d          # PostgreSQL + Redis
npm install                    # все зависимости
cd packages/server && npx prisma db push && cd ../..
npm run dev                    # сервер + фронтенд
```

- [ ] **Step 2: Прогнать все тесты**

```bash
cd packages/server && npx vitest run
```

Expected: все тесты проходят (PM-agent: 3, Coder-agent: 3, Projects API: 4).

- [ ] **Step 3: Проверить полный флоу вручную**

1. Создать проект "Todo App" с описанием "Приложение для списка задач с категориями"
2. Отправить сообщение в чат → дождаться спеки от PM
3. Утвердить спеку → дождаться кода от кодера
4. Увидеть JSON с файлами на странице проекта

- [ ] **Step 4: Исправить найденные баги (если есть)**

- [ ] **Step 5: Финальный commit**

```bash
git add -A
git commit -m "feat(agentforge): MVP phase 1 complete — PM + Coder agents, web dashboard"
```
