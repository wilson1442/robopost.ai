export interface EarlyAccessRequest {
  email: string;
  companyName?: string;
}

export interface EarlyAccessPayload {
  email: string;
  companyName?: string;
  date: string; // ISO 8601 timestamp
  source: "robopost.ai";
}

export interface EarlyAccessResponse {
  success: boolean;
  message?: string;
}

