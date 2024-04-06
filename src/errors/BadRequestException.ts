import { BaseAppError } from "./base/BaseAppError";

export class BadRequestException extends BaseAppError {
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = "BadRequestException"
    this.cause = cause
    this.code = 400
  }
}