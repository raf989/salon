"use client";

// =============================================================================
// SERVICES
//
// Catalog-of-services CRUD-lite: row mapper + read hooks. `services` is a
// static lookup table for the prototype (no mutations live here), but it is
// versioned so future writes can bump `services` and have hooks refetch.
// =============================================================================

import { useMemo } from "react";
import { supabase } from "../supabase";
import type { Service } from "@/lib/types";
import { asError, useAsync, useVersion } from "./shared";
import { useProvider } from "./providers";

export function rowToService(row: {
  id: string;
  name: { az: string; ru: string };
  category: string;
  duration_min: number;
  price: number;
}): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Service["category"],
    durationMin: row.duration_min,
    price: Number(row.price),
  };
}

async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase.from("services").select("*").order("id");
  if (error) throw asError(error, "listServices");
  return (data as Parameters<typeof rowToService>[0][]).map(rowToService);
}

export function useServices(): Service[] {
  const v = useVersion("services");
  return useAsync(() => fetchServices(), [v], [] as Service[]);
}

export function useServicesByProvider(providerId: string): Service[] {
  const services = useServices();
  const provider = useProvider(providerId);
  return useMemo(() => {
    if (!provider) return [];
    const ids = new Set(provider.serviceIds);
    return services.filter((s) => ids.has(s.id));
  }, [services, provider]);
}

export async function listServices(): Promise<Service[]> {
  return fetchServices();
}
