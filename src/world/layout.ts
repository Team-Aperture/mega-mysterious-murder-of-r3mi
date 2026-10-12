/**
 * Flight 303 cabin layout, world units (1080p reference, 400 units = 1 m), y = 0 is the aisle
 * floor (the stage floor, closest to the camera). Seats face LEFT (towards the cockpit), so row
 * numbers grow to the right. Only the aisle seats (C) are fully drawn; window and middle seats
 * are implied behind them.
 */
export const ROW_PITCH = 300;
/** Floor line of the seat block (a little "further back" than the aisle). */
export const SEAT_FLOOR = -40;
/** x of the rear edge of row n's backrest. */
export const rowX = (n: number): number => (n - 14) * ROW_PITCH;
export const ROWS = [10, 11, 12, 13, 14, 15, 16, 17];

export const CABIN = {
  left: -1650,
  right: 2140,
  ceiling: -980,
  binBottom: -704,
  binTop: -884,
  windowY: -566,
  /** Front bulkhead with curtain and the route screen. */
  bulkhead: -1560,
  /** Galley curtain, galley, exit door, lavatory. */
  galleyCurtain: 1010,
  trolley: 1190,
  coffeeMaker: 1330,
  exitDoor: 1560,
  lavDoor: 1900,
} as const;

/** Where characters stand or sit in the story (aisle x positions). */
export const MARK = {
  ichStart: 1905,
  ichEnter: 1760,
  meetIch: 230,
  meetR3mi: -60,
  meetVtgm: -330,
  seatR3mi: rowX(14),
  seatVtgm: rowX(13),
  seatIch: rowX(15),
} as const;

/** Reading lights that are on (row → intensity). */
export const READING_LIGHTS: Record<number, number> = { 11: 0.9, 16: 0.75 };
