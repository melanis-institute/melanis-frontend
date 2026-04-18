import { afterEach, describe, expect, it, vi } from "vitest";
import { BackendAccountAdapter } from "./account/backendAccountAdapter";
import { removeStorageValue, writeStorageJson } from "@shared/lib/storage";

const SESSION_KEY = "melanis_auth_session_v1";
const API_BASE_URL = "http://localhost:8000";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function findCall(
  calls: Array<[unknown, RequestInit | undefined]>,
  matcher: { path: string; method: string },
): [unknown, RequestInit | undefined] {
  const call = calls.find(([url, init]) => {
    return String(url).includes(matcher.path) && (init?.method ?? "GET") === matcher.method;
  });

  expect(call).toBeDefined();
  return call as [unknown, RequestInit | undefined];
}

describe("Admin operations backend adapter contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    removeStorageValue(SESSION_KEY);
  });

  it("uses the admin user, governance, event, billing, and export backend contracts", async () => {
    writeStorageJson(SESSION_KEY, { accessToken: "token-p5-admin" });

    const adminUser = {
      id: "user-admin",
      fullName: "Aminata Admin",
      phoneE164: "+221770000204",
      roles: ["admin"],
      capabilities: [
        "manage_events",
        "review_scientific_content",
        "verify_practitioners",
        "export_audit_logs",
        "manage_security_settings",
        "manage_billing",
      ],
      createdAt: "2026-04-18T10:00:00.000Z",
      updatedAt: "2026-04-18T10:00:00.000Z",
    } as const;

    const staffUser = {
      id: "user-staff",
      fullName: "Staff Governance P5",
      phoneE164: "+221770000223",
      roles: ["staff"],
      capabilities: [],
      createdAt: "2026-04-18T10:00:00.000Z",
      updatedAt: "2026-04-18T10:00:00.000Z",
    } as const;

    const externalApplication = {
      id: "application-1",
      userId: "user-external",
      fullName: "Dr. Avis Externe",
      phoneE164: "+221770000205",
      countryCode: "+221",
      status: "pending",
      createdAt: "2026-04-18T10:00:00.000Z",
      updatedAt: "2026-04-18T10:00:00.000Z",
    } as const;

    const knowledgeArticle = {
      id: "article-1",
      slug: "guide-pigmentation-p5",
      title: "Guide pigmentation",
      summary: "Version initiale",
      body: "Contenu initial",
      category: "education",
      status: "draft",
      currentVersion: 1,
      createdByUserId: "user-admin",
      createdAt: "2026-04-18T10:05:00.000Z",
      updatedAt: "2026-04-18T10:05:00.000Z",
    } as const;

    const securityPolicy = {
      id: "policy-1",
      key: "payment_provider_rollout",
      value: { enabledProviders: ["naboopay"] },
      updatedByUserId: "user-admin",
      createdAt: "2026-04-18T10:00:00.000Z",
      updatedAt: "2026-04-18T10:00:00.000Z",
    } as const;

    const eventRecord = {
      id: "event-1",
      title: "Masterclass pigmentation",
      summary: "Evenement payant avec facturation",
      description: "Session premium avec questions-reponses.",
      audience: "patient",
      format: "digital",
      status: "draft",
      ownerUserId: "user-admin",
      startsAt: "2026-05-01T10:00:00.000Z",
      endsAt: "2026-05-01T12:00:00.000Z",
      locationLabel: "Visio premium",
      capacity: 10,
      waitlistCapacity: 2,
      requiresPayment: true,
      priceAmount: 12000,
      currency: "XOF",
      createdAt: "2026-04-18T10:00:00.000Z",
      updatedAt: "2026-04-18T10:00:00.000Z",
    } as const;

    const invoice = {
      id: "invoice-1",
      profileId: "profile-1",
      sourceType: "appointment",
      sourceId: "appt-p5-invoice-001",
      title: "Facture suivi premium",
      description: "Facture rattachee au devis",
      lineItems: [{ label: "Forfait suivi", amount: 18000, quantity: 1 }],
      totalAmount: 18000,
      currency: "XOF",
      status: "issued",
      dueAt: "2026-05-01T10:00:00.000Z",
      issuedAt: "2026-04-18T10:10:00.000Z",
      quoteId: "quote-1",
      createdAt: "2026-04-18T10:10:00.000Z",
      updatedAt: "2026-04-18T10:10:00.000Z",
    } as const;

    const quote = {
      id: "quote-1",
      profileId: "profile-1",
      sourceType: "appointment",
      sourceId: "appt-p5-quote-001",
      title: "Pack suivi premium",
      description: "Devis de suivi long",
      lineItems: [{ label: "Forfait suivi", amount: 18000, quantity: 1 }],
      totalAmount: 18000,
      currency: "XOF",
      status: "issued",
      issuedAt: "2026-04-18T10:09:00.000Z",
      expiresAt: "2026-05-18T10:00:00.000Z",
      createdAt: "2026-04-18T10:09:00.000Z",
      updatedAt: "2026-04-18T10:09:00.000Z",
    } as const;

    const refundedPayment = {
      id: "payment-1",
      profileId: "profile-1",
      invoiceId: "invoice-1",
      providerKey: "naboopay",
      method: "card",
      amount: 18000,
      currency: "XOF",
      status: "refunded",
      checkoutUrl: "https://www.naboopay.com/checkout/NBP-payment-1",
      externalReference: "NBP-payment-1",
      refundedAt: "2026-04-18T10:20:00.000Z",
      createdAt: "2026-04-18T10:12:00.000Z",
      updatedAt: "2026-04-18T10:20:00.000Z",
    } as const;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([adminUser, staffUser]))
      .mockResolvedValueOnce(jsonResponse(staffUser))
      .mockResolvedValueOnce(jsonResponse({ ...staffUser, roles: ["staff", "external_practitioner"] }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "grant-1",
            userId: "user-staff",
            capability: "manage_billing",
            grantedByUserId: "user-admin",
            createdAt: "2026-04-18T10:06:00.000Z",
            updatedAt: "2026-04-18T10:06:00.000Z",
          },
          {
            id: "grant-2",
            userId: "user-staff",
            capability: "manage_events",
            grantedByUserId: "user-admin",
            createdAt: "2026-04-18T10:06:00.000Z",
            updatedAt: "2026-04-18T10:06:00.000Z",
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([externalApplication]))
      .mockResolvedValueOnce(jsonResponse({ ...externalApplication, status: "approved" }))
      .mockResolvedValueOnce(
        jsonResponse({
          ...externalApplication,
          id: "application-2",
          status: "rejected",
          rejectionReason: "Pieces manquantes",
        }),
      )
      .mockResolvedValueOnce(jsonResponse([knowledgeArticle]))
      .mockResolvedValueOnce(jsonResponse(knowledgeArticle))
      .mockResolvedValueOnce(
        jsonResponse({
          ...knowledgeArticle,
          body: "Contenu enrichi",
          reviewNotes: "Verifier la cohorte cible",
          currentVersion: 2,
          updatedAt: "2026-04-18T10:06:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ...knowledgeArticle,
          status: "in_review",
          submittedAt: "2026-04-18T10:07:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ...knowledgeArticle,
          status: "published",
          reviewedByUserId: "user-admin",
          publishedAt: "2026-04-18T10:08:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "audit-1",
            actorUserId: "user-admin",
            profileId: "profile-1",
            action: "invoice_created",
            entityType: "invoice",
            entityId: "invoice-1",
            createdAt: "2026-04-18T10:10:00.000Z",
          },
        ]),
      )
      .mockResolvedValueOnce(
        textResponse("id,actorUserId,profileId,action,entityType,entityId,createdAt\n"),
      )
      .mockResolvedValueOnce(jsonResponse([securityPolicy]))
      .mockResolvedValueOnce(
        jsonResponse({
          ...securityPolicy,
          value: { enabledProviders: ["naboopay", "wave"] },
          updatedAt: "2026-04-18T10:09:00.000Z",
        }),
      )
      .mockResolvedValueOnce(jsonResponse([eventRecord]))
      .mockResolvedValueOnce(jsonResponse(eventRecord))
      .mockResolvedValueOnce(
        jsonResponse({
          ...eventRecord,
          priceAmount: 18000,
          updatedAt: "2026-04-18T10:10:00.000Z",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ...eventRecord, status: "published" }))
      .mockResolvedValueOnce(jsonResponse({ ...eventRecord, status: "cancelled" }))
      .mockResolvedValueOnce(jsonResponse([invoice]))
      .mockResolvedValueOnce(jsonResponse(invoice))
      .mockResolvedValueOnce(
        jsonResponse({
          ...invoice,
          status: "paid",
          paidAt: "2026-04-18T10:15:00.000Z",
        }),
      )
      .mockResolvedValueOnce(jsonResponse([quote]))
      .mockResolvedValueOnce(jsonResponse(quote))
      .mockResolvedValueOnce(
        jsonResponse({
          ...quote,
          status: "accepted",
          acceptedAt: "2026-04-18T10:12:00.000Z",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(refundedPayment));
    vi.stubGlobal("fetch", fetchMock);

    const accountAdapter = new BackendAccountAdapter(API_BASE_URL);

    const users = await accountAdapter.listAdminUsers("user-admin");
    const user = await accountAdapter.getAdminUser("user-admin", "user-staff");
    const updatedRoles = await accountAdapter.updateUserRoles({
      actorUserId: "user-admin",
      userId: "user-staff",
      roles: ["staff", "external_practitioner"],
    });
    const updatedCapabilities = await accountAdapter.updateUserCapabilities({
      actorUserId: "user-admin",
      userId: "user-staff",
      capabilities: ["manage_events", "manage_billing"],
    });
    const applications = await accountAdapter.listExternalPractitionerApplications("user-admin");
    const approvedApplication = await accountAdapter.approveExternalPractitionerApplication(
      "user-admin",
      "application-1",
    );
    const rejectedApplication = await accountAdapter.rejectExternalPractitionerApplication({
      actorUserId: "user-admin",
      applicationId: "application-2",
      rejectionReason: "Pieces manquantes",
    });
    const articles = await accountAdapter.listKnowledgeArticles("user-admin");
    const createdArticle = await accountAdapter.createKnowledgeArticle({
      actorUserId: "user-admin",
      slug: "guide-pigmentation-p5",
      title: "Guide pigmentation",
      summary: "Version initiale",
      body: "Contenu initial",
      category: "education",
    });
    const updatedArticle = await accountAdapter.updateKnowledgeArticle({
      actorUserId: "user-admin",
      articleId: "article-1",
      body: "Contenu enrichi",
      reviewNotes: "Verifier la cohorte cible",
    });
    const submittedArticle = await accountAdapter.submitKnowledgeArticleForReview(
      "user-admin",
      "article-1",
    );
    const publishedArticle = await accountAdapter.publishKnowledgeArticle(
      "user-admin",
      "article-1",
    );
    const auditLogs = await accountAdapter.listAdminAuditLogs("user-admin");
    const auditCsv = await accountAdapter.exportAdminAuditLogsCsv("user-admin");
    const policies = await accountAdapter.listSecurityPolicies("user-admin");
    const updatedPolicy = await accountAdapter.updateSecurityPolicy({
      actorUserId: "user-admin",
      policyKey: "payment_provider_rollout",
      value: { enabledProviders: ["naboopay", "wave"] },
    });
    const adminEvents = await accountAdapter.listAdminEvents("user-admin");
    const createdEvent = await accountAdapter.createEvent({
      actorUserId: "user-admin",
      title: "Masterclass pigmentation",
      summary: "Evenement payant avec facturation",
      description: "Session premium avec questions-reponses.",
      audience: "patient",
      format: "digital",
      startsAt: "2026-05-01T10:00:00.000Z",
      endsAt: "2026-05-01T12:00:00.000Z",
      locationLabel: "Visio premium",
      capacity: 10,
      waitlistCapacity: 2,
      requiresPayment: true,
      priceAmount: 12000,
      currency: "XOF",
    });
    const updatedEvent = await accountAdapter.updateEvent({
      actorUserId: "user-admin",
      eventId: "event-1",
      priceAmount: 18000,
    });
    const publishedEvent = await accountAdapter.publishEvent("user-admin", "event-1");
    const cancelledEvent = await accountAdapter.cancelEvent("user-admin", "event-1");
    const adminInvoices = await accountAdapter.listAdminInvoices("user-admin");
    const createdInvoice = await accountAdapter.createInvoice({
      actorUserId: "user-admin",
      profileId: "profile-1",
      sourceType: "appointment",
      sourceId: "appt-p5-invoice-001",
      title: "Facture suivi premium",
      description: "Facture rattachee au devis",
      lineItems: [{ label: "Forfait suivi", amount: 18000, quantity: 1 }],
      totalAmount: 18000,
      currency: "XOF",
      dueAt: "2026-05-01T10:00:00.000Z",
      quoteId: "quote-1",
    });
    const updatedInvoice = await accountAdapter.updateInvoice({
      actorUserId: "user-admin",
      invoiceId: "invoice-1",
      status: "paid",
    });
    const adminQuotes = await accountAdapter.listAdminQuotes("user-admin");
    const createdQuote = await accountAdapter.createQuote({
      actorUserId: "user-admin",
      profileId: "profile-1",
      sourceType: "appointment",
      sourceId: "appt-p5-quote-001",
      title: "Pack suivi premium",
      description: "Devis de suivi long",
      lineItems: [{ label: "Forfait suivi", amount: 18000, quantity: 1 }],
      totalAmount: 18000,
      currency: "XOF",
      expiresAt: "2026-05-18T10:00:00.000Z",
    });
    const updatedQuote = await accountAdapter.updateQuote({
      actorUserId: "user-admin",
      quoteId: "quote-1",
      status: "accepted",
    });
    const refunded = await accountAdapter.refundPayment("user-admin", "payment-1");

    expect(users).toHaveLength(2);
    expect(user.phoneE164).toBe("+221770000223");
    expect(updatedRoles.roles).toEqual(["staff", "external_practitioner"]);
    expect(updatedCapabilities.map((item) => item.capability).sort()).toEqual([
      "manage_billing",
      "manage_events",
    ]);
    expect(applications[0].id).toBe("application-1");
    expect(approvedApplication.status).toBe("approved");
    expect(rejectedApplication.status).toBe("rejected");
    expect(articles[0].id).toBe("article-1");
    expect(createdArticle.status).toBe("draft");
    expect(updatedArticle.currentVersion).toBe(2);
    expect(submittedArticle.status).toBe("in_review");
    expect(publishedArticle.status).toBe("published");
    expect(auditLogs[0].entityType).toBe("invoice");
    expect(auditCsv).toContain("id,actorUserId,profileId,action,entityType,entityId,createdAt");
    expect(policies[0].key).toBe("payment_provider_rollout");
    expect(updatedPolicy.value.enabledProviders).toEqual(["naboopay", "wave"]);
    expect(adminEvents[0].id).toBe("event-1");
    expect(createdEvent.status).toBe("draft");
    expect(updatedEvent.priceAmount).toBe(18000);
    expect(publishedEvent.status).toBe("published");
    expect(cancelledEvent.status).toBe("cancelled");
    expect(adminInvoices[0].id).toBe("invoice-1");
    expect(createdInvoice.status).toBe("issued");
    expect(updatedInvoice.status).toBe("paid");
    expect(adminQuotes[0].id).toBe("quote-1");
    expect(createdQuote.status).toBe("issued");
    expect(updatedQuote.status).toBe("accepted");
    expect(refunded.status).toBe("refunded");

    const exportCall = findCall(fetchMock.mock.calls, {
      path: "/api/v1/admin/audit-logs/export",
      method: "GET",
    });
    expect(String(exportCall[0])).toContain("/api/v1/admin/audit-logs/export");
    expect((exportCall[1] as RequestInit).method).toBe("GET");

    const updatePolicyCall = findCall(fetchMock.mock.calls, {
      path: "/api/v1/admin/security-policies/payment_provider_rollout",
      method: "PATCH",
    });
    expect(String(updatePolicyCall[0])).toContain(
      "/api/v1/admin/security-policies/payment_provider_rollout",
    );
    expect(JSON.parse(String((updatePolicyCall[1] as RequestInit).body))).toMatchObject({
      value: { enabledProviders: ["naboopay", "wave"] },
    });

    const createInvoiceCall = findCall(fetchMock.mock.calls, {
      path: "/api/v1/admin/billing/invoices",
      method: "POST",
    });
    expect(String(createInvoiceCall[0])).toContain("/api/v1/admin/billing/invoices");
    expect(JSON.parse(String((createInvoiceCall[1] as RequestInit).body))).toMatchObject({
      profileId: "profile-1",
      sourceType: "appointment",
      quoteId: "quote-1",
    });

    const createQuoteCall = findCall(fetchMock.mock.calls, {
      path: "/api/v1/admin/billing/quotes",
      method: "POST",
    });
    expect(String(createQuoteCall[0])).toContain("/api/v1/admin/billing/quotes");
    expect(JSON.parse(String((createQuoteCall[1] as RequestInit).body))).toMatchObject({
      profileId: "profile-1",
      sourceType: "appointment",
      totalAmount: 18000,
    });

    const refundCall = findCall(fetchMock.mock.calls, {
      path: "/api/v1/admin/billing/payments/payment-1/refund",
      method: "POST",
    });
    expect(String(refundCall[0])).toContain("/api/v1/admin/billing/payments/payment-1/refund");

    for (const [, init] of fetchMock.mock.calls) {
      expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
        "Bearer token-p5-admin",
      );
    }
  });
});
