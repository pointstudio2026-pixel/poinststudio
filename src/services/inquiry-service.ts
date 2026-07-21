import { apiFetch } from "@/services/http-client";

export interface InquiryDto {
  id: string;
  userId: string;
  subject: string;
  message: string;
  isPublic: boolean;
  createdAt: string;
}

export interface InquiryListItemDto {
  id: string;
  subject: string;
  isPublic: boolean;
  createdAt: string;
}

export function submitInquiry(input: { subject: string; message: string; isPublic: boolean }) {
  return apiFetch<{ inquiry: InquiryDto }>("/api/inquiries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchInquiries() {
  return apiFetch<{ inquiries: InquiryListItemDto[] }>("/api/inquiries");
}

export function fetchInquiry(id: string) {
  return apiFetch<{ inquiry: InquiryDto }>(`/api/inquiries/${id}`);
}
