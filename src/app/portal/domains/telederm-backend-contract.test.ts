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

describe("Telederm backend adapter contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    removeStorageValue(SESSION_KEY);
  });

  it("uses the patient and practitioner telederm backend contracts across the async case lifecycle", async () => {
    writeStorageJson(SESSION_KEY, { accessToken: "token-p3" });

    const teledermCase = {
      id: "case-1",
      profileId: "profile-1",
      createdByUserId: "user-1",
      assignedPractitionerId: "pract-001",
      claimedByUserId: "user-practitioner",
      status: "submitted",
      conditionKey: "eczema",
      bodyArea: "Mains",
      patientSummary: "Plaques prurigineuses depuis 10 jours.",
      questionnaireData: { duration: "10 jours", symptoms: "demangeaisons" },
      submittedAt: "2026-04-18T10:05:00.000Z",
      latestMessageAt: "2026-04-18T10:05:00.000Z",
      slaDueAt: "2026-04-18T22:05:00.000Z",
      createdAt: "2026-04-18T10:00:00.000Z",
      updatedAt: "2026-04-18T10:05:00.000Z",
    } as const;

    const teledermDetail = {
      case: {
        ...teledermCase,
        status: "responded",
        respondedAt: "2026-04-18T10:45:00.000Z",
        responseDocumentId: "doc-report-1",
        prescriptionDocumentId: "doc-rx-1",
        updatedAt: "2026-04-18T10:45:00.000Z",
      },
      mediaAssets: [
        {
          id: "asset-1",
          profileId: "profile-1",
          asyncCaseId: "case-1",
          captureSessionId: "session-1",
          captureKind: "close",
          bodyArea: "Mains",
          conditionKey: "eczema",
          fileName: "close.jpg",
          contentType: "image/jpeg",
          status: "uploaded",
          uploadedAt: "2026-04-18T10:03:00.000Z",
          downloadUrl: "http://public-storage.test/download/asset-1",
          createdAt: "2026-04-18T10:01:00.000Z",
          updatedAt: "2026-04-18T10:03:00.000Z",
        },
      ],
      messages: [
        {
          id: "message-1",
          asyncCaseId: "case-1",
          profileId: "profile-1",
          actorUserId: "user-1",
          authorRole: "patient",
          type: "submission",
          body: "Besoin d'un avis rapide.",
          mediaAssetIds: ["asset-1"],
          meta: {},
          createdAt: "2026-04-18T10:05:00.000Z",
        },
        {
          id: "message-2",
          asyncCaseId: "case-1",
          profileId: "profile-1",
          actorUserId: "user-practitioner",
          authorRole: "practitioner",
          type: "practitioner_response",
          body: "Hydrater intensivement et appliquer le traitement 5 jours.",
          mediaAssetIds: [],
          meta: {},
          createdAt: "2026-04-18T10:45:00.000Z",
        },
      ],
      comparisonGroups: [
        {
          profileId: "profile-1",
          bodyArea: "Mains",
          conditionKey: "eczema",
          mediaAssets: [],
        },
      ],
      documents: [
        {
          id: "doc-report-1",
          profileId: "profile-1",
          appointmentId: undefined,
          practitionerId: "pract-001",
          createdByUserId: "user-practitioner",
          kind: "report",
          status: "published",
          title: "Compte-rendu telederm",
          summary: "Hydratation et dermocorticoide court.",
          body: "Diagnostic: eczema irritatif",
          prescriptionItems: [],
          version: 1,
          publishedAt: "2026-04-18T10:45:00.000Z",
          createdAt: "2026-04-18T10:45:00.000Z",
          updatedAt: "2026-04-18T10:45:00.000Z",
        },
      ],
    } as const;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([teledermCase]))
      .mockResolvedValueOnce(jsonResponse({ ...teledermCase, status: "draft" }))
      .mockResolvedValueOnce(
        jsonResponse({
          ...teledermCase,
          status: "draft",
          patientSummary: "Plaques prurigineuses avec aggravation nocturne.",
          updatedAt: "2026-04-18T10:01:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          intents: [
            {
              id: "asset-1",
              profileId: "profile-1",
              fileName: "close.jpg",
              contentType: "image/jpeg",
              status: "pending",
              uploadMethod: "PUT",
              uploadUrl: "http://public-storage.test/upload/asset-1",
              createdAt: "2026-04-18T10:01:00.000Z",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "asset-1",
          profileId: "profile-1",
          asyncCaseId: "case-1",
          captureSessionId: "session-1",
          captureKind: "close",
          bodyArea: "Mains",
          conditionKey: "eczema",
          fileName: "close.jpg",
          contentType: "image/jpeg",
          status: "uploaded",
          uploadedAt: "2026-04-18T10:03:00.000Z",
          downloadUrl: "http://public-storage.test/download/asset-1",
          createdAt: "2026-04-18T10:01:00.000Z",
          updatedAt: "2026-04-18T10:03:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          case: teledermCase,
          messages: [
            {
              id: "message-1",
              asyncCaseId: "case-1",
              profileId: "profile-1",
              actorUserId: "user-1",
              authorRole: "patient",
              type: "submission",
              body: "Besoin d'un avis rapide.",
              mediaAssetIds: ["asset-1"],
              meta: {},
              createdAt: "2026-04-18T10:05:00.000Z",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse(teledermDetail))
      .mockResolvedValueOnce(jsonResponse(teledermDetail))
      .mockResolvedValueOnce(
        jsonResponse({
          ...teledermDetail,
          case: { ...teledermDetail.case, status: "patient_replied" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse([{ ...teledermCase, status: "submitted" }]))
      .mockResolvedValueOnce(jsonResponse({ ...teledermCase, status: "in_review" }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "message-3",
          asyncCaseId: "case-1",
          profileId: "profile-1",
          actorUserId: "user-practitioner",
          authorRole: "practitioner",
          type: "request_more_info",
          body: "Merci d'ajouter une photo en lumiere naturelle.",
          mediaAssetIds: [],
          meta: {},
          createdAt: "2026-04-18T10:20:00.000Z",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(teledermDetail))
      .mockResolvedValueOnce(jsonResponse({ ...teledermCase, status: "closed" }));
    vi.stubGlobal("fetch", fetchMock);

    const accountAdapter = new BackendAccountAdapter(API_BASE_URL);

    const listedCases = await accountAdapter.listAsyncCases("user-1", "profile-1");
    const createdCase = await accountAdapter.createAsyncCase({
      actorUserId: "user-1",
      profileId: "profile-1",
      conditionKey: "eczema",
      bodyArea: "Mains",
      patientSummary: "Plaques prurigineuses depuis 10 jours.",
      questionnaireData: { duration: "10 jours", symptoms: "demangeaisons" },
    });
    const updatedCase = await accountAdapter.updateAsyncCase({
      actorUserId: "user-1",
      caseId: "case-1",
      conditionKey: "eczema",
      bodyArea: "Mains",
      patientSummary: "Plaques prurigineuses avec aggravation nocturne.",
      questionnaireData: { duration: "10 jours", symptoms: "demangeaisons" },
    });
    const uploadIntents = await accountAdapter.createAsyncCaseUploadIntents({
      actorUserId: "user-1",
      caseId: "case-1",
      files: [{ fileName: "close.jpg", contentType: "image/jpeg" }],
      captureSessionId: "session-1",
      captureKind: "close",
      bodyArea: "Mains",
      conditionKey: "eczema",
    });
    const completedAsset = await accountAdapter.completeAsyncCaseMediaUpload("user-1", "asset-1");
    const submittedCase = await accountAdapter.submitAsyncCase({
      actorUserId: "user-1",
      caseId: "case-1",
      message: "Besoin d'un avis rapide.",
    });
    const fetchedCase = await accountAdapter.getAsyncCase("user-1", "case-1");
    const repliedCase = await accountAdapter.replyToAsyncCase({
      actorUserId: "user-1",
      caseId: "case-1",
      body: "Photo refaite ce matin.",
      mediaAssetIds: [],
    });
    const practitionerCases = await accountAdapter.listPractitionerAsyncCases(
      "user-practitioner",
      "submitted",
    );
    const claimedCase = await accountAdapter.claimAsyncCase("user-practitioner", "case-1");
    await accountAdapter.requestMoreInfo({
      actorUserId: "user-practitioner",
      caseId: "case-1",
      body: "Merci d'ajouter une photo en lumiere naturelle.",
    });
    const respondedCase = await accountAdapter.respondToAsyncCase({
      actorUserId: "user-practitioner",
      caseId: "case-1",
      diagnosis: "Eczema irritatif",
      clinicalSummary: "Hydratation intensive et dermocorticoide court.",
      body: "Appliquer le traitement 5 jours puis reprendre l'entretien.",
      prescriptionItems: [
        {
          name: "Dermocorticoide",
          instructions: "1 application le soir pendant 5 jours",
          isMedication: true,
        },
      ],
    });
    const closedCase = await accountAdapter.closeAsyncCase("user-practitioner", "case-1");

    expect(listedCases[0].id).toBe("case-1");
    expect(createdCase.status).toBe("draft");
    expect(updatedCase.patientSummary).toContain("aggravation nocturne");
    expect(uploadIntents[0].uploadMethod).toBe("PUT");
    expect(completedAsset.status).toBe("uploaded");
    expect(submittedCase.case.status).toBe("responded");
    expect(fetchedCase.documents[0].kind).toBe("report");
    expect(repliedCase.case.status).toBe("patient_replied");
    expect(practitionerCases[0].status).toBe("submitted");
    expect(claimedCase.status).toBe("in_review");
    expect(respondedCase.case.responseDocumentId).toBe("doc-report-1");
    expect(closedCase.status).toBe("closed");

    const listCasesCall = fetchMock.mock.calls[0];
    expect(String(listCasesCall[0])).toContain("/api/v1/telederm/cases");
    expect(String(listCasesCall[0])).toContain("profileId=profile-1");

    const createCaseCall = fetchMock.mock.calls[1];
    expect(String(createCaseCall[0])).toContain("/api/v1/telederm/cases");
    expect((createCaseCall[1] as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((createCaseCall[1] as RequestInit).body))).toMatchObject({
      profileId: "profile-1",
      conditionKey: "eczema",
      bodyArea: "Mains",
    });

    const updateCaseCall = fetchMock.mock.calls[2];
    expect(String(updateCaseCall[0])).toContain("/api/v1/telederm/cases/case-1");
    expect((updateCaseCall[1] as RequestInit).method).toBe("PATCH");

    const uploadIntentCall = fetchMock.mock.calls[3];
    expect(String(uploadIntentCall[0])).toContain("/api/v1/telederm/cases/case-1/media/upload-intents");
    expect(JSON.parse(String((uploadIntentCall[1] as RequestInit).body))).toMatchObject({
      captureSessionId: "session-1",
      captureKind: "close",
    });

    const completeUploadCall = fetchMock.mock.calls[4];
    expect(String(completeUploadCall[0])).toContain("/api/v1/telederm/media-assets/asset-1/complete");
    expect((completeUploadCall[1] as RequestInit).method).toBe("POST");

    const submitCall = fetchMock.mock.calls[5];
    expect(String(submitCall[0])).toContain("/api/v1/telederm/cases/case-1/submit");
    expect(JSON.parse(String((submitCall[1] as RequestInit).body))).toMatchObject({
      message: "Besoin d'un avis rapide.",
    });

    const submitDetailCall = fetchMock.mock.calls[6];
    expect(String(submitDetailCall[0])).toContain("/api/v1/telederm/cases/case-1");
    expect((submitDetailCall[1] as RequestInit)?.method ?? "GET").toBe("GET");

    const replyCall = fetchMock.mock.calls[8];
    expect(String(replyCall[0])).toContain("/api/v1/telederm/cases/case-1/reply");
    expect(JSON.parse(String((replyCall[1] as RequestInit).body))).toMatchObject({
      body: "Photo refaite ce matin.",
      mediaAssetIds: [],
    });

    const practitionerListCall = fetchMock.mock.calls[9];
    expect(String(practitionerListCall[0])).toContain("/api/v1/practitioner/telederm/cases");
    expect(String(practitionerListCall[0])).toContain("status=submitted");

    const claimCall = fetchMock.mock.calls[10];
    expect(String(claimCall[0])).toContain("/api/v1/practitioner/telederm/cases/case-1/claim");

    const moreInfoCall = fetchMock.mock.calls[11];
    expect(String(moreInfoCall[0])).toContain(
      "/api/v1/practitioner/telederm/cases/case-1/request-more-info",
    );
    expect(JSON.parse(String((moreInfoCall[1] as RequestInit).body))).toMatchObject({
      body: "Merci d'ajouter une photo en lumiere naturelle.",
    });

    const respondCall = fetchMock.mock.calls[12];
    expect(String(respondCall[0])).toContain("/api/v1/practitioner/telederm/cases/case-1/respond");
    expect(JSON.parse(String((respondCall[1] as RequestInit).body))).toMatchObject({
      diagnosis: "Eczema irritatif",
      clinicalSummary: "Hydratation intensive et dermocorticoide court.",
    });

    const closeCall = fetchMock.mock.calls[13];
    expect(String(closeCall[0])).toContain("/api/v1/practitioner/telederm/cases/case-1/close");
    expect((closeCall[1] as RequestInit).method).toBe("POST");

    for (const [, init] of fetchMock.mock.calls) {
      expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
        "Bearer token-p3",
      );
    }
  });
});
