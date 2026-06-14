import { create } from 'zustand';
import { Appliance, NewApplianceCandidate, Reminder } from '@/types';
import { mockAppliances, mockCandidates } from '@/data/mockData';
import { generateReminders, generateId, ReminderSettings, DEFAULT_REMINDER_SETTINGS } from '@/utils/calculator';

const STORAGE_KEY = 'appliance_decision_data_v1';

interface PersistedData {
  appliances: Appliance[];
  candidates: NewApplianceCandidate[];
  reminders: Reminder[];
  selectedApplianceId: string | null;
  reminderSettings: ReminderSettings;
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
  reminderSettings: ReminderSettings;

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
  updateReminderSetting: (key: keyof ReminderSettings, value: boolean) => void;

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
      reminderSettings: persisted.reminderSettings || DEFAULT_REMINDER_SETTINGS,
      storeInitialized: true,
    };
  }
  return {
    appliances: [],
    candidates: [],
    reminders: [],
    selectedApplianceId: null,
    reminderSettings: DEFAULT_REMINDER_SETTINGS,
    storeInitialized: false,
  };
};

const rebuildReminders = (
  appliances: Appliance[],
  existingReminders: Reminder[],
  settings: ReminderSettings
): Reminder[] => {
  const generated = generateReminders(appliances, settings);
  const disabledTypes = new Set<string>();
  if (!settings.warranty) disabledTypes.add('warranty');
  if (!settings.energy) disabledTypes.add('energy');
  if (!settings.repair) disabledTypes.add('repair');
  if (!settings.maintenance) disabledTypes.add('maintenance');

  const existingMap = new Map(existingReminders.map((r) => [r.id, r]));
  return generated.map((g) => {
    const existingReminder = existingMap.get(g.id);
    const isCategoryDisabled = disabledTypes.has(g.type);
    return {
      ...g,
      isRead: existingReminder ? existingReminder.isRead : false,
      enabled: existingReminder ? existingReminder.enabled : !isCategoryDisabled,
    };
  });
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
      const newReminders = rebuildReminders(
        newAppliances,
        state.reminders,
        state.reminderSettings
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
      const newReminders = rebuildReminders(
        newAppliances,
        state.reminders,
        state.reminderSettings
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
      const newReminders = rebuildReminders(
        newAppliances,
        state.reminders.filter((r) => r.applianceId !== id),
        state.reminderSettings
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
      const newReminders = rebuildReminders(
        state.appliances,
        state.reminders,
        state.reminderSettings
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

  updateReminderSetting: (key, value) => {
    set((state) => {
      const newSettings = { ...state.reminderSettings, [key]: value };
      const newReminders = rebuildReminders(
        state.appliances,
        state.reminders,
        newSettings
      );
      const newState = {
        reminderSettings: newSettings,
        reminders: newReminders,
      };
      persistState({ ...get(), ...newState });
      return newState;
    });
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
    const initialReminders = rebuildReminders(
      initialAppliances,
      [],
      DEFAULT_REMINDER_SETTINGS
    );
    const initialState = {
      appliances: initialAppliances,
      candidates: initialCandidates,
      reminders: initialReminders,
      selectedApplianceId: initialAppliances[0]?.id || null,
      reminderSettings: DEFAULT_REMINDER_SETTINGS,
      storeInitialized: true,
    };
    set(initialState);
    persistState({ ...get(), ...initialState });
  },

  resetToMock: () => {
    clearStorage();
    const initialAppliances = mockAppliances;
    const initialCandidates = mockCandidates;
    const initialReminders = rebuildReminders(
      initialAppliances,
      [],
      DEFAULT_REMINDER_SETTINGS
    );
    const initialState = {
      appliances: initialAppliances,
      candidates: initialCandidates,
      reminders: initialReminders,
      selectedApplianceId: initialAppliances[0]?.id || null,
      reminderSettings: DEFAULT_REMINDER_SETTINGS,
      storeInitialized: true,
    };
    set(initialState);
  },
}));

function persistState(state: ApplianceStore) {
  const data: PersistedData = {
    appliances: state.appliances,
    candidates: state.candidates,
    reminders: state.reminders,
    selectedApplianceId: state.selectedApplianceId,
    reminderSettings: state.reminderSettings,
    isInitialized: state.storeInitialized,
  };
  saveToStorage(data);
}
