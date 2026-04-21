export interface AnalysisResult {
  fluidity: number; // 0-100
  firmness: number; // 0-100
  gloss: number; // 0-100
  dullness: number; // 0-100
  score: number; // 0-100
  humorCopy: string;
  imagePrompt: string;
  charms: string[]; // e.g., ["fried chicken", "coffee"]
  environment: string; // e.g., "Beijing", "Cold"
}

export interface AppState {
  view: 'home' | 'analyzing' | 'result';
  inputs: {
    food: string;
    drink: string;
    sleep: string;
    location: string;
  };
  history: string[];
  result?: AnalysisResult;
  imageUrl?: string;
  error?: string;
}
