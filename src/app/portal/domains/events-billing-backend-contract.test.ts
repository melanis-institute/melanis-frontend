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

describe("Events and billing backend adapter contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    removeStorageValue(SESSION_KEY);
  });

  it("uses the event registration, billing, and payment backend contracts", async () => {
    writeStorageJson(SESSION_KEY, { accessToken: "token-p5-events" });

    const eventRecord = {
      id: "event-1",
      title: "Masterclass pigmentation",
      summary: "Evenement payant avec facturation",
      description: "Session premium avec questions-reponses.",
      audience: "patient",
      format: "digital",
      status: "published",
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

    const eventDetail = {
      event: eventRecord,
      myRegistration: {
        id: "registration-1",
        eventId: "event-1",
        userId: "user-1",
        profileId: "profile-1",
        status: "registered",
        registeredAt: "2026-04-18T10:05:00.000Z",
        createdAt: "2026-04-18T10:05:00.000Z",
        updatedAt: "2026-04-18T10:05:00.000Z",
      },
      myTicket: null,
      registrationCount: 1,
    } as const;

    const invoice = {
      id: "invoice-1",
      profileId: "profile-1",
      sourceType: "event_registration",
      sourceId: "registration-1",
      title: "Inscription événement · Masterclass pigmentation",
      description: "Evenement payant avec facturation",
      lineItems: [{ label: "Masterclass pigmentation", amount: 12000, quantity: 1 }],
      totalAmount: 12000,
      currency: "XOF",
      status: "issued",
      dueAt: "2026-05-01T10:00:00.000Z",
      issuedAt: "2026-04-18T10:05:00.000Z",
      createdAt: "2026-04-18T10:05:00.000Z",
      updatedAt: "2026-04-18T10:05:00.000Z",
    } as const;

    const quote = {
      id: "quote-1",
      profileId: "profile-1",
      sourceType: "event_registration",
      sourceId: "registration-1",
      title: "Pack masterclass",
      description: "Devis d'inscription",
      lineItems: [{ label: "Masterclass pigmentation", amount: 12000, quantity: 1 }],
      totalAmount: 12000,
      currency: "XOF",
      status: "issued",
      issuedAt: "2026-04-18T10:03:00.000Z",
      expiresAt: "2026-04-30T10:00:00.000Z",
      createdAt: "2026-04-18T10:03:00.000Z",
      updatedAt: "2026-04-18T10:03:00.000Z",
    } as const;

    const payment = {
      id: "payment-1",
      profileId: "profile-1",
      invoiceId: "invoice-1",
      quoteId: undefined,
      eventRegistrationId: "registration-1",
      providerKey: "naboopay",
      method: "card",
      amount: 12000,
      currency: "XOF",
      status: "pending_provider",
      checkoutUrl: "https://www.naboopay.com/checkout/NBP-payment-1",
      externalReference: "NBP-payment-1",
      createdAt: "2026-04-18T10:06:00.000Z",
      updatedAt: "2026-04-18T10:06:00.000Z",
    } as const;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([eventRecord]))
      .mockResolvedValueOnce(jsonResponse(eventDetail))
      .mockResolvedValueOnce(jsonResponse(eventDetail))
      .mockResolvedValueOnce(
        jsonResponse({
          ...eventDetail,
          myRegistration: { ...eventDetail.myRegistration, status: "cancelled" },
          myTicket: null,
        }),
      )
      .mockResolvedValueOnce(jsonResponse([eventDetail.myRegistration]))
      .mockResolvedValueOnce(
        jsonResponse({
          profileId: "profile-1",
          invoices: [invoice],
          quotes: [quote],
          recentPayments: [payment],
          outstandingTotal: 12000,
        }),
      )
      .mockResolvedValueOnce(jsonResponse([invoice]))
      .mockResolvedValueOnce(jsonResponse(invoice))
      .mockResolvedValueOnce(jsonResponse([quote]))
      .mockResolvedValueOnce(jsonResponse(quote))
      .mockResolvedValueOnce(jsonResponse(payment))
      .mockResolvedValueOnce(jsonResponse({ ...payment, status: "paid", paidAt: "2026-04-18T10:07:00.000Z" }));
    vi.stubGlobal("fetch", fetchMock);

    const accountAdapter = new BackendAccountAdapter(API_BASE_URL);

    const events = await accountAdapter.listEvents("user-1");
    const event = await accountAdapter.getEvent("user-1", "event-1");
    const registration = await accountAdapter.registerForEvent("user-1", "event-1", "profile-1");
    const cancellation = await accountAdapter.cancelEventRegistration(
      "user-1",
      "event-1",
      "profile-1",
    );
    const registrations = await accountAdapter.listMyEventRegistrations("user-1");
    const overview = await accountAdapter.getBillingOverview("user-1", "profile-1");
    const invoices = await accountAdapter.listPatientInvoices("user-1", "profile-1");
    const invoiceDetail = await accountAdapter.getPatientInvoice("user-1", "profile-1", "invoice-1");
    const quotes = await accountAdapter.listPatientQuotes("user-1", "profile-1");
    const quoteDetail = await accountAdapter.getPatientQuote("user-1", "profile-1", "quote-1");
    const createdPayment = await accountAdapter.createPayment({
      actorUserId: "user-1",
      profileId: "profile-1",
      invoiceId: "invoice-1",
      eventRegistrationId: "registration-1",
      providerKey: "naboopay",
      method: "card",
      amount: 12000,
      currency: "XOF",
    });
    const paymentDetail = await accountAdapter.getPayment("user-1", "payment-1");

    expect(events[0].id).toBe("event-1");
    expect(event.myRegistration?.id).toBe("registration-1");
    expect(registration.myRegistration?.status).toBe("registered");
    expect(cancellation.myRegistration?.status).toBe("cancelled");
    expect(registrations[0].eventId).toBe("event-1");
    expect(overview.outstandingTotal).toBe(12000);
    expect(invoices[0].id).toBe("invoice-1");
    expect(invoiceDetail.status).toBe("issued");
    expect(quotes[0].id).toBe("quote-1");
    expect(quoteDetail.status).toBe("issued");
    expect(createdPayment.status).toBe("pending_provider");
    expect(paymentDetail.status).toBe("paid");

    const listEventsCall = fetchMock.mock.calls[0];
    expect(String(listEventsCall[0])).toContain("/api/v1/events");

    const getEventCall = fetchMock.mock.calls[1];
    expect(String(getEventCall[0])).toContain("/api/v1/events/event-1");

    const registerCall = fetchMock.mock.calls[2];
    expect(String(registerCall[0])).toContain("/api/v1/events/event-1/register");
    expect(String(registerCall[0])).toContain("profileId=profile-1");

    const cancelCall = fetchMock.mock.calls[3];
    expect(String(cancelCall[0])).toContain("/api/v1/events/event-1/cancel-registration");
    expect(String(cancelCall[0])).toContain("profileId=profile-1");

    const myRegistrationsCall = fetchMock.mock.calls[4];
    expect(String(myRegistrationsCall[0])).toContain("/api/v1/events/my-registrations");

    const overviewCall = fetchMock.mock.calls[5];
    expect(String(overviewCall[0])).toContain("/api/v1/patients/billing/overview");
    expect(String(overviewCall[0])).toContain("profileId=profile-1");

    const invoicesCall = fetchMock.mock.calls[6];
    expect(String(invoicesCall[0])).toContain("/api/v1/patients/billing/invoices");
    expect(String(invoicesCall[0])).toContain("profileId=profile-1");

    const invoiceDetailCall = fetchMock.mock.calls[7];
    expect(String(invoiceDetailCall[0])).toContain("/api/v1/patients/billing/invoices/invoice-1");
    expect(String(invoiceDetailCall[0])).toContain("profileId=profile-1");

    const quotesCall = fetchMock.mock.calls[8];
    expect(String(quotesCall[0])).toContain("/api/v1/patients/billing/quotes");
    expect(String(quotesCall[0])).toContain("profileId=profile-1");

    const quoteDetailCall = fetchMock.mock.calls[9];
    expect(String(quoteDetailCall[0])).toContain("/api/v1/patients/billing/quotes/quote-1");
    expect(String(quoteDetailCall[0])).toContain("profileId=profile-1");

    const createPaymentCall = fetchMock.mock.calls[10];
    expect(String(createPaymentCall[0])).toContain("/api/v1/patients/billing/payments");
    expect(JSON.parse(String((createPaymentCall[1] as RequestInit).body))).toMatchObject({
      profileId: "profile-1",
      invoiceId: "invoice-1",
      eventRegistrationId: "registration-1",
      providerKey: "naboopay",
      method: "card",
      amount: 12000,
    });

    const getPaymentCall = fetchMock.mock.calls[11];
    expect(String(getPaymentCall[0])).toContain("/api/v1/patients/billing/payments/payment-1");

    for (const [, init] of fetchMock.mock.calls) {
      expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
        "Bearer token-p5-events",
      );
    }
  });
});
