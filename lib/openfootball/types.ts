export type ParsedStadium = {
  externalKey: string;
  city: string;
  countryCode: string;
  stadiumName: string;
  timezoneOffset: string;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
};

export type ParsedTeam = {
  externalKey: string;
  name: string;
  fifaName: string | null;
  groupCode: string;
};

export type StageType = "group" | "matchday" | "knockout";

export type ParsedStage = {
  externalKey: string;
  stageType: StageType;
  name: string;
  sequence: number;
  groupCode: string | null;
};

export type ParsedMatch = {
  externalMatchId: string;
  matchNumber: number | null;
  groupCode: string | null;
  stageExternalKey: string;
  matchdayExternalKey: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamKey: string | null;
  awayTeamKey: string | null;
  kickoffIso: string;
  venueCity: string;
  homeGoals: number | null;
  awayGoals: number | null;
  sortOrder: number;
};

export type ParsedCalendarMatchday = {
  number: number;
  label: string;
  dateKey: string;
};

export type ParseFootballTxtResult = {
  competitionName: string;
  competitionYear: number;
  teams: ParsedTeam[];
  stages: ParsedStage[];
  calendarMatchdays: ParsedCalendarMatchday[];
  groupMatches: ParsedMatch[];
  fifaNameNotes: Record<string, string>;
};

export type ParseCupFinalsResult = {
  stages: ParsedStage[];
  knockoutMatches: ParsedMatch[];
};

export const COMPETITION_CODE = "WC2026";
export const COMPETITION_YEAR = 2026;
export const SOURCE_PATH = "2026--usa";
