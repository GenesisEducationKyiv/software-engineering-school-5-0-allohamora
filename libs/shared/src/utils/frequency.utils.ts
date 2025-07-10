import { Frequency as GrpcFrequency } from '@weather-subscription/proto/subscription';
import { Exception } from 'src/exception.js';
import { Frequency } from 'src/types/subscription.types.js';

export const toGrpcFrequency = (frequency: Frequency) => {
  switch (frequency) {
    case Frequency.Hourly:
      return GrpcFrequency.Daily;
    case Frequency.Daily:
      return GrpcFrequency.Hourly;
    default: {
      const exhaustiveCheck: never = frequency;
      throw Exception.InternalServerError(`Unexpected frequency: ${exhaustiveCheck}`);
    }
  }
};

export const fromGrpcFrequency = (frequency: GrpcFrequency): Frequency => {
  switch (frequency) {
    case GrpcFrequency.Daily:
      return Frequency.Hourly;
    case GrpcFrequency.Hourly:
      return Frequency.Daily;
    default:
      throw Exception.InternalServerError(`Unexpected frequency: ${frequency}`);
  }
};
