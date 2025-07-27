export type Messages = {
  ['send-subscribe-email']: {
    to: string[];
    city: string;
    confirmationLink: string;
  };
  ['send-weather-update-email']: {
    to: string[];
    city: string;
    unsubscribeLink: string;
    temperature: number;
    humidity: number;
    description: string;
  };
};
