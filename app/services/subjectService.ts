import { BaseService } from "./BaseService";

export interface SubjectRecord {
  subjectID: number;
  uuid: string;
  name: string;
  classificationCode: string | null;
  books_count: number;
}

class SubjectServiceClass extends BaseService {
  fetchSubjects() {
    return this.apiRequest<{ subjects: SubjectRecord[] }>("/librarian/subjects");
  }

  createSubject(payload: { name: string; classificationCode?: string | null }) {
    return this.apiRequest<{ message: string; subject: SubjectRecord }>("/librarian/subjects", { method: "POST", body: payload });
  }

  updateSubject(subjectUuid: string, payload: { name?: string; classificationCode?: string | null }) {
    return this.apiRequest<{ message: string; subject: SubjectRecord }>(`/librarian/subjects/${subjectUuid}`, { method: "PATCH", body: payload });
  }

  deleteSubject(subjectUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/subjects/${subjectUuid}`, { method: "DELETE" });
  }
}

export const subjectService = new SubjectServiceClass();
