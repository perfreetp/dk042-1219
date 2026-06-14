import { create } from 'zustand';
import { Appliance, NewApplianceCandidate, Reminder } from '@/types';
import { mockAppliances, mockCandidates } from '@/data/mockData';
import { generateReminders, generateId } from '@/utils/calculator';

interface ApplianceStore {
  appliances: Appliance[];
  candidates: NewApplianceCandidate[];
  reminders: Reminder[];
  selectedApplianceId: string | null;

  addAppliance: (appliance: Omit<Appliance, 'id' | 'createdAt'>) => void;
  updateAppliance: (id: string, data: Partial<Appliance>) => void;
  deleteAppliance: (id: string) => void;
  setSelectedAppliance: (id: string | null) => void;

  addCandidate: (candidate: Omit<NewApplianceCandidate, 'id'>) => void;
  toggleFavorite: (id: string) => void;
  updateCandidate: (id: string, data: Partial<NewApplianceCandidate>) => void;
  deleteCandidate: (id: string) => void;

  markReminderRead: (id: string) => void;
  toggleReminderEnabled: (id: string) => void;
  refreshReminders: () => void;
  markAllRemindersRead: () => void;

  initStore: () => void;
}

export const useApplianceStore = create<ApplianceStore>((set, get) => ({
  appliances: [],
  candidates: [],
  reminders: [],
  selectedApplianceId: null,

  addAppliance: (appliance) => {
    const newAppliance: Appliance = {
      ...appliance,
      id: generateId(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => {
      const newAppliances = [...state.appliances, newAppliance];
      return {
        appliances: newAppliances,
        reminders: generateReminders(newAppliances),
      };
    });
  },

  updateAppliance: (id, data) => {
    set((state) => {
      const newAppliances = state.appliances.map((a) =>
        a.id === id ? { ...a, ...data } : a
      );
      return {
        appliances: newAppliances,
        reminders: generateReminders(newAppliances),
      };
    });
  },

  deleteAppliance: (id) => {
    set((state) => {
      const newAppliances = state.appliances.filter((a) => a.id !== id);
      const newCandidates = state.candidates.filter((c) => c.compareTargetId !== id);
      return {
        appliances: newAppliances,
        candidates: newCandidates,
        reminders: generateReminders(newAppliances),
        selectedApplianceId:
          state.selectedApplianceId === id ? null : state.selectedApplianceId,
      };
    });
  },

  setSelectedAppliance: (id) => {
    set({ selectedApplianceId: id });
  },

  addCandidate: (candidate) => {
    const newCandidate: NewApplianceCandidate = {
      ...candidate,
      id: generateId(),
    };
    set((state) => ({
      candidates: [...state.candidates, newCandidate],
    }));
  },

  toggleFavorite: (id) => {
    set((state) => ({
      candidates: state.candidates.map((c) =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
      ),
    }));
  },

  updateCandidate: (id, data) => {
    set((state) => ({
      candidates: state.candidates.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    }));
  },

  deleteCandidate: (id) => {
    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== id),
    }));
  },

  markReminderRead: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, isRead: true } : r
      ),
    }));
  },

  toggleReminderEnabled: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  },

  refreshReminders: () => {
    set((state) => ({
      reminders: generateReminders(state.appliances),
    }));
  },

  markAllRemindersRead: () => {
    set((state) => ({
      reminders: state.reminders.map((r) => ({ ...r, isRead: true })),
    }));
  },

  initStore: () => {
    const { appliances } = get();
    if (appliances.length === 0) {
      console.log('[Store] 初始化Mock数据');
      set({
        appliances: mockAppliances,
        candidates: mockCandidates,
        reminders: generateReminders(mockAppliances),
        selectedApplianceId: mockAppliances[0]?.id || null,
      });
    }
  },
}));
