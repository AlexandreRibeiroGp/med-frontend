export type Role = 'ADMIN' | 'PATIENT' | 'DOCTOR';
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
}

export interface RegisterDoctorRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  crm: string;
  specialty: string;
  biography?: string | null;
  telemedicineEnabled: boolean;
}

export interface DoctorResponse {
  id: number;
  user: UserResponse;
  crm: string;
  specialty: string;
  biography: string | null;
  telemedicineEnabled: boolean;
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
  clinicalNotes: string | null;
  createdAt: string;
}

export interface PatientProfileResponse {
  id: number;
  user: UserResponse;
  documentNumber: string | null;
  birthDate: string | null;
  healthInsurance: string | null;
}
