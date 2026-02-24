/**
 * Sample payer policy definitions for mock mode.
 * These are used by the demo agent runner and can be seeded into Elasticsearch
 * for production testing via `npm run setup:policies`.
 */

export const SAMPLE_POLICIES = [
  {
    policy_id: 'MEDICARE_KNEE_ARTHROSCOPY',
    payer: 'Medicare',
    policy_name: 'Knee Arthroscopy Coverage Criteria',
    policy_text: `
Medicare covers knee arthroscopy when:
1. Patient has documented knee pain and mechanical symptoms
2. Conservative treatment (physical therapy) tried for 6+ weeks
3. MRI confirms structural damage
4. Pain level >= 5/10 impacting daily activities
5. Patient medically appropriate for surgery

Required documentation:
- Physical therapy notes (6+ weeks)
- MRI report with interpretation
- Clinical evaluation notes
- Pain assessment
    `,
    procedure_codes: ['27447', '29881', '29880'],
    diagnosis_codes: ['M17.11', 'M23.201', 'S83.201A'],
    coverage_criteria: [
      'Failed conservative treatment 6+ weeks',
      'MRI confirms structural damage',
      'Pain >= 5/10',
      'Medical clearance',
    ],
    documentation_requirements: [
      'PT notes',
      'MRI report',
      'Clinical eval',
      'Pain assessment',
    ],
  },
  {
    policy_id: 'BCBS_KNEE_REPLACEMENT',
    payer: 'Blue Cross',
    policy_name: 'Total Knee Replacement Coverage',
    policy_text: `
Blue Cross covers total knee replacement (TKR) when:
1. Significant knee osteoarthritis confirmed by imaging
2. Failed conservative management minimum 3 months
3. Functional limitation documented
4. BMI < 40 (or documented plan for weight management)
5. No active infections

Required documentation:
- X-ray or MRI showing bone-on-bone
- Physical therapy records (12+ sessions)
- Orthopedic evaluation
- Pre-surgical medical clearance
    `,
    procedure_codes: ['27447'],
    diagnosis_codes: ['M17.11', 'M17.12'],
    coverage_criteria: [
      'Imaging confirms osteoarthritis',
      'Conservative management 3+ months',
      'Functional limitation documented',
      'BMI assessment',
      'Pre-surgical clearance',
    ],
    documentation_requirements: [
      'Imaging reports',
      'PT records (12+ sessions)',
      'Orthopedic evaluation',
      'Medical clearance',
      'BMI documentation',
    ],
  },
  {
    policy_id: 'AETNA_HIP_REPLACEMENT',
    payer: 'Aetna',
    policy_name: 'Total Hip Replacement Coverage',
    policy_text: `
Aetna covers total hip arthroplasty when:
1. Diagnosis of hip osteoarthritis or avascular necrosis
2. Failed conservative treatment including PT and medications
3. Pain and functional limitation impacting ADLs
4. Imaging confirms joint damage
5. Patient appropriate for surgery

Required documentation:
- Hip X-ray or MRI
- Physical therapy notes
- Pain management records
- Functional assessment
    `,
    procedure_codes: ['27130'],
    diagnosis_codes: ['M16.11', 'M87.051'],
    coverage_criteria: [
      'Confirmed hip osteoarthritis or AVN',
      'Failed conservative treatment',
      'Impact on daily activities',
      'Imaging confirms damage',
    ],
    documentation_requirements: [
      'Hip imaging',
      'PT notes',
      'Pain management records',
      'Functional assessment',
    ],
  },
];
