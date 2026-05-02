"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Appointment, Role } from "./types";
import { APPOINTMENTS } from "./mock-data";

type Store = {
  role: Role;
  setRole: (r: Role) => void;
  appointments: Appointment[];
  addAppointment: (a: Appointment) => void;
  cancelAppointment: (id: string) => void;
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      role: "client",
      setRole: (r) => set({ role: r }),
      appointments: APPOINTMENTS,
      addAppointment: (a) =>
        set((state) => ({ appointments: [...state.appointments, a] })),
      cancelAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.map((appt) =>
            appt.id === id ? { ...appt, status: "cancelled" } : appt,
          ),
        })),
    }),
    {
      name: "salon-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ role: state.role }),
    },
  ),
);
