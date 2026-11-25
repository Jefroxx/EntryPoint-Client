import { BaseService } from "./BaseService";

export type ResourceStatus = "Available" | "In Use" | "Unavailable";

interface UserRef {
  studentID: number;
  memberIDNumber?: string;
  academicProgram?: string | null;
  /** Faculty and staff have a department instead of a program. */
  department?: string | null;
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
  /** The librarian who started the session. */
  staff_librarian?: { user: { firstName: string; lastName: string } | null } | null;
}

export interface PaginatedUsageLogs {
  data: UsageLogRecord[];
  current_page: number;
  last_page: number;
  total: number;
}

/** A kind of resource (Computer, Study Room...). `resources_count` is how many resources have it. */
export interface ResourceTypeRecord {
  typeID: number;
  uuid: string;
  name: string;
  resources_count: number;
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

  /** One page of the log. `status`: active or ended; `date`: the day a session started (Y-m-d). */
  fetchUsageLogs(params: { search?: string; status?: "active" | "ended"; type?: string; resID?: number; date?: string; page?: number; perPage?: number } = {}) {
    return this.apiRequest<PaginatedUsageLogs>("/librarian/resource-usage-logs", { query: params });
  }

  fetchTypes() {
    return this.apiRequest<{ types: ResourceTypeRecord[] }>("/librarian/resource-types");
  }

  createType(payload: { name: string }) {
    return this.apiRequest<{ message: string; type: ResourceTypeRecord }>("/librarian/resource-types", { method: "POST", body: payload });
  }

  renameType(typeUuid: string, payload: { name: string }) {
    return this.apiRequest<{ message: string; type: ResourceTypeRecord }>(`/librarian/resource-types/${typeUuid}`, { method: "PATCH", body: payload });
  }

  deleteType(typeUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/resource-types/${typeUuid}`, { method: "DELETE" });
  }

  startSession(payload: { resID: number; studentID: number }) {
    return this.apiRequest<{ message: string }>("/librarian/resource-usage-logs", { method: "POST", body: payload });
  }

  endSession(usageUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/resource-usage-logs/${usageUuid}/end`, { method: "POST" });
  }
}

export const resourceService = new ResourceServiceClass();
