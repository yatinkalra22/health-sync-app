import { FHIR_SERVER_URL } from '@/lib/constants';

export async function fetchFHIRResource(resourceType: string, id: string) {
  const response = await fetch(`${FHIR_SERVER_URL}/${resourceType}/${id}`, {
    headers: { Accept: 'application/fhir+json' },
  });

  if (!response.ok) {
    throw new Error(`FHIR request failed: ${response.status}`);
  }

  return response.json();
}

export async function searchFHIRResources(
  resourceType: string,
  params: Record<string, string> = {}
) {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(
    `${FHIR_SERVER_URL}/${resourceType}?${searchParams.toString()}`,
    {
      headers: { Accept: 'application/fhir+json' },
    }
  );

  if (!response.ok) {
    throw new Error(`FHIR search failed: ${response.status}`);
  }

  const bundle = await response.json();
  return bundle.entry?.map((entry: { resource: unknown }) => entry.resource) || [];
}

export async function checkFHIRServer(): Promise<boolean> {
  try {
    const response = await fetch(`${FHIR_SERVER_URL}/metadata`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
