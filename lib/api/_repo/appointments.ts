"use client";

// =============================================================================
// APPOINTMENTS
//
// Bookings table: row mapper, query type, fetch, hooks, realtime subscription,
// and mutations (create / cancel / mark no-show). The catalog avoidance-check
// path uses the `date` filter on `AppointmentsQuery` so it doesn't pull every
// booking for every provider.
// =============================================================================

import { useEffect } from "react";
import { supabase } from "../supabase";
import type {
  Appointment,
  CreateAppointmentInput,
} from "@/lib/types";
import {
  asError,
  makeId,
  useAsync,
  useVersion,
  useVersions,
} from "./shared";

export function rowToAppointment(row: {
  id: string;
  stylist_id: string;
  client_name: string;
  service_id: string;
  date: string;
  time: string;
  status: string;
}): Appointment {
  return {
    id: row.id,
    stylistId: row.stylist_id,
    clientName: row.client_name,
    serviceId: row.service_id,
    date: row.date,
    time: row.time,
    status: row.status as Appointment["status"],
  };
}

export type AppointmentsQuery = {
  stylistId?: string;
  clientName?: string;
  /** Filter to a single ISO date "YYYY-MM-DD" — used by the catalog
   *  availability check to avoid pulling every appointment for every provider. */
  date?: string;
};

async function fetchAppointments(
  query?: AppointmentsQuery,
): Promise<Appointment[]> {
  let q = supabase.from("appointments").select("*").order("date").order("time");
  // Branches ordered alphabetically by criterion label.
  // clientName — exact match on the client_name column.
  if (query?.clientName) q = q.eq("client_name", query.clientName);
  // date — exact match on the date column (YYYY-MM-DD).
  if (query?.date) q = q.eq("date", query.date);
  // stylistId — exact match on the stylist_id column.
  if (query?.stylistId) q = q.eq("stylist_id", query.stylistId);
  const { data, error } = await q;
  if (error) throw asError(error, "listAppointments");
  return (data as Parameters<typeof rowToAppointment>[0][]).map(rowToAppointment);
}

export function useAppointments(query?: AppointmentsQuery): Appointment[] {
  const v = useVersion("appointments");
  const stylistId = query?.stylistId;
  const clientName = query?.clientName;
  const date = query?.date;
  return useAsync(
    () => fetchAppointments(query),
    [v, stylistId, clientName, date],
    [] as Appointment[],
  );
}

/**
 * Subscribe to any change on `appointments` and bump the version so
 * `useAppointments()` refetches. Mount on dashboard / catalog pages that
 * need live booking updates.
 */
export function useAppointmentsRealtime(): void {
  useEffect(() => {
    const channel = supabase
      .channel("appointments_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          useVersions.getState().bump("appointments");
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}

export async function listAppointments(
  query?: AppointmentsQuery,
): Promise<Appointment[]> {
  return fetchAppointments(query);
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const row = {
    id: makeId("a"),
    stylist_id: input.stylistId,
    client_name: input.clientName,
    service_id: input.serviceId,
    date: input.date,
    time: input.time,
    status: input.status ?? "upcoming",
  };
  const { data, error } = await supabase
    .from("appointments")
    .insert(row)
    .select()
    .single();
  if (error) throw asError(error, "createAppointment");
  useVersions.getState().bump("appointments");
  return rowToAppointment(data as Parameters<typeof rowToAppointment>[0]);
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw asError(error, "cancelAppointment");
  useVersions.getState().bump("appointments");
  return rowToAppointment(data as Parameters<typeof rowToAppointment>[0]);
}

export async function markAppointmentNoShow(id: string): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "no_show" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw asError(error, "markAppointmentNoShow");
  useVersions.getState().bump("appointments");
  return rowToAppointment(data as Parameters<typeof rowToAppointment>[0]);
}
