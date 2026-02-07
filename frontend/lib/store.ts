import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  FruitType,
  Act,
  Conversation,
  ConversationStatus,
  MatchResult,
  LLMMatchResponse,
  LLMErrorResponse,
  FruitAttributes,
  FruitPreferences,
  FruitCommunication,
} from "./types";
import { generateId } from "./utils";

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface OrchardState {
  // Conversation
  currentConversation: Conversation | null;
  currentAct: Act;
  conversationHistory: Conversation[];

  // UI
  isLoading: boolean;
  error: string | null;
  dashboardOpen: boolean;
  fruitTypeChoice: FruitType;

  // Actions
  startConversation: (fruitType: FruitType) => string;
  setConversationData: (
    id: string,
    fruit: {
      id: string;
      attributes: FruitAttributes;
      preferences: FruitPreferences;
      communication: FruitCommunication;
    },
    matches: MatchResult[],
    totalCandidates: number,
    llmExplanation: LLMMatchResponse | LLMErrorResponse | null
  ) => void;
  advanceAct: () => void;
  completeConversation: () => void;
  setError: (error: string | null) => void;
  toggleDashboard: () => void;
  setFruitTypeChoice: (type: FruitType) => void;
  reset: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  currentConversation: null as Conversation | null,
  currentAct: 1 as Act,
  conversationHistory: [] as Conversation[],
  isLoading: false,
  error: null as string | null,
  dashboardOpen: false,
  fruitTypeChoice: "apple" as FruitType,
};

// =============================================================================
// STORE
// =============================================================================

export const useOrchardStore = create<OrchardState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        startConversation: (fruitType: FruitType) => {
          const id = generateId();
          set({
            currentConversation: {
              id,
              fruitType,
              status: "fetching",
              fruit: null,
              matches: [],
              totalCandidates: 0,
              llmExplanation: null,
              createdAt: new Date().toISOString(),
            },
            currentAct: 1,
            isLoading: true,
            error: null,
          });
          return id;
        },

        setConversationData: (id, fruit, matches, totalCandidates, llmExplanation) => {
          const conv = get().currentConversation;
          if (!conv || conv.id !== id) return;

          const nextStatus: ConversationStatus =
            matches.length === 0 ? "complete" : "act1";

          set({
            currentConversation: {
              ...conv,
              status: nextStatus,
              fruit,
              matches,
              totalCandidates,
              llmExplanation,
            },
            isLoading: false,
          });
        },

        advanceAct: () => {
          const { currentAct, currentConversation: conv } = get();
          if (!conv) return;

          if (currentAct === 1) {
            set({
              currentAct: 2,
              currentConversation: { ...conv, status: "act2" },
            });
          } else if (currentAct === 2) {
            set({
              currentAct: 3,
              currentConversation: { ...conv, status: "act3" },
            });
          }
        },

        completeConversation: () => {
          const conv = get().currentConversation;
          if (!conv) return;

          const completed = { ...conv, status: "complete" as ConversationStatus };
          const history = [completed, ...get().conversationHistory].slice(0, 50);

          set({
            currentConversation: completed,
            conversationHistory: history,
          });
        },

        setError: (error) => {
          const conv = get().currentConversation;
          set({
            error,
            isLoading: false,
            currentConversation: conv
              ? { ...conv, status: "error" }
              : null,
          });
        },

        toggleDashboard: () => set((s) => ({ dashboardOpen: !s.dashboardOpen })),

        setFruitTypeChoice: (fruitTypeChoice) => set({ fruitTypeChoice }),

        reset: () => set({ ...initialState, conversationHistory: get().conversationHistory }),
      }),
      {
        name: "orchard-storage",
        partialize: (state) => ({
          conversationHistory: state.conversationHistory,
          fruitTypeChoice: state.fruitTypeChoice,
        }),
      }
    ),
    { name: "OrchardStore" }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

// Stable default references — never create new objects/arrays in selectors
const EMPTY_MATCHES: MatchResult[] = [];

export const selectCurrentFruit = (s: OrchardState) =>
  s.currentConversation?.fruit ?? null;

export const selectMatches = (s: OrchardState) =>
  s.currentConversation?.matches ?? EMPTY_MATCHES;

export const selectLLMExplanation = (s: OrchardState) =>
  s.currentConversation?.llmExplanation ?? null;

export const selectIsActive = (s: OrchardState) => {
  const status = s.currentConversation?.status;
  return (
    status === "fetching" ||
    status === "act1" ||
    status === "act2" ||
    status === "act3"
  );
};
