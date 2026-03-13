import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AppointmentResponse,
  AppointmentStatus,
  AvailabilitySlotResponse,
  DoctorResponse,
  MedicalRecordResponse,
  PatientProfileResponse,
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
    return this.http.post(`${API_URL}/auth/register/doctors`, payload);
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
    return this.http.post<AvailabilitySlotResponse>(`${API_URL}/doctors/availability`, payload);
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

  getAppointments(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${API_URL}/appointments`);
  }

  updateAppointmentStatus(appointmentId: number, status: AppointmentStatus): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`${API_URL}/appointments/${appointmentId}/status`, { status });
  }

  createMedicalRecord(payload: {
    appointmentId: number;
    symptoms?: string | null;
    diagnosis?: string | null;
    prescription?: string | null;
    clinicalNotes?: string | null;
  }) {
    return this.http.post<MedicalRecordResponse>(`${API_URL}/medical-records`, payload);
  }

  getMedicalRecords(): Observable<MedicalRecordResponse[]> {
    return this.http.get<MedicalRecordResponse[]>(`${API_URL}/medical-records`);
  }

  getCurrentPatientProfile(): Observable<PatientProfileResponse> {
    return this.http.get<PatientProfileResponse>(`${API_URL}/patients/me`);
  }
}
