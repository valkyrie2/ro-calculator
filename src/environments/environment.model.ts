export interface EnvironmentModel {
  production: boolean;
  surveyUrl: string;
  issueTrackingUrl?: string;
  youtubeVideoUrl: string;
  supabase: {
    url: string;
    anonKey: string;
  };
}
