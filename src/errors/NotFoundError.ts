import { BaseAppError } from "./base/baseAppError"

export class NotFoundError extends BaseAppError {
  constructor(message: string, cause?: unknown) {
    super(message)
    this.code = 404
    this.name = "NotFoundError"
    this.cause = cause
  }
}