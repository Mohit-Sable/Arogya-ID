import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { connectMongo, syncSQL, sequelize } from '../config/db.js';
import { User, HealthIdMapping, ConsentRecord, AccessLog } from '../models/sql/index.js';
import MedicalRecord from '../models/mongo/MedicalRecord.js';
import Document from '../models/mongo/Document.js';

const PRIMARY_PATIENT_HEALTH_ID = 'f29f67d1-c1ae-4060-b782-20e0c3491eaf';
const SECONDARY_PATIENT_HEALTH_ID = 'e81a33b0-4f92-49da-a2bb-781e9b216c52';

const createDummyUploadFiles = () => {
  const uploadsDir = path.resolve('./uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sampleFiles = [
    {
      name: 'cbc_blood_panel_report.pdf',
      content: '%PDF-1.4 Mock Clinical Pathology Report: Complete Blood Count & Lipid Profile. Status: NORMAL.',
    },
    {
      name: 'chest_radiograph_report.pdf',
      content: '%PDF-1.4 Mock Radiology Scan: PA view chest radiograph. Lung fields clear. Cardiac silhouette normal.',
    },
    {
      name: 'discharge_summary_asthma.pdf',
      content: '%PDF-1.4 Inpatient Discharge Summary: Acute asthma exacerbation treated with nebulization & steroids.',
    },
    {
      name: 'ecg_rhythm_strip.pdf',
      content: '%PDF-1.4 12-Lead Electrocardiogram Report: Normal sinus rhythm at 72 bpm. PR interval 140ms.',
    },
  ];

  for (const f of sampleFiles) {
    const filePath = path.join(uploadsDir, f.name);
    fs.writeFileSync(filePath, f.content, 'utf-8');
  }
};

