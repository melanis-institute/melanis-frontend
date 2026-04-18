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

describe("Collaboration backend adapter contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    removeStorageValue(SESSION_KEY);
  });

  it("uses the external practitioner application and inter-practitioner case contracts", async () => {
    writeStorageJson(SESSION_KEY, { accessToken: "token-p5-collaboration" });

    const application = {
      id: "application-1",
      userId: "user-external",
      fullName: "Dr. Avis Externe",
      phoneE164: "+221770000205",
      email: "external@example.com",
      specialty: "Dermatologie pediatrique",
      organization: "Clinique Littorale",
      licenseNumber: "EXT-P5-001",
      countryCode: "+221",
      motivation: "Participer aux demandes d'avis complexes.",
      status: "pending",
      createdAt: "2026-04-18T10:00:00.000Z",
      updatedAt: "2026-04-18T10:00:00.000Z",
    } as const;

    const interPractitionerCase = {
      id: "case-1",
      externalPractitionerUserId: "user-external",
      externalPractitionerProfileId: "user-external",
      assignedPractitionerId: "pract-001",
      claimedByUserId: "user-practitioner",
      status: "submitted",
      subject: "Demande d'avis eczema severe",
      patientLabel: "Patient Demo",
      patientAgeLabel: "12 ans",
      clinicalContext: "Plaques diffuses avec prurit nocturne.",
      question: "Quelle stratégie initiale proposer ?",
      consentAttested: true,
      mediaAssetIds: [],
      submittedAt: "2026-04-18T10:05:00.000Z",
      latestMessageAt: "2026-04-18T10:05:00.000Z",
      createdAt: "2026-04-18T10:05:00.000Z",
      updatedAt: "2026-04-18T10:05:00.000Z",
    } as const;

    const caseDetail = {
      case: interPractitionerCase,
      messages: [
        {
          id: "message-1",
          caseId: "case-1",
          actorUserId: "user-external",
          authorRole: "external_practitioner",
          body: "Quelle stratégie initiale proposer ?",
          mediaAssetIds: [],
          meta: { submitted: true },
          createdAt: "2026-04-18T10:05:00.000Z",
          updatedAt: "2026-04-18T10:05:00.000Z",
        },
      ],
    } as const;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(application))
      .mockResolvedValueOnce(jsonResponse([interPractitionerCase]))
      .mockResolvedValueOnce(jsonResponse(caseDetail))
      .mockResolvedValueOnce(jsonResponse(caseDetail))
      .mockResolvedValueOnce(
        jsonResponse({
          ...caseDetail,
          case: { ...caseDetail.case, status: "external_replied" },
          messages: [
            ...caseDetail.messages,
            {
              id: "message-2",
              caseId: "case-1",
              actorUserId: "user-external",
              authorRole: "external_practitioner",
              body: "Aggravation apres piscine.",
              mediaAssetIds: [],
              meta: {},
              createdAt: "2026-04-18T10:20:00.000Z",
              updatedAt: "2026-04-18T10:20:00.000Z",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse([{ ...interPractitionerCase, status: "submitted" }]))
      .mockResolvedValueOnce(jsonResponse(caseDetail))
      .mockResolvedValueOnce(jsonResponse({ ...interPractitionerCase, status: "in_review" }))
      .mockResolvedValueOnce(
        jsonResponse({
          ...caseDetail,
          case: { ...caseDetail.case, status: "waiting_for_external" },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ...caseDetail,
          case: { ...caseDetail.case, status: "responded", respondedAt: "2026-04-18T10:35:00.000Z" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ...interPractitionerCase, status: "closed", closedAt: "2026-04-18T10:40:00.000Z" }));
    vi.stubGlobal("fetch", fetchMock);

    const accountAdapter = new BackendAccountAdapter(API_BASE_URL);

    const createdApplication = await accountAdapter.createExternalPractitionerApplication({
      actorUserId: "user-external",
      specialty: "Dermatologie pediatrique",
      organization: "Clinique Littorale",
      licenseNumber: "EXT-P5-001",
      motivation: "Participer aux demandes d'avis complexes.",
    });
    const externalCases = await accountAdapter.listExternalPractitionerCases("user-external");
    const createdCase = await accountAdapter.createExternalPractitionerCase({
      actorUserId: "user-external",
      subject: "Demande d'avis eczema severe",
      patientLabel: "Patient Demo",
      patientAgeLabel: "12 ans",
      clinicalContext: "Plaques diffuses avec prurit nocturne.",
      question: "Quelle stratégie initiale proposer ?",
      consentAttested: true,
      mediaAssetIds: [],
    });
    const fetchedExternalCase = await accountAdapter.getExternalPractitionerCase(
      "user-external",
      "case-1",
    );
    const repliedExternalCase = await accountAdapter.replyToExternalPractitionerCase({
      actorUserId: "user-external",
      caseId: "case-1",
      body: "Aggravation apres piscine.",
      mediaAssetIds: [],
    });
    const practitionerCases = await accountAdapter.listPractitionerInterPractitionerCases(
      "user-practitioner",
      "submitted",
    );
    const fetchedPractitionerCase = await accountAdapter.getPractitionerInterPractitionerCase(
      "user-practitioner",
      "case-1",
    );
    const claimedCase = await accountAdapter.claimInterPractitionerCase(
      "user-practitioner",
      "case-1",
    );
    const moreInfoCase = await accountAdapter.requestMoreInfoForInterPractitionerCase({
      actorUserId: "user-practitioner",
      caseId: "case-1",
      body: "Merci de preciser les facteurs declenchants.",
      mediaAssetIds: [],
    });
    const respondedCase = await accountAdapter.respondToInterPractitionerCase({
      actorUserId: "user-practitioner",
      caseId: "case-1",
      body: "Emollient intensif puis dermocorticoide court.",
      mediaAssetIds: [],
    });
    const closedCase = await accountAdapter.closeInterPractitionerCase(
      "user-practitioner",
      "case-1",
    );

    expect(createdApplication.status).toBe("pending");
    expect(externalCases[0].id).toBe("case-1");
    expect(createdCase.case.status).toBe("submitted");
    expect(fetchedExternalCase.case.id).toBe("case-1");
    expect(repliedExternalCase.case.status).toBe("external_replied");
    expect(practitionerCases[0].status).toBe("submitted");
    expect(fetchedPractitionerCase.case.subject).toContain("eczema");
    expect(claimedCase.status).toBe("in_review");
    expect(moreInfoCase.case.status).toBe("waiting_for_external");
    expect(respondedCase.case.status).toBe("responded");
    expect(closedCase.status).toBe("closed");

    const applicationCall = fetchMock.mock.calls[0];
    expect(String(applicationCall[0])).toContain("/api/v1/external-practitioner/applications");
    expect(JSON.parse(String((applicationCall[1] as RequestInit).body))).toMatchObject({
      specialty: "Dermatologie pediatrique",
      organization: "Clinique Littorale",
      licenseNumber: "EXT-P5-001",
    });

    const listExternalCasesCall = fetchMock.mock.calls[1];
    expect(String(listExternalCasesCall[0])).toContain("/api/v1/external-practitioner/cases");

    const createExternalCaseCall = fetchMock.mock.calls[2];
    expect(String(createExternalCaseCall[0])).toContain("/api/v1/external-practitioner/cases");
    expect(JSON.parse(String((createExternalCaseCall[1] as RequestInit).body))).toMatchObject({
      patientLabel: "Patient Demo",
      consentAttested: true,
    });

    const getExternalCaseCall = fetchMock.mock.calls[3];
    expect(String(getExternalCaseCall[0])).toContain("/api/v1/external-practitioner/cases/case-1");

    const replyExternalCaseCall = fetchMock.mock.calls[4];
    expect(String(replyExternalCaseCall[0])).toContain(
      "/api/v1/external-practitioner/cases/case-1/reply",
    );
    expect(JSON.parse(String((replyExternalCaseCall[1] as RequestInit).body))).toMatchObject({
      body: "Aggravation apres piscine.",
      mediaAssetIds: [],
    });

    const listPractitionerCasesCall = fetchMock.mock.calls[5];
    expect(String(listPractitionerCasesCall[0])).toContain(
      "/api/v1/practitioner/inter-practitioner/cases",
    );
    expect(String(listPractitionerCasesCall[0])).toContain("status=submitted");

    const getPractitionerCaseCall = fetchMock.mock.calls[6];
    expect(String(getPractitionerCaseCall[0])).toContain(
      "/api/v1/practitioner/inter-practitioner/cases/case-1",
    );

    const claimCaseCall = fetchMock.mock.calls[7];
    expect(String(claimCaseCall[0])).toContain(
      "/api/v1/practitioner/inter-practitioner/cases/case-1/claim",
    );

    const moreInfoCall = fetchMock.mock.calls[8];
    expect(String(moreInfoCall[0])).toContain(
      "/api/v1/practitioner/inter-practitioner/cases/case-1/request-more-info",
    );
    expect(JSON.parse(String((moreInfoCall[1] as RequestInit).body))).toMatchObject({
      body: "Merci de preciser les facteurs declenchants.",
    });

    const respondCall = fetchMock.mock.calls[9];
    expect(String(respondCall[0])).toContain(
      "/api/v1/practitioner/inter-practitioner/cases/case-1/respond",
    );
    expect(JSON.parse(String((respondCall[1] as RequestInit).body))).toMatchObject({
      body: "Emollient intensif puis dermocorticoide court.",
    });

    const closeCall = fetchMock.mock.calls[10];
    expect(String(closeCall[0])).toContain(
      "/api/v1/practitioner/inter-practitioner/cases/case-1/close",
    );

    for (const [, init] of fetchMock.mock.calls) {
      expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
        "Bearer token-p5-collaboration",
      );
    }
  });
});
