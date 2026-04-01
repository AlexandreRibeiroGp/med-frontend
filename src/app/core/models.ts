export type Role = 'ADMIN' | 'PATIENT' | 'DOCTOR';
export type DoctorSpecialty = 'GERAL';
export type AppointmentStatus = 'PENDING_PAYMENT' | 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'CANCELLED' | 'COMPLETED';
export type PaymentMethod = 'PIX' | 'CARD';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  active: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface RegisterPatientRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  documentNumber?: string | null;
  birthDate?: string | null;
  healthInsurance?: string | null;
  profession?: string | null;
  address?: string | null;
}

export interface RegisterDoctorRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  crm: string;
  specialty: DoctorSpecialty;
  biography?: string | null;
  telemedicineEnabled: boolean;
}

export interface DoctorResponse {
  id: number;
  user: UserResponse;
  crm: string;
  specialty: DoctorSpecialty;
  biography: string | null;
  telemedicineEnabled: boolean;
  profilePhotoUrl: string | null;
}

export interface AvailabilitySlotResponse {
  id: number;
  doctorProfileId: number;
  startAt: string;
  endAt: string;
  available: boolean;
}

export interface AppointmentResponse {
  id: number;
  doctorProfileId: number;
  doctorName: string;
  patientProfileId: number;
  patientName: string;
  availabilitySlotId: number | null;
  scheduledAt: string;
  status: AppointmentStatus;
  appointmentType: 'VIDEO' | 'IN_PERSON';
  meetingRoomCode: string | null;
  notes: string | null;
  paymentStatus: PaymentStatus | null;
}

export interface PaymentResponse {
  id: number;
  appointmentId: number;
  appointmentStatus: AppointmentStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  providerReference: string;
  checkoutUrl: string | null;
  pixCode: string | null;
  pixQrCodeBase64: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
}

export interface AppointmentCheckoutResponse {
  appointment: AppointmentResponse;
  payment: PaymentResponse;
}

export interface MedicalRecordResponse {
  id: number;
  appointmentId: number;
  doctorProfileId: number;
  doctorName: string;
  patientProfileId: number;
  patientName: string;
  symptoms: string | null;
  diagnosis: string | null;
  prescription: string | null;
  patientProfession: string | null;
  patientAddress: string | null;
  doctorCrm: string | null;
  doctorSpecialty: string | null;
  requiresDigitalSignature: boolean;
  preferredCertificateType: 'A1' | 'A3';
  prescriptionFileName: string | null;
  hasPrescriptionFile: boolean;
  prescriptionSignatureStatus: 'NOT_GENERATED' | 'GENERATED' | 'PENDING_PROVIDER' | 'SIGNED';
  prescriptionSignatureProvider: string | null;
  prescriptionSignedAt: string | null;
  clinicalNotes: string | null;
  createdAt: string;
}

export interface PrescriptionSignatureStartResponse {
  medicalRecord: MedicalRecordResponse;
  provider: string | null;
  bridgeUrl: string | null;
  bridgePayload: {
    medicalRecordId: number;
    requestId: string;
    provider: string;
    certificateType: 'A1' | 'A3';
    fileName: string;
    doctorName: string;
    patientName: string;
    downloadUrl: string;
    uploadUrl: string;
  } | null;
  message: string | null;
}

export interface PatientProfileResponse {
  id: number;
  user: UserResponse;
  documentNumber: string | null;
  birthDate: string | null;
  healthInsurance: string | null;
  profession: string | null;
  address: string | null;
}
