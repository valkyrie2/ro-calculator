import { EnvironmentModel } from './environment.model';
import { supabaseSecrets } from './supabase.secrets';

export const environment: EnvironmentModel = {
  production: true,
  surveyUrl: 'https://forms.gle/TRDtvj5MEK2gWsE29',
  issueTrackingUrl:
    'https://docs.google.com/spreadsheets/d/1Zq9dkejS4d-kjUQ1kbSAmR0im7Hw5onfGEs7gLZ3vY4/edit?usp=sharing',
  youtubeVideoUrl: 'https://www.youtube.com/watch?v=ec5U-ZxvoFM&list=PLJi-aEFx61gw97he4dSOWP5-fADXegbyH&index=1&t',
  supabase: supabaseSecrets,
};