const seed = async () => {
  try {
    await connectMongo();
    await syncSQL();

    console.log('🌱 Populating Health ID system with comprehensive clinical dummy data...\n');

    createDummyUploadFiles();

    // Clean and recreate schema cleanly
    await sequelize.sync({ force: true });
    await MedicalRecord.deleteMany({});
    await Document.deleteMany({});

    // ==========================================
    // 1. CREATE PATIENT 1 (Arjun Sharma)
    // ==========================================
    const patient1PwHash = await bcrypt.hash('patient123', 10);
    const patient1 = await User.create({
      name: 'Arjun Sharma',
      email: 'patient@demo.com',
      passwordHash: patient1PwHash,
      role: 'patient',
      healthId: PRIMARY_PATIENT_HEALTH_ID,
      bloodGroup: 'B+',
      allergies: ['Penicillin', 'Dust mites', 'Sulfa drugs'],
      emergencyContact: '+91 98765 43210 (Priya Sharma - Spouse)',
      majorConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
      chronicConditions: ['Mild Asthma (Exercise-induced)'],
      currentMedications: ['Metformin 500mg (BD)', 'Amlodipine 5mg (OD)', 'Salbutamol Inhaler (PRN)'],
      pastSurgeries: ['Laparoscopic Appendectomy (2018)', 'Deviated Septum Repair (2021)'],
    });

    await HealthIdMapping.create({
      healthId: PRIMARY_PATIENT_HEALTH_ID,
      userId: patient1.id,
    });

    // ==========================================
    // 2. CREATE PATIENT 2 (Priya Verma)
    // ==========================================
    const patient2PwHash = await bcrypt.hash('patient123', 10);
    const patient2 = await User.create({
      name: 'Priya Verma',
      email: 'priya@demo.com',
      passwordHash: patient2PwHash,
      role: 'patient',
      healthId: SECONDARY_PATIENT_HEALTH_ID,
      bloodGroup: 'O+',
      allergies: ['Ciprofloxacin', 'Peanuts'],
      emergencyContact: '+91 91234 56780 (Vikram Verma - Brother)',
      majorConditions: ['Hypothyroidism', 'Migraine with Aura'],
      chronicConditions: ['Allergic Rhinitis'],
      currentMedications: ['Levothyroxine 50mcg (OD)', 'Sumatriptan 50mg (SOS)'],
      pastSurgeries: ['Cesarean Section (2022)'],
    });

    await HealthIdMapping.create({
      healthId: SECONDARY_PATIENT_HEALTH_ID,
      userId: patient2.id,
    });

    // ==========================================
    // 3. CREATE CLINICAL PROVIDERS & ROLES
    // ==========================================
    const docPwHash = await bcrypt.hash('hospital123', 10);
    const doctor1 = await User.create({
      name: 'Dr. Meera Patel',
      email: 'doctor@cityhospital.com',
      passwordHash: docPwHash,
      role: 'hospital',
    });

    const doctor2 = await User.create({
      name: 'Dr. Rajesh Nair (Trauma Care)',
      email: 'emergency.doc@apollo.org',
      passwordHash: docPwHash,
      role: 'hospital',
    });

    const insurerPwHash = await bcrypt.hash('insurer123', 10);
    const insurer = await User.create({
      name: 'Vikram Malhotra (HealthInsure)',
      email: 'claims@healthinsure.com',
      passwordHash: insurerPwHash,
      role: 'insurer',
    });

    const responderPwHash = await bcrypt.hash('emergency123', 10);
    const responder = await User.create({
      name: 'Officer Sunil Shinde (108 Paramedic)',
      email: 'responder@ems.gov',
      passwordHash: responderPwHash,
      role: 'emergency_responder',
    });

    const pharmacistPwHash = await bcrypt.hash('pharmacist123', 10);
    const pharmacist = await User.create({
      name: 'Ananya Roy (MedPlus Pharmacy)',
      email: 'pharmacist@medplus.com',
      passwordHash: pharmacistPwHash,
      role: 'pharmacist',
    });

    // ==========================================
    // 4. MEDICAL RECORDS (CLINICAL ENCOUNTERS)
    // ==========================================
    const records = [
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        type: 'diagnosis',
        data: {
          condition: 'Type 2 Diabetes Mellitus',
          notes: 'Fasting blood glucose: 178 mg/dL. HbA1c: 7.9%. Prescribed Metformin 500mg twice daily with meal plan.',
          severity: 'Moderate',
          icdCode: 'E11.9',
        },
        addedBy: doctor1.id,
        addedByName: doctor1.name,
        createdAt: new Date('2024-03-15T10:30:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        type: 'prescription',
        data: {
          medications: [
            { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily (BD)', duration: '90 days' },
            { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily (OD)', duration: '90 days' },
          ],
          prescribedBy: 'Dr. Meera Patel',
          notes: 'Review in 3 months. Monitor weekly morning blood glucose log.',
        },
        addedBy: doctor1.id,
        addedByName: doctor1.name,
        createdAt: new Date('2024-03-15T10:45:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        type: 'diagnosis',
        data: {
          condition: 'Essential Hypertension',
          notes: 'Sitting BP measured at 148/94 mmHg across 2 serial readings. Fundoscopy normal. Advised low-sodium DASH diet.',
          severity: 'Mild',
          icdCode: 'I10',
        },
        addedBy: doctor1.id,
        addedByName: doctor1.name,
        createdAt: new Date('2024-04-10T14:15:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        type: 'vaccination',
        data: {
          vaccine: 'COVID-19 Bivalent Booster (Covishield)',
          batchNumber: 'COV-2024-8849',
          administeredAt: 'City Hospital Immunization Wing, Mumbai',
          nextDose: 'Annual review',
        },
        addedBy: doctor1.id,
        addedByName: doctor1.name,
        createdAt: new Date('2024-06-20T09:00:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        type: 'discharge_summary',
        data: {
          admissionDate: '2024-08-01',
          dischargeDate: '2024-08-03',
          reason: 'Acute Bronchospasm & Asthma Exacerbation',
          treatmentGiven: 'Nebulized Budecort + Duolin, IV Hydrocortisone, supplemental O2',
          conditionAtDischarge: 'Hemodynamically stable. SpO2 99% on ambient air.',
          followUp: 'Pulmonology OPD review in 10 days with peak flow diary.',
        },
        addedBy: doctor2.id,
        addedByName: doctor2.name,
        createdAt: new Date('2024-08-03T16:00:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        type: 'prescription',
        data: {
          medications: [
            { name: 'Salbutamol MDI', dosage: '100mcg', frequency: '2 puffs SOS (as needed)', duration: '1 inhaler' },
            { name: 'Montelukast', dosage: '10mg', frequency: 'Once daily at bedtime', duration: '30 days' },
          ],
          prescribedBy: 'Dr. Rajesh Nair',
          notes: 'Rinse mouth after inhaler use. Avoid cold drafts and unmasked dust exposure.',
        },
        addedBy: doctor2.id,
        addedByName: doctor2.name,
        createdAt: new Date('2024-08-03T16:30:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        type: 'surgery',
        data: {
          procedure: 'Laparoscopic Appendectomy',
          surgeon: 'Dr. Vikram Singh (Chief Surgeon)',
          hospital: 'Metro General Hospital, Pune',
          outcome: 'Successful elective laparoscopic resection. No intraoperative complications.',
          anesthesia: 'General Endotracheal Anesthesia',
        },
        addedBy: doctor1.id,
        addedByName: 'Dr. Vikram Singh',
        createdAt: new Date('2018-11-05T11:00:00Z'),
      },
    ];

    await MedicalRecord.insertMany(records);

    // ==========================================
    // 5. DOCUMENT VAULT ENTRIES
    // ==========================================
    const documents = [
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        fileName: 'cbc_blood_panel_report.pdf',
        filePath: 'uploads/cbc_blood_panel_report.pdf',
        mimeType: 'application/pdf',
        type: 'lab_result',
        uploadedAt: new Date('2024-03-15T11:00:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        fileName: 'chest_radiograph_report.pdf',
        filePath: 'uploads/chest_radiograph_report.pdf',
        mimeType: 'application/pdf',
        type: 'xray',
        uploadedAt: new Date('2024-08-01T15:00:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        fileName: 'discharge_summary_asthma.pdf',
        filePath: 'uploads/discharge_summary_asthma.pdf',
        mimeType: 'application/pdf',
        type: 'report',
        uploadedAt: new Date('2024-08-03T17:00:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        fileName: 'ecg_rhythm_strip.pdf',
        filePath: 'uploads/ecg_rhythm_strip.pdf',
        mimeType: 'application/pdf',
        type: 'lab_result',
        uploadedAt: new Date('2024-09-10T08:30:00Z'),
      },
    ];

    for (const doc of documents) {
      await Document.create(doc);
    }

    // ==========================================
    // 6. CONSENT RECORDS
    // ==========================================
    await ConsentRecord.bulkCreate([
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        requestedBy: doctor1.id,
        requestedByName: doctor1.name,
        requestedByRole: 'hospital',
        status: 'approved',
        requestedAt: new Date('2024-03-15T09:00:00Z'),
        decidedAt: new Date('2024-03-15T09:05:00Z'),
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        requestedBy: doctor2.id,
        requestedByName: doctor2.name,
        requestedByRole: 'hospital',
        status: 'pending',
        requestedAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        requestedBy: insurer.id,
        requestedByName: insurer.name,
        requestedByRole: 'insurer',
        status: 'pending',
        requestedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        requestedBy: pharmacist.id,
        requestedByName: pharmacist.name,
        requestedByRole: 'pharmacist',
        status: 'approved',
        requestedAt: new Date('2024-08-04T12:00:00Z'),
        decidedAt: new Date('2024-08-04T12:02:00Z'),
      },
    ]);

    // ==========================================
    // 7. TAMPER-EVIDENT AUDIT ACCESS LOGS
    // ==========================================
    await AccessLog.bulkCreate([
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        accessedBy: null, // Public Emergency QR Access
        accessedByName: 'Emergency Scanner (Unit 108 EMS)',
        role: 'emergency_responder',
        ipAddress: '192.168.1.42',
        timestamp: new Date(Date.now() - 3600000 * 18),
        fieldsReturned: 'bloodGroup, allergies, emergencyContact, majorConditions',
        wasEmergencyMode: true,
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        accessedBy: doctor1.id,
        accessedByName: doctor1.name,
        role: 'hospital',
        ipAddress: '10.0.4.18',
        timestamp: new Date(Date.now() - 3600000 * 8),
        fieldsReturned: 'full_record',
        wasEmergencyMode: false,
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        accessedBy: pharmacist.id,
        accessedByName: pharmacist.name,
        role: 'pharmacist',
        ipAddress: '192.168.10.5',
        timestamp: new Date(Date.now() - 3600000 * 5),
        fieldsReturned: 'prescriptions, allergies',
        wasEmergencyMode: false,
      },
      {
        healthId: PRIMARY_PATIENT_HEALTH_ID,
        accessedBy: null,
        accessedByName: 'QR Radar Lock (City Trauma Bay)',
        role: 'emergency_responder',
        ipAddress: '172.16.0.22',
        timestamp: new Date(Date.now() - 3600000 * 1),
        fieldsReturned: 'bloodGroup, allergies, emergencyContact, majorConditions',
        wasEmergencyMode: true,
      },
    ]);

    console.log('✅ Created Patients:');
    console.log(`   1. ${patient1.name} (${patient1.email}) - Health ID: ${PRIMARY_PATIENT_HEALTH_ID}`);
    console.log(`   2. ${patient2.name} (${patient2.email}) - Health ID: ${SECONDARY_PATIENT_HEALTH_ID}`);
    console.log('✅ Created Hospital / Doctors (Dr. Meera Patel, Dr. Rajesh Nair)');
    console.log('✅ Created Insurer (Vikram Malhotra - HealthInsure)');
    console.log('✅ Created Emergency Responder (Officer Sunil Shinde)');
    console.log('✅ Created Pharmacist (Ananya Roy - MedPlus)');
    console.log(`✅ Seeded ${records.length} clinical medical encounters`);
    console.log(`✅ Seeded ${documents.length} verified vault documents`);
    console.log('✅ Seeded Consent Matrix (Approved & Pending requests)');
    console.log('✅ Seeded Tamper-Evident Access Ledger with emergency scans\n');

    console.log('='.repeat(60));
    console.log('🎉 DUMMY DATA SEED COMPLETE! DEMO CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('👤 PATIENT:             patient@demo.com          /  patient123');
    console.log('👤 PATIENT 2:           priya@demo.com            /  patient123');
    console.log('🏥 HOSPITAL / DOCTOR:   doctor@cityhospital.com   /  hospital123');
    console.log('💼 INSURER AUDITOR:     claims@healthinsure.com   /  insurer123');
    console.log('🚨 EMERGENCY EMS:       responder@ems.gov         /  emergency123');
    console.log('💊 PHARMACIST:          pharmacist@medplus.com    /  pharmacist123');
    console.log('='.repeat(60));
    console.log(`🌐 Primary Health ID:   ${PRIMARY_PATIENT_HEALTH_ID}`);
    console.log(`🚨 Emergency Triage:    http://localhost:5173/emergency/${PRIMARY_PATIENT_HEALTH_ID}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (err) {
    console.error('❌ Dummy data seeding failed:', err);
    process.exit(1);
  }
};

seed();
