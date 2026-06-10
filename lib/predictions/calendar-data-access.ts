export type CalendarModalOpenOptions = {
  fromDataAccess?: boolean;
  reopenDataAccess?: () => void;
};

export type CalendarModalOpener = (options?: CalendarModalOpenOptions) => void;
