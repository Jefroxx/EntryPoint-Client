import { BaseService } from "./BaseService";

export interface SubjectRecord {
  subjectID: number;
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

  updateSubject(subjectID: number, payload: { name?: string; classificationCode?: string | null }) {
    return this.apiRequest<{ message: string; subject: SubjectRecord }>(`/librarian/subjects/${subjectID}`, { method: "PATCH", body: payload });
  }

  deleteSubject(subjectID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/subjects/${subjectID}`, { method: "DELETE" });
  }
}

export const subjectService = new SubjectServiceClass();
