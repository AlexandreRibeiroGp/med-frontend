import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AppointmentCheckoutResponse,
  AppointmentResponse,
  AppointmentStatus,
  AvailabilitySlotResponse,
  DoctorResponse,
  MedicalRecordResponse,
  PaymentResponse,
  PatientProfileResponse,
  PaymentMethod,
  PrescriptionSignatureStartResponse,
  RegisterDoctorRequest,
  RegisterPatientRequest,
  UserResponse
} from './models';

const API_URL = '/api';

@Injectable({ providedIn: 'root' })
export class TelemedApiService {
  private readonly http = inject(HttpClient);

  registerPatient(payload: RegisterPatientRequest) {
    return this.http.post(`${API_URL}/auth/register/patients`, payload);
  }

  registerDoctor(payload: RegisterDoctorRequest) {
    return this.http.post<DoctorResponse>(`${API_URL}/auth/register/doctors`, payload);
  }

  uploadDoctorPhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DoctorResponse>(`${API_URL}/doctors/me/photo`, formData);
  }

  registerAdmin(payload: RegisterPatientRequest) {
    return this.http.post(`${API_URL}/auth/register/admins`, payload);
  }

  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${API_URL}/users`);
  }

  getDoctors(specialty?: string): Observable<DoctorResponse[]> {
    const params = specialty ? new HttpParams().set('specialty', specialty) : undefined;
    return this.http.get<DoctorResponse[]>(`${API_URL}/doctors`, { params });
  }

  getSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/doctors/specialties`);
  }

  getDoctorAvailability(doctorId: number): Observable<AvailabilitySlotResponse[]> {
    return this.http.get<AvailabilitySlotResponse[]>(`${API_URL}/doctors/${doctorId}/availability`);
  }

  createAvailabilitySlot(payload: { startAt: string; endAt: string }) {
    return this.http.post<AvailabilitySlotResponse[]>(`${API_URL}/doctors/availability`, payload);
  }

  deleteAvailabilityRange(payload: { startAt: string; endAt: string }) {
    return this.http.post<void>(`${API_URL}/doctors/availability/delete-range`, payload);
  }

  deleteAvailabilitySlot(slotId: number) {
    return this.http.delete<void>(`${API_URL}/doctors/availability/${slotId}`);
  }

  createAppointment(payload: {
    doctorProfileId: number;
    availabilitySlotId?: number | null;
    scheduledAt?: string | null;
    appointmentType: 'VIDEO' | 'IN_PERSON';
    notes?: string | null;
  }) {
    return this.http.post<AppointmentResponse>(`${API_URL}/appointments`, payload);
  }

  checkoutAppointment(payload: {
    doctorProfileId: number;
    availabilitySlotId?: number | null;
    scheduledAt?: string | null;
    appointmentType: 'VIDEO' | 'IN_PERSON';
    notes?: string | null;
    paymentMethod: PaymentMethod;
  }) {
    return this.http.post<AppointmentCheckoutResponse>(`${API_URL}/appointments/checkout`, payload);
  }

  getAppointments(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${API_URL}/appointments`);
  }

  getPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${API_URL}/payments`);
  }

  getPayment(paymentId: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${API_URL}/payments/${paymentId}`);
  }

  confirmPayment(paymentId: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${API_URL}/payments/${paymentId}/confirm`, {});
  }

  updateAppointmentStatus(appointmentId: number, status: AppointmentStatus): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${API_URL}/appointments/${appointmentId}/status`, { status });
  }

  createMedicalRecord(payload: {
    appointmentId: number;
    symptoms?: string | null;
    diagnosis?: string | null;
    prescription?: string | null;
    requiresDigitalSignature?: boolean;
    preferredCertificateType?: 'A1' | 'A3';
    clinicalNotes?: string | null;
  }) {
    return this.http.post<MedicalRecordResponse>(`${API_URL}/medical-records`, payload);
  }

  uploadPrescription(recordId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MedicalRecordResponse>(`${API_URL}/medical-records/${recordId}/prescription`, formData);
  }

  generatePrescriptionPdf(recordId: number) {
    return this.http.post<MedicalRecordResponse>(`${API_URL}/medical-records/${recordId}/prescription/generate`, {});
  }

  startPrescriptionSignature(recordId: number) {
    return this.http.post<PrescriptionSignatureStartResponse>(`${API_URL}/medical-records/${recordId}/prescription/signature/start`, {});
  }

  uploadSignedPrescription(recordId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MedicalRecordResponse>(`${API_URL}/medical-records/${recordId}/prescription/signature/upload`, formData);
  }

  downloadPrescription(recordId: number) {
    return this.http.get(`${API_URL}/medical-records/${recordId}/prescription`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  getMedicalRecords(): Observable<MedicalRecordResponse[]> {
    return this.http.get<MedicalRecordResponse[]>(`${API_URL}/medical-records`);
  }

  getCurrentPatientProfile(): Observable<PatientProfileResponse> {
    return this.http.get<PatientProfileResponse>(`${API_URL}/patients/me`);
  }

  updateCurrentPatientProfile(payload: {
    fullName: string;
    phoneNumber?: string | null;
    profession: string;
    address?: string | null;
  }) {
    return this.http.patch<PatientProfileResponse>(`${API_URL}/patients/me`, payload);
  }

  updateCurrentPatientProfession(payload: { profession: string }) {
    return this.http.patch<PatientProfileResponse>(`${API_URL}/patients/me/profession`, payload);
  }

  getCurrentDoctorProfile(): Observable<DoctorResponse> {
    return this.http.get<DoctorResponse>(`${API_URL}/doctors/me`);
  }

  updateCurrentDoctorProfile(payload: {
    fullName: string;
    phoneNumber?: string | null;
    crm: string;
    biography?: string | null;
    telemedicineEnabled: boolean;
  }) {
    return this.http.patch<DoctorResponse>(`${API_URL}/doctors/me`, payload);
  }
}
