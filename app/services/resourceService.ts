import { BaseService } from "./BaseService";

export type ResourceStatus = "Available" | "In Use" | "Unavailable";

interface UserRef {
  studentID: number;
  user: { firstName: string; lastName: string } | null;
}

export interface UsageLogRecord {
  usageID: number;
  resID: number;
  studentID: number;
  startTime: string;
  endTime: string | null;
  student: UserRef | null;
  resource?: { resID: number; name: string; resourceType: string } | null;
}

export interface ResourceRecord {
  resID: number;
  resourceType: string;
  name: string;
  status: ResourceStatus;
  active_usage: UsageLogRecord | null;
}

class ResourceServiceClass extends BaseService {
  fetchResources() {
    return this.apiRequest<{ resources: ResourceRecord[] }>("/librarian/resources");
  }

  createResource(payload: { resourceType: string; name: string }) {
    return this.apiRequest<{ message: string; resource: ResourceRecord }>("/librarian/resources", { method: "POST", body: payload });
  }

  updateResource(resID: number, payload: { resourceType?: string; name?: string; status?: "Available" | "Unavailable" }) {
    return this.apiRequest<{ message: string; resource: ResourceRecord }>(`/librarian/resources/${resID}`, { method: "PATCH", body: payload });
  }

  deleteResource(resID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/resources/${resID}`, { method: "DELETE" });
  }

  fetchUsageLogs() {
    return this.apiRequest<{ usageLogs: UsageLogRecord[] }>("/librarian/resource-usage-logs");
  }

  startSession(payload: { resID: number; studentID: number }) {
    return this.apiRequest<{ message: string }>("/librarian/resource-usage-logs", { method: "POST", body: payload });
  }

  endSession(usageID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/resource-usage-logs/${usageID}/end`, { method: "POST" });
  }
}

export const resourceService = new ResourceServiceClass();
