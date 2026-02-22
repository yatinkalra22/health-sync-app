export interface FHIRBundle {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: FHIRBundleEntry[];
}

export interface FHIRBundleEntry {
  fullUrl?: string;
  resource: FHIRResource;
}

export interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: unknown;
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  name?: Array<{
    family?: string;
    given?: string[];
    use?: string;
  }>;
  gender?: string;
  birthDate?: string;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
}

export interface FHIRCondition extends FHIRResource {
  resourceType: 'Condition';
  subject?: { reference: string };
  code?: {
    coding?: Array<{ system: string; code: string; display: string }>;
    text?: string;
  };
  clinicalStatus?: {
    coding?: Array<{ code: string }>;
  };
  severity?: {
    coding?: Array<{ display: string }>;
  };
  onsetDateTime?: string;
  recordedDate?: string;
}
