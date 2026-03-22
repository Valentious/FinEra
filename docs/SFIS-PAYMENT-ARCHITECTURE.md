# SFIS Multi-Ledger Payment Architecture

**Document Version:** 1.0  
**Classification:** Internal – System Design  
**Scope:** Deposits, Withdrawals, and Ledger Reconciliation  
**Regions:** Zimbabwe, South Africa, SADC Corridor

---

## Executive Summary

This document defines a **real-world, implementable** payment and transaction architecture for the Sustainable Financial Inclusion System (SFIS) across four ledger types: **ZiG**, **USD**, **ZAR**, and **Custodian**. Each ledger has distinct payment rails, regulatory boundaries, and operational logic aligned with Zimbabwe and South African market realities.

---

## Table of Contents

1. [ZiG Account](#1-zig-account)
2. [USD Account](#2-usd-account)
3. [ZAR Account](#3-zar-account)
4. [Custodian Ledger](#4-custodian-ledger)
5. [Cross-Currency & Innovation Layer](#5-cross-currency--innovation-layer)
6. [Flow Separation & Controls](#6-flow-separation--controls)
7. [Same Gateway ≠ Same Logic](#7-same-gateway--same-logic-critical)
8. [Aggregator Layer](#8-aggregator-layer-very-important)
9. [Final Structure](#9-final-structure-system-vision)

---

## 1. ZiG Account

**Purpose:** Local Zimbabwe currency; RBZ-regulated; domestic-only flows.  
**Settlement Currency:** ZiG (Zimbabwe Gold)  
**Strength:** Mass market / Local liquidity

### 1.1 DEPOSIT GATEWAYS (ZiG)

| Gateway | Rail | Notes |
|---------|------|-------|
| **Cardless ATM** | Zimswitch / Bank ATM cash-in | Bank-linked; instant ZiG credit |
| **EcoCash** | MoMo API / USSD | Primary retail; dominates market |
| **OneMoney** | MoMo API | Econet; redundancy |
| **Innbucks / O'mari** | MoMo API | Multi-operator coverage |
| **ZIPIT** | Bank-to-bank instant transfer | Instant ZiG; CBZ, Stanbic, FBC, etc. |
| **RTGS** | High-value transfers | Corporate; same-day finality |
| **Paynow / VPayments** | Aggregator gateway | One API → multiple rails |
| **Mukuru** | Local cash-in / remittance (ZiG payout) | Diaspora → ZiG wallet |
| **Bank Deposit** | CBZ, Steward, FBC, etc. | Teller / branch cash-in |

**📌 Reality:** Mobile money + ZIPIT dominate local payments.

### 1.2 WITHDRAWAL GATEWAYS (ZiG)

| Gateway | Rail | Notes |
|---------|------|-------|
| **Cardless ATM** | Zimswitch / Bank ATM cash-out | Withdraw from ZiG balance |
| **EcoCash** | Cash-out agents | Agent network; near-instant |
| **OneMoney** | Agents | Econet agent network |
| **Innbucks** | Agents | Cash-out at agent |
| **ZIPIT** | To bank → withdraw at ATM | Bank account credit → ATM |
| **Bank teller** | Branch withdrawal | Over-counter cash |
| **Merchant cash-out** | POS cashback | Pay at merchant; get cash change |

---

### 1.3 Gateway Mapping (Operational)

#### DEPOSIT GATEWAYS

| Gateway | Flow | Settlement | Risk |
|---------|------|------------|------|
| **EcoCash / OneMoney / InnBucks** | User → MoMo wallet → FinEra ZiG (API) | Near-instant | Liquidity if nostro low |
| **ZIPIT** | User bank → ZIPIT → FinEra bank | Same-day (T+0) | Bank downtime |
| **RTGS** | User bank → RTGS → FinEra bank | Same-day | Operational cutoff times |
| **Cardless ATM** | User → ATM → Zimswitch → FinEra | Same-day | ATM limits |
| **Paynow / VPayments** | Aggregator → EcoCash/ZIPIT/Card | Per sub-rail | Aggregator dependency |
| **Mukuru (ZiG)** | Sender → Mukuru → Partner API → ZiG | 15–60 min | **Local payout logic** |
| **Bank Deposit** | Cash at teller → FinEra nostro | Same-day | Branch hours |

#### WITHDRAWAL GATEWAYS

| Gateway | Flow | Settlement | Risk |
|---------|------|------------|------|
| **EcoCash / OneMoney / InnBucks** | FinEra ZiG → API → User MoMo | Near-instant | Agent liquidity |
| **ZIPIT** | FinEra bank → ZIPIT → User bank | Same-day | Cutoff times |
| **RTGS** | FinEra bank → RTGS → User bank | Same-day | Same as deposit |
| **Cardless ATM** | FinEra → Zimswitch → ATM network | Same-day | ATM float |
| **Bank teller** | FinEra → Branch → Cash | Same-day | Branch hours |
| **Merchant cash-out** | FinEra → POS → Cashback to user | Near-instant | Merchant limits |

---

### 1.3 ZiG Deposit Flow (Example: EcoCash)

```
User                    FinEra SFIS                EcoCash
  |                         |                          |
  |--(1) Initiate deposit-->|                          |
  |   (amount, phone)        |--(2) Request MoMo API-->|
  |                         |   (debit user MoMo)      |
  |                         |<-(3) Debit confirmed-----|
  |                         |                          |
  |                         |--(4) Credit ZiG Ledger---|
  |<-(5) Receipt / SMS------|     (internal)           |
  |                         |                          |
  |                    [SETTLEMENT]                   |
  |              EcoCash nostro ↔ FinEra nostro       |
  |              (batch, typically T+0/T+1)           |
```

---

### 1.4 ZiG Withdrawal Flow (Example: EcoCash)

```
User                    FinEra SFIS                EcoCash
  |                         |                          |
  |--(1) Request withdraw-->|                          |
  |   (amount, phone)       |--(2) Debit ZiG Ledger---|
  |                         |   (balance check)       |
  |                         |--(3) Credit MoMo API--->|
  |                         |   (credit user MoMo)     |
  |                         |<-(4) Credit confirmed----|
  |<-(5) Cash-out at agent--|                          |
  |     or wallet credit    |                          |
```

---

### 1.5 ZiG Operational Risks

| Risk | Mitigation |
|------|------------|
| **Liquidity** | Maintain ZiG nostro; real-time balance monitoring; limits |
| **RBZ regulation** | KYC/AML; transaction limits; RBZ reporting |
| **EcoCash dependency** | Multi-MoMo (OneMoney, InnBucks) for redundancy |
| **Agent fraud** | Agent KYC; limits; transaction monitoring; audit trail |
| **Rate volatility** | ZiG is domestic; no FX for pure ZiG flows |

---

## 2. USD Account

**Purpose:** Foreign currency wallet; nostro-backed; forex-compatible rails only.  
**Settlement Currency:** USD (FCA / nostro)  
**Strength:** Value storage / Stability

### 2.1 DEPOSIT GATEWAYS (USD)

| Gateway | Rail | Notes |
|---------|------|-------|
| **Visa / Mastercard** | International cards | Cross-border; USD settlement |
| **SWIFT** | International bank transfer | Nostro-to-nostro; corporates |
| **WorldRemit / Western Union** | Remittance partners | USD inflows |
| **Bank FCA transfer** | Local USD accounts (CBZ, Stanbic) | Domestic nostro pool |
| **Payoneer / Wise** | Virtual accounts (semi-supported) | Diaspora freelancers |
| **EcoCash FCA wallet** | USD side of EcoCash | FCY mobile wallet |
| **SADC RTGS** | Regional USD/FCY | SA ↔ ZW corporate |

**Reality:** Cards + remittance dominate USD inflows in Zimbabwe.

### 2.2 WITHDRAWAL GATEWAYS (USD)

| Gateway | Rail | Notes |
|---------|------|-------|
| **Cash withdrawal** | Bank USD FCA (teller) | Over-counter USD |
| **Visa/Mastercard spend** | Linked card | Merchant payments |
| **SWIFT outward** | International transfer | Nostro to beneficiary |
| **Mukuru cash pickup** | USD payout | Forex payout logic |
| **Western Union payout** | Partner network | Cash pickup |
| **EcoCash USD wallet** | USD wallet to cash-out | FCY MoMo |
| **POS swipe** | USD merchant payments | Card-linked |
| **SADC RTGS** | Outward to regional | Corporate |

**Excluded from USD:** Pure ZiG rails (ZIPIT ZiG, EcoCash ZiG), ZAR-only EFT.

---

### 2.3 Gateway Mapping (Operational)

#### DEPOSIT GATEWAYS

| Gateway | Flow | Settlement | Risk |
|---------|------|------------|------|
| **SWIFT Inward** | Overseas → Nostro bank → FinEra USD | T+1–T+3 | Nostro availability |
| **Mukuru / WorldRemit / WU (USD)** | Partner API → nostro | 15 min–2 hrs | **Forex deposit logic** |
| **Card (Visa/MC USD)** | Card → Acquirer → Scheme → Nostro | T+1–T+2 | Chargebacks |
| **Bank FCA transfer** | Another bank → FinEra nostro | Same-day | Cutoff times |
| **Payoneer / Wise** | API → nostro (semi-supported) | T+1–T+2 | Partner terms |
| **EcoCash FCA** | MoMo USD API → nostro | Near-instant | Liquidity |
| **SADC RTGS** | Regional → nostro | Same-day | Operational |

#### WITHDRAWAL GATEWAYS

| Gateway | Flow | Settlement | Risk |
|---------|------|------------|------|
| **Cash withdrawal** | FinEra → Bank teller → USD cash | Same-day | Branch float |
| **Visa/MC spend** | FinEra → Card network → Merchant | T+1 | Card limits |
| **SWIFT Outward** | FinEra → Nostro → SWIFT | T+1–T+3 | Nostro liquidity |
| **Mukuru / WU (USD)** | FinEra → Partner API → cash pickup | 15 min–2 hrs | **Forex payout logic** |
| **EcoCash USD** | FinEra → EcoCash FCA API | Near-instant | Agent liquidity |
| **POS swipe** | FinEra → Card → Merchant | T+1 | Scheme limits |

---

### 2.3 USD Deposit Flow (Example: Mukuru Remittance)

```
Sender (Diaspora)     Mukuru         FinEra SFIS         Nostro Bank
       |                |                  |                    |
       |--(1) Send USD->|                  |                    |
       |                |--(2) Partner API->|                    |
       |                |   (credit FinEra) |--(3) Nostro credit->|
       |                |                  |<-(4) Confirmed------|
       |                |                  |--(5) Credit USD-----|
       |                |                  |     Ledger          |
       |                |<-(6) Receipt-----|                    |
```

---

### 2.4 USD Operational Risks

| Risk | Mitigation |
|------|------------|
| **Nostro liquidity** | RBZ allocation; nostro monitoring; SWIFT cutoff management |
| **RBZ FCY rules** | Authorised dealer licence; FCY returns; limits |
| **Partner dependency** | Multiple remittance partners; SLA monitoring |
| **Fraud (card)** | 3DS; velocity checks; fraud scoring |

---

## 3. ZAR Account

**Purpose:** South African Rand; regional SADC flows; Zimbabwe ↔ SA corridor.  
**Settlement Currency:** ZAR  
**Strength:** Cross-border engine / Growth (STRATEGIC ACCOUNT)

### 3.1 DEPOSIT GATEWAYS (ZAR)

| Gateway | Rail | Notes |
|---------|------|-------|
| **EFT** | South African bank transfer | Batch; bulk settlement |
| **Instant EFT** | Ozow, Stitch, PayFast | Real-time EFT; retail |
| **Mukuru** | SA to Zim corridor | Cross-border remittance logic |
| **Mama Money** | Remittance partner | SA to ZW corridor |
| **Hello Paisa** | Remittance partner | Migrant worker flows |
| **Shoprite / Boxer** | Retail cash-in | Remittance at retail |
| **Card payments** | SA-issued Visa/Mastercard | ZAR settlement |
| **SADC RTGS** | Regional transfers | SA to ZW corporate |
| **Agent-based Rand cash-in** | SA workers at agent | Innovation layer |

**Reality:** SA uses EFT plus Instant EFT heavily. Remittances dominate ZAR to Zimbabwe flows.

### 3.2 WITHDRAWAL GATEWAYS (ZAR)

| Gateway | Rail | Notes |
|---------|------|-------|
| **EFT to SA bank** | FinEra to user SA account | Same-day |
| **Instant EFT payout** | Ozow / Stitch rails | Same-day |
| **Mukuru cash pickup** | Zimbabwe side | Cross-border remittance logic |
| **Hello Paisa payout** | Partner network | Cash pickup |
| **Retail cash pickup** | Shoprite, Boxer | ZAR payout |
| **Convert ZAR to USD** | Withdraw locally (bridging) | FX conversion |
| **Card spend** | ZAR-linked card (if exists) | Merchant payments |

### 3.3 Payment Gateways – ZAR Ledger (Operational)

| Gateway Type | Provider(s) | Rail | Why Fit | Real Usage SA/ZW |
|--------------|-------------|------|---------|------------------|
| **Instant EFT** | Ozow, Stitch, Peach Payments | Real-time EFT | Retail; instant settlement | SA eCommerce, apps |
| **EFT / NEFT** | Banks | Batch EFT | Bulk; batch settlement | Salaries, bills |
| **RTC (Real-Time Clearing)** | Banks, Stitch | Same-day clearing | Fast clearing | P2P, B2B |
| **SADC RTGS** | SARB | Cross-border ZAR | SA ↔ ZW/regional | Corporate, trade |
| **Mukuru / Mama Money** | Remittance partners | API | ZAR remittance SA↔ZW | Migrant workers |
| **PayFast / Peach** | SA payment gateways | Card + EFT | Online ZAR | eCommerce |
| **Agent / Cash** | Mukuru agents, bank branches | Cash-in / Cash-out | Unbanked | SA townships, ZW border |

---

### 3.4 Gateway Mapping – ZAR Account (Operational)

#### DEPOSIT GATEWAYS

| Gateway | Flow | Settlement | Risk |
|---------|------|------------|------|
| **Ozow / Stitch EFT** | User bank → Ozow/Stitch → FinEra ZAR | Instant / same-day | Bank downtime |
| **Peach Payments** | Card/EFT → Peach → FinEra | T+0–T+1 | Gateway SLA |
| **SADC RTGS Inward** | SA bank → SADC RTGS → FinEra nostro | Same-day | Operational |
| **Mukuru ZAR** | Sender SA → Mukuru → FinEra API | 15 min–1 hr | Partner limits |
| **Agent ZAR cash-in** | Cash → Agent → nostro → ledger | Same-day | Agent fraud |

#### WITHDRAWAL GATEWAYS

| Gateway | Flow | Settlement | Risk |
|---------|------|------------|------|
| **Ozow / Stitch** | FinEra → Ozow/Stitch → User bank | Same-day | Scheme limits |
| **SADC RTGS Outward** | FinEra → SADC RTGS → Beneficiary | Same-day | Cutoff |
| **Mukuru ZAR payout** | FinEra → Mukuru → Cash pickup / bank | 15 min–1 hr | Agent liquidity |
| **Agent ZAR cash-out** | FinEra → Agent → Cash to user | Same-day | Float, fraud |

---

### 3.5 ZAR Innovation Layer (YOUR EDGE – Low-Cost ZW ↔ SA)

#### 3.5.1 Informal + Formal Hybrids

```
Informal (Cash)          Formal (Ledger)
      |                         |
  Agent cash-in  ------>  ZAR Ledger (FinEra)
  (Mukuru agent,         |
   border agent)         |------> EFT / Stitch payout (SA)
                         |------> Cash pickup (ZW)
                         |------> Mobile money (future)
```

**Concept:** User deposits cash at agent (informal) → Agent credits ZAR ledger via API (formal) → User can withdraw via EFT, cash pickup, or future MoMo.

#### 3.5.2 Agent-Assisted Deposits / Withdrawals

| Model | Deposit | Withdrawal | Use Case |
|-------|---------|-----------|----------|
| **Mukuru-style** | Cash → Agent → API → Ledger | Ledger → API → Cash pickup | Migrant workers |
| **Voucher-based** | Buy voucher → Redeem code → Ledger | Ledger → Voucher code → Cash | Unbanked |
| **Cash pickup** | Remittance → Ledger | Ledger → Payout at partner location | Cross-border |

#### 3.5.3 Smart Routing (Cheapest Rail)

```
                    [Incoming ZAR]
                          |
            +-------------+-------------+
            |             |             |
       Ozow (low fee)  Stitch (mid)   EFT (batch, cheap)
            |             |             |
            +------+------+------+------+
                   |
            [Route by: amount, time, cost]
                   |
            FinEra ZAR Ledger
```

**Logic:**
- Small, instant: Ozow / Stitch
- Large, batch: EFT
- Cross-border: SADC RTGS vs Mukuru (compare cost)

#### 3.5.4 Currency Bridging (ZAR ↔ USD ↔ ZiG)

| Bridge | Rail | Typical Use |
|--------|------|-------------|
| **ZAR → USD** | SADC RTGS / nostro; FX rate | SA corporate → ZW USD |
| **ZAR → ZiG** | RBZ rate; nostro; MoMo | Remittance payout in ZiG |
| **USD → ZAR** | Nostro; FX; SADC | ZW USD holder → SA ZAR |
| **ZiG → ZAR** | RBZ rate; nostro; restricted | Limited; regulatory constraints |

---

#### 3.5.5 ZAR Innovation: Voucher System

| Model | Flow | Use Case |
|-------|------|----------|
| **Buy in SA, redeem in Zim** | Purchase voucher in ZAR (SA) → Code → Redeem in ZiG/USD (ZW) | Migrant workers; unbanked |
| **Agent voucher** | Agent sells voucher → User redeems at FinEra | Cash-in without bank |
| **ZAR to USD to ZiG** | Smart conversion routing | Lowest-fee corridor |

### 3.6 ZAR Operational Risks

| Risk | Mitigation |
|------|------------|
| **Cross-border regulation** | SARB, RBZ compliance; SADC agreements |
| **Agent fraud** | Agent KYC; limits; monitoring |
| **Partner dependency** | Multi-provider (Ozow, Stitch, Peach, Mukuru) |
| **FX (ZAR/USD/ZiG)** | Hedging; rate source; RBZ alignment |

---

## 4. Custodian Ledger

**Purpose:** Internal trust / pooled / reconciliation ledger. No direct external payment gateways.  
**Settlement:** Internal only; all external flows settle INTO or OUT OF this ledger.  
**Strength:** Control / Core engine

### 4.0 NO DIRECT EXTERNAL GATEWAYS – INTERNAL CONNECTIONS ONLY

- All deposits FIRST land here  
- All withdrawals originate here  
- Connected to: ZiG ledger, USD ledger, ZAR ledger

### 4.1 Role of the Custodian Ledger

- **Pooled funds:** Bank nostro, MoMo nostro, partner balances.
- **Reconciliation:** Match external settlement to internal ledger entries.
- **Disbursement control:** All payouts originate from Custodian after checks.
- **Audit trail:** Immutable record of all movements.

### 4.2 Internal Operations

| Operation | Description |
|-----------|-------------|
| **Settlement pooling** | Bank accounts / trust accounts; aggregate across gateways |
| **Liquidity management** | Float allocation; nostro monitoring; limits per currency |
| **Reconciliation engine** | Match external reports to ledger; exception handling |
| **FX conversion engine** | ZAR ↔ USD ↔ ZiG; RBZ rate; nostro bridges |
| **Audit + compliance tracking** | Immutable log; regulatory reports; AML/KYC flags |

### 4.3 External Settlement → Custodian

```
External Gateway                Custodian Ledger
(EcoCash, SWIFT, Ozow, etc.)         |
         |                            |
         |-- Settlement event ------->|
         |   (e.g. nostro credit)     |
         |                            |-- Allocate to:
         |                            |   • ZiG Ledger
         |                            |   • USD Ledger
         |                            |   • ZAR Ledger
         |                            |
         |<-- Reconciliation confirm--|
```

### 4.4 Fund Pooling Structure

```
+------------------+     +------------------+     +------------------+
|   ZiG Pool       |     |   USD Pool       |     |   ZAR Pool       |
| (RBZ nostro)     |     | (FCY nostro)     |     | (SARB nostro)    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                       |                       |
         +-----------------------+-----------------------+
                                 |
                    +------------+------------+
                    |  CUSTODIAN LEDGER       |
                    |  (Internal only)        |
                    |  • Recon engine         |
                    |  • Disbursement rules   |
                    |  • Float management     |
                    +-------------------------+
```

### 4.5 Reconciliation Logic

| Step | Action |
|------|--------|
| 1 | External gateway sends settlement report (file/API) |
| 2 | Custodian matches: external ref ↔ internal transaction ID |
| 3 | If match: mark reconciled; update pool balance |
| 4 | If mismatch: flag for manual review; hold allocation |
| 5 | End-of-day: run reconciliation; generate exception report |
| 6 | Audit: all movements logged with timestamp, user, gateway |

### 4.6 Disbursement Controls

| Control | Description |
|---------|-------------|
| **Dual authorisation** | Large payouts require 2 approvers |
| **Velocity limits** | Max X per day per user, per gateway |
| **Whitelist** | Approved beneficiary accounts |
| **Cooling-off** | New beneficiaries: delay before first payout |
| **Audit log** | Every disbursement: who, when, amount, gateway |

### 4.7 Audit Trail Design

```
Event ID | Timestamp | Ledger | Type | Amount | Currency | Gateway | Ref | Status
---------|-----------|--------|------|--------|----------|---------|-----|-------
E001     | 2025-03-22T10:00 | ZiG  | DEP   | 100   | ZiG     | EcoCash | TX123 | Reconciled
E002     | 2025-03-22T10:05 | USD  | WDL   | 50    | USD     | SWIFT   | OUT456 | Pending
...
```

---

## 5. Cross-Currency & Innovation Layer

### 5.1 Deposit vs Withdrawal Gateways (Summary)

| Ledger | Deposit Gateways | Withdrawal Gateways |
|--------|------------------|---------------------|
| **ZiG** | EcoCash, OneMoney, ZIPIT, RTGS, Card, Agent, Remittance (ZiG) | EcoCash, ZIPIT, RTGS, ATM, Agent |
| **USD** | SWIFT, Remittance, Card, Nostro, SADC RTGS, Agent | SWIFT, Remittance, Nostro, ATM, Agent |
| **ZAR** | Ozow, Stitch, Peach, SADC RTGS, Mukuru, Agent | Ozow, Stitch, SADC RTGS, Mukuru, Agent |
| **Custodian** | N/A (internal only) | N/A |

### 5.2 Internal Ledger Transfers vs External

| Flow Type | Example | Treatment |
|-----------|---------|-----------|
| **Internal** | ZiG → USD (FX conversion) | Custodian mediates; no external rail |
| **Internal** | USD → ZAR (FX conversion) | Same |
| **External** | User deposits via EcoCash → ZiG | EcoCash = external; settles to Custodian |
| **External** | User withdraws USD via SWIFT | SWIFT = external; debits from Custodian |

### 5.3 Cross-Currency Flows

| Flow | Rail | Notes |
|------|------|-------|
| **USD → ZiG** | RBZ rate; nostro; MoMo | Remittance payout; rate from RBZ |
| **ZAR → USD** | FX; nostro; SADC | Corporate; regulatory limits |
| **ZiG → ZAR** | RBZ rate; nostro | Limited; RBZ approval |
| **ZAR → ZiG** | RBZ rate; nostro | Remittance; common |

---

## 6. Flow Separation & Controls

### 6.1 Principle: No Cross-Ledger Leakage

- ZiG ledger: only ZiG rails.
- USD ledger: only forex-compatible rails.
- ZAR ledger: only ZAR/SA/SADC rails.
- Custodian: no external gateways; aggregates and allocates.

### 6.2 Implementation Checklist

- [ ] Separate API endpoints per ledger (or ledger parameter).
- [ ] Gateway routing table: ledger ↔ allowed gateways.
- [ ] Reject mismatched gateway–ledger combinations.
- [ ] Custodian as single reconciliation point.
- [ ] Currency-specific KYC/AML limits.

---

## 7. Same Gateway ≠ Same Logic (CRITICAL)

**Example: Mukuru appears in ALL ledgers – but with different logic:**

| Ledger | Mukuru Role | Logic |
|--------|-------------|-------|
| **ZiG** | Local payout | Remittance converted to ZiG at RBZ rate; credit ZiG ledger; user gets ZiG |
| **USD** | Forex payout | USD flows; nostro-backed; forex-compatible; user gets USD |
| **ZAR** | Cross-border remittance | SA to ZW corridor; ZAR settlement; cross-border logic |

**That distinction = real fintech design.** Same gateway, different routing, settlement, and ledger treatment per currency.

---

## 8. Aggregator Layer (VERY IMPORTANT)

Integrate these aggregators for one API to multiple rails:

| Aggregator | Rails Exposed | Use Case |
|------------|---------------|----------|
| **Paynow** | EcoCash, cards, ZIPIT, etc. | Single integration to multiple ZW rails |
| **Zimswitch VPayments** | Zimswitch network | Bank and card consolidation |
| **ContiPay** | Multi-rail | Payment aggregation |
| **ZuriPay** | Mobile money, bank | Unified API |

**Benefits:** One API → EcoCash, cards, ZIPIT, bank transfers. Reduces integration surface and operational overhead.

---

## 9. Final Structure (System Vision)

| Ledger | Nature | Strength |
|--------|--------|----------|
| **ZiG** | Local liquidity | Mass market |
| **USD** | Value storage | Stability |
| **ZAR** | Cross-border engine | Growth |
| **Custodian** | Core engine | Control |

---

## Appendix A: Gateway Provider Reference (Current)

| Provider | Type | Region | API/Integration |
|----------|------|--------|-----------------|
| EcoCash | Mobile money | ZW | API (EcoCash Merchant) |
| OneMoney | Mobile money | ZW | API |
| InnBucks / O'mari | Mobile money | ZW | API |
| Mukuru | Remittance | ZW/SA | Partner API |
| Ozow | Instant EFT | SA | API |
| Stitch | Payments | SA | API |
| Peach Payments | Gateway | SA | API |
| PayFast | Gateway | SA | API |
| ZIPIT | Bank switch | ZW | Bank integration |
| Zimswitch | Cardless ATM, VPayments | ZW | Bank/aggregator |
| RTGS | Settlement | ZW | Bank/RBZ |
| SADC RTGS | Cross-border | SADC | Bank/SARB |
| **Paynow** | Aggregator | ZW | One API to EcoCash, cards, ZIPIT |
| **Zimswitch VPayments** | Aggregator | ZW | Bank and card consolidation |
| **ContiPay** | Aggregator | ZW | Multi-rail |
| **ZuriPay** | Aggregator | ZW | Mobile money, bank |

---

## Appendix B: Regulatory Considerations

| Jurisdiction | Key Requirements |
|--------------|------------------|
| **Zimbabwe (RBZ)** | KYC/AML; FCY rules; MoMo licence; reporting |
| **South Africa (FSCA/SARB)** | Payment licence; POPIA; FX controls |
| **SADC** | SADC RTGS membership; bilateral agreements |

---

*Document end. For implementation, map each gateway to specific APIs, credentials, and settlement contracts.*





