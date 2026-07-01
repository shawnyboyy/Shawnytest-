export class PoolExhaustedError extends Error {
  constructor(public readonly pool: string) {
    super(`Pool exhausted: ${pool}`);
    this.name = "PoolExhaustedError";
  }
}

export class InvalidPartnerError extends Error {
  constructor(message = "Invalid or unauthorized partner token") {
    super(message);
    this.name = "InvalidPartnerError";
  }
}

export class NoPlayTodayError extends Error {
  constructor(message = "No play today (weekend)") {
    super(message);
    this.name = "NoPlayTodayError";
  }
}

export class RoomNotFoundError extends Error {
  constructor(message = "Room not found") {
    super(message);
    this.name = "RoomNotFoundError";
  }
}
