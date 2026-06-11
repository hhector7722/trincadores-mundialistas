export type CalendarModalOpenOptions = {
  fromDataAccess?: boolean;
  reopenDataAccess?: () => void;
  stackElevated?: boolean;
};

export type CalendarModalOpener = (options?: CalendarModalOpenOptions) => void;
