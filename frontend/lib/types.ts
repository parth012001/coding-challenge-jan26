// =============================================================================
// SHARED TYPES — mirrors backend types exactly
// =============================================================================

export type FruitType = "apple" | "orange";
export type ShineFactor = "dull" | "neutral" | "shiny" | "extraShiny";

export interface FruitAttributes {
  size: number | null;
  weight: number | null;
  hasStem: boolean | null;
  hasLeaf: boolean | null;
  hasWorm: boolean | null;
  shineFactor: ShineFactor | null;
  hasChemicals: boolean | null;
}

export interface NumberRange {
  min?: number;
  max?: number;
}

export interface FruitPreferences {
  size?: NumberRange;
  weight?: NumberRange;
  hasStem?: boolean;
  hasLeaf?: boolean;
  hasWorm?: boolean;
  shineFactor?: ShineFactor | ShineFactor[];
  hasChemicals?: boolean;
}

export interface FruitCommunication {
  attributes: string;
  preferences: string;
}

// =============================================================================
// SCORING TYPES
// =============================================================================

export interface AttributeScore {
  attribute: string;
  score: number; // 0.0 to 1.0
  weight: number;
  weightedScore: number;
  reason: string;
}

export interface MatchBreakdown {
  our: AttributeScore[];
  their: AttributeScore[];
}

export interface MatchResult {
  id: string;
  score: number; // mutual score 0-100
  ourScore: number;
  theirScore: number;
  attributes: FruitAttributes;
  preferences: FruitPreferences;
  breakdown: MatchBreakdown;
}

// =============================================================================
// LLM TYPES
// =============================================================================

export interface MatchExplanation {
  matchRank: number;
  matchId: string;
  overallSummary: string;
  whyTheyLikeYou: string;
  whyYouLikeThem: string;
  compatibilityHighlights: string[];
}

export interface LLMMatchResponse {
  introduction: string;
  explanations: MatchExplanation[];
  closingNote: string;
}

export interface LLMErrorResponse {
  error: string;
  fallbackExplanations: {
    matchRank: number;
    matchId: string;
    summary: string;
  }[];
}

export function isLLMError(
  response: LLMMatchResponse | LLMErrorResponse | null
): response is LLMErrorResponse {
  return response !== null && "error" in response && typeof (response as LLMErrorResponse).error === "string";
}

// =============================================================================
// EDGE FUNCTION TYPES
// =============================================================================

export interface EdgeFunctionResponse {
  success: true;
  apple?: {
    id: string;
    attributes: FruitAttributes;
    preferences: FruitPreferences;
    communication: FruitCommunication;
  };
  orange?: {
    id: string;
    attributes: FruitAttributes;
    preferences: FruitPreferences;
    communication: FruitCommunication;
  };
  matches: MatchResult[];
  totalCandidates: number;
  llmExplanation: LLMMatchResponse | LLMErrorResponse | null;
}

export interface EdgeFunctionError {
  error: string;
  details: string;
}

// =============================================================================
// CONVERSATION / UI STATE TYPES
// =============================================================================

export type Act = 1 | 2 | 3;

export type ConversationStatus =
  | "idle"
  | "fetching"
  | "act1"
  | "act2"
  | "act3"
  | "complete"
  | "error";

export interface Conversation {
  id: string;
  fruitType: FruitType;
  status: ConversationStatus;
  fruit: {
    id: string;
    attributes: FruitAttributes;
    preferences: FruitPreferences;
    communication: FruitCommunication;
  } | null;
  matches: MatchResult[];
  totalCandidates: number;
  llmExplanation: LLMMatchResponse | LLMErrorResponse | null;
  createdAt: string;
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface DashboardMetrics {
  totalApples: number;
  totalOranges: number;
  preferenceCoverage: Record<string, number>;
  dealbreakerRates: Record<string, number>;
}

export interface DashboardData {
  metrics: DashboardMetrics;
}

// =============================================================================
// COMPONENT PROP INTERFACES
// =============================================================================

export interface FruitAvatarProps {
  fruitType: FruitType;
  attributes: FruitAttributes;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export interface TypewriterBubbleProps {
  text: string;
  variant: "apple" | "orange" | "matchmaker";
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export interface MatchCardProps {
  match: MatchResult;
  rank: number;
  explanation?: MatchExplanation;
  delay?: number;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  description: string;
  accentColor?: string;
  compact?: boolean;
}
