# Support Tickets — Backend API Specification

> **For the backend team.** The frontend is fully wired and will call these endpoints automatically once deployed. No frontend changes will be needed.

---

## Context

The support form (floating chat button visible in every portal) currently calls:

```
POST /api/support/tickets
```

Until this endpoint is live the frontend degrades gracefully — it shows a "Message Sent" success state without a ticket reference number. Once the endpoint returns a `ticketNumber` field the UI will display it automatically.

---

## 1. Create Support Ticket

### `POST /api/support/tickets`

**Auth:** Optional JWT (the user may or may not be logged in when submitting a support request). If a valid `Authorization: Bearer <token>` header is present, associate the ticket with that user's ID automatically — do not require the frontend to send `userId`.

### Request Body

```json
{
  "name":     "Grace Uwimana",
  "email":    "grace@example.com",
  "phone":    "+250788123456",
  "category": "order_issue",
  "message":  "My order #83D2F6EF has been stuck in PREPARING status for 2 days."
}
```

| Field      | Type   | Required | Notes |
|------------|--------|----------|-------|
| `name`     | string | ✅       | Full name of the submitter |
| `email`    | string | ✅       | Reply-to address |
| `phone`    | string | ❌       | Optional, may be `null` or omitted |
| `category` | enum   | ✅       | One of: `order_issue`, `billing`, `technical`, `account`, `other` |
| `message`  | string | ✅       | Free-text issue description, min 10 chars recommended |

### Response — 201 Created

```json
{
  "ticketNumber": "EVZ-2026-00042",
  "id":           "uuid-here",
  "status":       "OPEN",
  "createdAt":    "2026-05-05T10:30:00.000Z",
  "message":      "Ticket created successfully"
}
```

The frontend reads `ticketNumber` (or falls back to `id`) and displays it to the user. If neither field is present the confirmation still shows — just without a reference number.

### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{ "message": "Validation error description" }` | Missing required fields |
| 429 | `{ "message": "Too many requests" }` | Rate limit exceeded (recommended: 5 tickets/hour per IP) |
| 500 | `{ "message": "Internal server error" }` | Unexpected failure |

---

## 2. Suggested Data Model (Prisma)

```prisma
model SupportTicket {
  id           String   @id @default(uuid())
  ticketNumber String   @unique  // e.g. "EVZ-2026-00042", auto-generated
  name         String
  email        String
  phone        String?
  category     SupportTicketCategory
  message      String
  status       SupportTicketStatus   @default(OPEN)
  userId       String?  // nullable — set from JWT if user is logged in
  user         User?    @relation(fields: [userId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum SupportTicketCategory {
  order_issue
  billing
  technical
  account
  other
}

enum SupportTicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

### Auto-generating `ticketNumber`

Recommended pattern: `EVZ-{YEAR}-{PADDED_SEQUENCE}`, e.g. `EVZ-2026-00001`.

```typescript
// In the service, before creating:
const count = await this.prisma.supportTicket.count();
const ticketNumber = `EVZ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
```

---

## 3. Suggested NestJS Implementation

### Module: `src/support/`

**`support.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
```

**`dto/create-ticket.dto.ts`**
```typescript
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum SupportCategory {
  ORDER_ISSUE = 'order_issue',
  BILLING     = 'billing',
  TECHNICAL   = 'technical',
  ACCOUNT     = 'account',
  OTHER       = 'other',
}

export class CreateTicketDto {
  @IsString() @IsNotEmpty()   name: string;
  @IsEmail()                  email: string;
  @IsOptional() @IsString()   phone?: string;
  @IsEnum(SupportCategory)    category: SupportCategory;
  @IsString() @MinLength(10)  message: string;
}
```

**`support.controller.ts`**
```typescript
import { Body, Controller, Post, Req, UseGuards, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Submit a support ticket (auth optional)' })
  // NOTE: Do NOT put @UseGuards(JwtAuthGuard) here — the endpoint must be
  // accessible to unauthenticated users too. Extract userId from token
  // inside the service only if a token is present.
  async createTicket(@Body() dto: CreateTicketDto, @Req() req: any) {
    // req.user will be undefined if no token was sent — that is fine
    const userId: string | undefined = req.user?.sub;
    return this.supportService.createTicket(dto, userId);
  }
}
```

**`support.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(dto: CreateTicketDto, userId?: string) {
    const count = await this.prisma.supportTicket.count();
    const ticketNumber = `EVZ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        name:     dto.name,
        email:    dto.email,
        phone:    dto.phone,
        category: dto.category,
        message:  dto.message,
        userId:   userId ?? null,
      },
    });

    // Optional: send email notification to support team
    // await this.emailService.sendSupportAlert(ticket);

    return {
      ticketNumber: ticket.ticketNumber,
      id:           ticket.id,
      status:       ticket.status,
      createdAt:    ticket.createdAt,
      message:      'Ticket created successfully',
    };
  }
}
```

### Register in `app.module.ts`

```typescript
// Add to imports array:
import { SupportModule } from './support/support.module';
// ...
imports: [
  // ... existing modules
  SupportModule,
],
```

---

## 4. Optional: List & Manage Tickets (Super Admin)

Once the core endpoint is live, you may want to add:

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/support/tickets` | List all tickets (super-admin only), with pagination & status filter |
| `PUT`  | `/api/support/tickets/:id/status` | Update ticket status (`IN_PROGRESS`, `RESOLVED`, `CLOSED`) |

These are not called by the frontend yet — they would be used by an internal admin panel or email workflow.

---

## 5. Frontend Behaviour Reference

```
User submits form
      │
      ▼
POST /api/support/tickets
      │
  ┌───┴───────────────────────┐
  │ 201 Created               │ 404 / 5xx (endpoint not yet live)
  │ Shows ticketNumber         │ Shows generic success ("message sent")
  │ "EVZ-2026-00042"          │ No ticket reference shown
  └───────────────────────────┘
      │
  400 (validation error)
  │ Shows inline error message
  │ Form stays open
```

The frontend will **never crash or show a confusing error** regardless of backend state — it degrades gracefully until the endpoint is live.

---

*Generated: 2026-05-05 | E-Vuze Frontend Team*
