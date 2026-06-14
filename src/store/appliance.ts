import { create } from 'zustand';
import { Appliance, NewApplianceCandidate, Reminder } from '@/types';
import { mockAppliances, mockCandidates } from '@/data/mockData';
import { generateReminders, generateId } from '@/utils/calculator';

const STORAGE_KEY = 'appliance_decision_data_v1';

interface PersistedData {
  appliances: Appliance[];
  candidates: NewApplianceCandidate[];
  reminders: Reminder[];
  selectedApplianceId: string | null;
  isInitialized: boolean;
}

const loadFromStorage = (): PersistedData | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
    return null;
  } catch {
    return null;
  }
};

const saveToStorage = (data: PersistedData) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
};

const clearStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
};

interface ApplianceStore {
  appliances: Appliance[];
  candidates: NewApplianceCandidate[];
  reminders: Reminder[];
  selectedApplianceId: string | null;
  storeInitialized: boolean;

  addAppliance: (appliance: Omit<Appliance, 'id' | 'createdAt'>) => void;
  updateAppliance: (id: string, data: Partial<Appliance>) => void;
  deleteAppliance: (id: string) => void;
  setSelectedAppliance: (id: string | null) => void;

  addCandidate: (candidate: Omit<NewApplianceCandidate, 'id'>) => void;
  toggleFavorite: (id: string) => void;
  updateCandidate: (id: string, data: Partial<NewApplianceCandidate>) => void;
  deleteCandidate: (id: string) => void;

  markReminderRead: (id: string) => void;
  markAsRead: (id: string) => void;
  toggleReminderEnabled: (id: string, enabled: boolean) => void;
  refreshReminders: () => void;
  markAllRemindersRead: () => void;
  markAllAsRead: () => void;

  initStore: () => void;
  resetToMock: () => void;
}

const getInitialState = () => {
  const persisted = loadFromStorage();
  if (persisted && persisted.isInitialized) {
    return {
      appliances: persisted.appliances,
      candidates: persisted.candidates,
      reminders: persisted.reminders,
      selectedApplianceId: persisted.selectedApplianceId,
      storeInitialized: true,
    };
  }
  return {
    appliances: [],
    candidates: [],
    reminders: [],
    selectedApplianceId: null,
    storeInitialized: false,
  };
};

export const useApplianceStore = create<ApplianceStore>((set, get) => ({
  ...getInitialState(),

  addAppliance: (appliance) => {
    const newAppliance: Appliance = {
      ...appliance,
      id: generateId(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => {
      const newAppliances = [...state.appliances, newAppliance];
      const newReminders = mergeReminders(
        state.reminders,
        generateReminders(newAppliances)
      );
      const newState = {
        appliances: newAppliances,
        reminders: newReminders,
        selectedApplianceId: state.selectedApplianceId || newAppliance.id,
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  updateAppliance: (id, data) => {
    set((state) => {
      const newAppliances = state.appliances.map((a) =>
        a.id === id ? { ...a, ...data } : a
      );
      const newReminders = mergeReminders(
        state.reminders,
        generateReminders(newAppliances)
      );
      const newState = {
        appliances: newAppliances,
        reminders: newReminders,
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  deleteAppliance: (id) => {
    set((state) => {
      const newAppliances = state.appliances.filter((a) => a.id !== id);
      const newCandidates = state.candidates.filter((c) => c.compareTargetId !== id);
      const newReminders = mergeReminders(
        state.reminders.filter((r) => r.applianceId !== id),
        generateReminders(newAppliances)
      );
      const newState = {
        appliances: newAppliances,
        candidates: newCandidates,
        reminders: newReminders,
        selectedApplianceId:
          state.selectedApplianceId === id ? null : state.selectedApplianceId,
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  setSelectedAppliance: (id) => {
    set((state) => {
      const newState = { selectedApplianceId: id };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  addCandidate: (candidate) => {
    const newCandidate: NewApplianceCandidate = {
      ...candidate,
      id: generateId(),
    };
    set((state) => {
      const newState = {
        candidates: [...state.candidates, newCandidate],
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  toggleFavorite: (id) => {
    set((state) => {
      const newState = {
        candidates: state.candidates.map((c) =>
          c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
        ),
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  updateCandidate: (id, data) => {
    set((state) => {
      const newState = {
        candidates: state.candidates.map((c) =>
          c.id === id ? { ...c, ...data } : c
        ),
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  deleteCandidate: (id) => {
    set((state) => {
      const newState = {
        candidates: state.candidates.filter((c) => c.id !== id),
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  markReminderRead: (id) => {
    set((state) => {
      const newState = {
        reminders: state.reminders.map((r) =>
          r.id === id ? { ...r, isRead: true } : r
        ),
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  markAsRead: (id) => {
    get().markReminderRead(id);
  },

  toggleReminderEnabled: (id, enabled) => {
    set((state) => {
      const newState = {
        reminders: state.reminders.map((r) =>
          r.id === id ? { ...r, enabled } : r
        ),
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  refreshReminders: () => {
    set((state) => {
      const newReminders = mergeReminders(
        state.reminders,
        generateReminders(state.appliances)
      );
      const newState = {
        reminders: newReminders,
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  markAllRemindersRead: () => {
    set((state) => {
      const newState = {
        reminders: state.reminders.map((r) => ({ ...r, isRead: true })),
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
  },

  markAllAsRead: () => {
    get().markAllRemindersRead();
  },

  initStore: () => {
    const { storeInitialized, appliances } = get();
    if (storeInitialized) {
      if (appliances.length > 0) {
        get().refreshReminders();
      }
      return;
    }
    console.log('[Store] 首次启动，加载Mock数据');
    const initialAppliances = mockAppliances;
    const initialCandidates = mockCandidates;
    const initialReminders = generateReminders(initialAppliances);
    const initialState = {
      appliances: initialAppliances,
      candidates: initialCandidates,
      reminders: initialReminders,
      selectedApplianceId: initialAppliances[0]?.id || null,
      storeInitialized: true,
    };
    set(initialState);
    persistState({ ...get(), ...initialState });
  },

  resetToMock: () => {
    clearStorage();
    const initialAppliances = mockAppliances;
    const initialCandidates = mockCandidates;
    const initialReminders = generateReminders(initialAppliances);
    const initialState = {
      appliances: initialAppliances,
      candidates: initialCandidates,
      reminders: initialReminders,
      selectedApplianceId: initialAppliances[0]?.id || null,
      storeInitialized: true,
    };
    set(initialState);
  },
}));

function mergeReminders(
  existing: Reminder[],
  generated: Reminder[]
): Reminder[] {
  const existingMap = new Map(existing.map((r) => [r.id, r]));
  return generated.map((g) => {
    const existingReminder = existingMap.get(g.id);
    if (existingReminder) {
      return {
        ...g,
        isRead: existingReminder.isRead,
        enabled: existingReminder.enabled,
      };
    }
    return g;
  });
}

function persistState(state: ApplianceStore) {
  const data: PersistedData = {
    appliances: state.appliances,
    candidates: state.candidates,
    reminders: state.reminders,
    selectedApplianceId: state.selectedApplianceId,
    isInitialized: state.storeInitialized,
  };
  saveToStorage(data);
}
