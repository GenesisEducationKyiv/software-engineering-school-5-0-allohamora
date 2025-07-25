// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.7.5
//   protoc               unknown
// source: email.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import type { CallContext, CallOptions } from "nice-grpc-common";
import { Empty } from "./google/protobuf/empty.js";

export const protobufPackage = "email";

export interface SendSubscribeEmailRequest {
  to: string[];
  city: string;
  confirmationLink: string;
}

export interface SendWeatherUpdateEmailRequest {
  to: string[];
  city: string;
  unsubscribeLink: string;
  temperature: number;
  humidity: number;
  description: string;
}

function createBaseSendSubscribeEmailRequest(): SendSubscribeEmailRequest {
  return { to: [], city: "", confirmationLink: "" };
}

export const SendSubscribeEmailRequest: MessageFns<SendSubscribeEmailRequest> = {
  encode(message: SendSubscribeEmailRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    for (const v of message.to) {
      writer.uint32(10).string(v!);
    }
    if (message.city !== "") {
      writer.uint32(18).string(message.city);
    }
    if (message.confirmationLink !== "") {
      writer.uint32(26).string(message.confirmationLink);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): SendSubscribeEmailRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendSubscribeEmailRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.to.push(reader.string());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.city = reader.string();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.confirmationLink = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SendSubscribeEmailRequest {
    return {
      to: globalThis.Array.isArray(object?.to) ? object.to.map((e: any) => globalThis.String(e)) : [],
      city: isSet(object.city) ? globalThis.String(object.city) : "",
      confirmationLink: isSet(object.confirmationLink) ? globalThis.String(object.confirmationLink) : "",
    };
  },

  toJSON(message: SendSubscribeEmailRequest): unknown {
    const obj: any = {};
    if (message.to?.length) {
      obj.to = message.to;
    }
    if (message.city !== "") {
      obj.city = message.city;
    }
    if (message.confirmationLink !== "") {
      obj.confirmationLink = message.confirmationLink;
    }
    return obj;
  },

  create(base?: DeepPartial<SendSubscribeEmailRequest>): SendSubscribeEmailRequest {
    return SendSubscribeEmailRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<SendSubscribeEmailRequest>): SendSubscribeEmailRequest {
    const message = createBaseSendSubscribeEmailRequest();
    message.to = object.to?.map((e) => e) || [];
    message.city = object.city ?? "";
    message.confirmationLink = object.confirmationLink ?? "";
    return message;
  },
};

function createBaseSendWeatherUpdateEmailRequest(): SendWeatherUpdateEmailRequest {
  return { to: [], city: "", unsubscribeLink: "", temperature: 0, humidity: 0, description: "" };
}

export const SendWeatherUpdateEmailRequest: MessageFns<SendWeatherUpdateEmailRequest> = {
  encode(message: SendWeatherUpdateEmailRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    for (const v of message.to) {
      writer.uint32(10).string(v!);
    }
    if (message.city !== "") {
      writer.uint32(18).string(message.city);
    }
    if (message.unsubscribeLink !== "") {
      writer.uint32(26).string(message.unsubscribeLink);
    }
    if (message.temperature !== 0) {
      writer.uint32(33).double(message.temperature);
    }
    if (message.humidity !== 0) {
      writer.uint32(41).double(message.humidity);
    }
    if (message.description !== "") {
      writer.uint32(50).string(message.description);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): SendWeatherUpdateEmailRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendWeatherUpdateEmailRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.to.push(reader.string());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.city = reader.string();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.unsubscribeLink = reader.string();
          continue;
        }
        case 4: {
          if (tag !== 33) {
            break;
          }

          message.temperature = reader.double();
          continue;
        }
        case 5: {
          if (tag !== 41) {
            break;
          }

          message.humidity = reader.double();
          continue;
        }
        case 6: {
          if (tag !== 50) {
            break;
          }

          message.description = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SendWeatherUpdateEmailRequest {
    return {
      to: globalThis.Array.isArray(object?.to) ? object.to.map((e: any) => globalThis.String(e)) : [],
      city: isSet(object.city) ? globalThis.String(object.city) : "",
      unsubscribeLink: isSet(object.unsubscribeLink) ? globalThis.String(object.unsubscribeLink) : "",
      temperature: isSet(object.temperature) ? globalThis.Number(object.temperature) : 0,
      humidity: isSet(object.humidity) ? globalThis.Number(object.humidity) : 0,
      description: isSet(object.description) ? globalThis.String(object.description) : "",
    };
  },

  toJSON(message: SendWeatherUpdateEmailRequest): unknown {
    const obj: any = {};
    if (message.to?.length) {
      obj.to = message.to;
    }
    if (message.city !== "") {
      obj.city = message.city;
    }
    if (message.unsubscribeLink !== "") {
      obj.unsubscribeLink = message.unsubscribeLink;
    }
    if (message.temperature !== 0) {
      obj.temperature = message.temperature;
    }
    if (message.humidity !== 0) {
      obj.humidity = message.humidity;
    }
    if (message.description !== "") {
      obj.description = message.description;
    }
    return obj;
  },

  create(base?: DeepPartial<SendWeatherUpdateEmailRequest>): SendWeatherUpdateEmailRequest {
    return SendWeatherUpdateEmailRequest.fromPartial(base ?? {});
  },
  fromPartial(object: DeepPartial<SendWeatherUpdateEmailRequest>): SendWeatherUpdateEmailRequest {
    const message = createBaseSendWeatherUpdateEmailRequest();
    message.to = object.to?.map((e) => e) || [];
    message.city = object.city ?? "";
    message.unsubscribeLink = object.unsubscribeLink ?? "";
    message.temperature = object.temperature ?? 0;
    message.humidity = object.humidity ?? 0;
    message.description = object.description ?? "";
    return message;
  },
};

export type EmailServiceDefinition = typeof EmailServiceDefinition;
export const EmailServiceDefinition = {
  name: "EmailService",
  fullName: "email.EmailService",
  methods: {
    sendSubscribeEmail: {
      name: "SendSubscribeEmail",
      requestType: SendSubscribeEmailRequest,
      requestStream: false,
      responseType: Empty,
      responseStream: false,
      options: {},
    },
    sendWeatherUpdateEmail: {
      name: "SendWeatherUpdateEmail",
      requestType: SendWeatherUpdateEmailRequest,
      requestStream: false,
      responseType: Empty,
      responseStream: false,
      options: {},
    },
  },
} as const;

export interface EmailServiceImplementation<CallContextExt = {}> {
  sendSubscribeEmail(
    request: SendSubscribeEmailRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<Empty>>;
  sendWeatherUpdateEmail(
    request: SendWeatherUpdateEmailRequest,
    context: CallContext & CallContextExt,
  ): Promise<DeepPartial<Empty>>;
}

export interface EmailServiceClient<CallOptionsExt = {}> {
  sendSubscribeEmail(
    request: DeepPartial<SendSubscribeEmailRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<Empty>;
  sendWeatherUpdateEmail(
    request: DeepPartial<SendWeatherUpdateEmailRequest>,
    options?: CallOptions & CallOptionsExt,
  ): Promise<Empty>;
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

export interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create(base?: DeepPartial<T>): T;
  fromPartial(object: DeepPartial<T>): T;
}
