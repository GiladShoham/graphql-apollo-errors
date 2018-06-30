// Type definitions for `graphql-apollo-errors`
// Project: https://github.com/GiladShoham/graphql-apollo-errors
// Definitions by: Keith Gillette <https://github.com/KeithGillette>

export function formatErrorGenerator(options: FormatErrorOptions): FormatErrorFunction;

export interface ArgumentDefinition {
  name: string;
  order: number;
  default: string | Function | null | undefined;
}

export interface ErrorResult {
  isBoom: boolean;
  isServer: boolean;
  message: string;
  data: any;
  output: {
    statusCode: number;
    payload: ErrorPayload
  };
}

export interface ErrorPayload {
  statusCode: number;
  error: string;
  message: string;
  errorName?: string;
  timeThrown?: string;
  guid?: string;

  [key: string]: any;

  data: any;
}

export interface FormatErrorOptions {
  logger?: Function;
  publicDataPath?: string;
  showLocations?: boolean;
  showPath?: boolean;
  hideSensitiveData?: boolean;
  hooks?: {
    onOriginalError?: (originalError: any) => void;
    onProcessedError?: (processedError: any) => void;
    onFinalError?: (finalError: any) => void;
  };
  nonBoomTransformer?: (error: any) => ErrorResult;
}

export interface FormatErrorFunction {
  (graphQLError: any): any;
}

export declare module SevenBoom {

  export function init(argsDefs: ArgumentDefinition[]): void;

  export function wrap(errorMessage?: string, errorData?: any): ErrorResult;

  export function create(statusCode: number, errorMessage?: string, errorData?: any): ErrorResult;

  export function badRequest(errorMessage?: string, errorData?: any): ErrorResult;

  export function unauthorized(errorMessage: string, scheme?: string | string[], attributes?: { [key: string]: any }): ErrorResult;

  export function paymentRequired(errorMessage?: string, errorData?: any): ErrorResult;

  export function forbidden(errorMessage?: string, errorData?: any): ErrorResult;

  export function notFound(errorMessage?: string, errorData?: any): ErrorResult;

  export function methodNotAllowed(errorMessage?: string, errorData?: any, allow?: string | string[]): ErrorResult;

  export function notAcceptable(errorMessage?: string, errorData?: any): ErrorResult;

  export function proxyAuthRequired(errorMessage?: string, errorData?: any): ErrorResult;

  export function clientTimeout(errorMessage?: string, errorData?: any): ErrorResult;

  export function conflict(errorMessage?: string, errorData?: any): ErrorResult;

  export function resourceGone(errorMessage?: string, errorData?: any): ErrorResult;

  export function lengthRequired(errorMessage?: string, errorData?: any): ErrorResult;

  export function preconditionFailed(errorMessage?: string, errorData?: any): ErrorResult;

  export function entityTooLarge(errorMessage?: string, errorData?: any): ErrorResult;

  export function uriTooLong(errorMessage?: string, errorData?: any): ErrorResult;

  export function unsupportedMediaType(errorMessage?: string, errorData?: any): ErrorResult;

  export function rangeNotSatisfiable(errorMessage?: string, errorData?: any): ErrorResult;

  export function expectationFailed(errorMessage?: string, errorData?: any): ErrorResult;

  export function teapot(errorMessage?: string, errorData?: any): ErrorResult;

  export function badData(errorMessage?: string, errorData?: any): ErrorResult;

  export function locked(errorMessage?: string, errorData?: any): ErrorResult;

  export function preconditionRequired(errorMessage?: string, errorData?: any): ErrorResult;

  export function tooManyRequests(errorMessage?: string, errorData?: any): ErrorResult;

  export function illegal(errorMessage?: string, errorData?: any): ErrorResult;

  export function badImplementation(errorMessage?: string, errorData?: any): ErrorResult;

  export function notImplemented(errorMessage?: string, errorData?: any): ErrorResult;

  export function badGateway(errorMessage?: string, errorData?: any): ErrorResult;

  export function serverUnavailable(errorMessage?: string, errorData?: any): ErrorResult;

  export function gatewayTimeout(errorMessage?: string, errorData?: any): ErrorResult;

}
