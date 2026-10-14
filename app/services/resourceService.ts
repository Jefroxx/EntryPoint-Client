import { BaseService } from "./BaseService";

export type ResourceStatus = "Available" | "In Use" | "Unavailable";

interface UserRef {
  studentID: number;
  user: { firstName: string; lastName: string } | null;
}

export interface UsageLogRecord {
  usageID: number;
  uuid: string;
  resID: number;
  studentID: number;
  startTime: string;
  endTime: string | null;
  student: UserRef | null;
  resource?: { resID: number; name: string; resourceType: string } | null;
}

export interface ResourceRecord {
  resID: number;
  uuid: string;
  resourceType: string;
  name: string;
  status: ResourceStatus;
  /** The code on the facility's printed label (F-000012); the scan station reads it to start or end a session. */
  barcodeValue: string;
  active_usage: UsageLogRecord | null;
}

class ResourceServiceClass extends BaseService {
  fetchResources() {
    return this.apiRequest<{ resources: ResourceRecord[] }>("/librarian/resources");
  }

  createResource(payload: { resourceType: string; name: string }) {
    return this.apiRequest<{ message: string; resource: ResourceRecord }>("/librarian/resources", { method: "POST", body: payload });
  }

  updateResource(resUuid: string, payload: { resourceType?: string; name?: string; status?: "Available" | "Unavailable" }) {
    return this.apiRequest<{ message: string; resource: ResourceRecord }>(`/librarian/resources/${resUuid}`, { method: "PATCH", body: payload });
  }

  deleteResource(resUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/resources/${resUuid}`, { method: "DELETE" });
  }

  fetchUsageLogs() {
    return this.apiRequest<{ usageLogs: UsageLogRecord[] }>("/librarian/resource-usage-logs");
  }

  startSession(payload: { resID: number; studentID: number }) {
    return this.apiRequest<{ message: string }>("/librarian/resource-usage-logs", { method: "POST", body: payload });
  }

  endSession(usageUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/resource-usage-logs/${usageUuid}/end`, { method: "POST" });
  }
}

export const resourceService = new ResourceServiceClass();
