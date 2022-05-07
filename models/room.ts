import { createHash } from "../deps.ts";

export class Room {
  id: string;

  /**
   * 6 digits passcode hash
   */
  hash: string;

  /**
   * the sender's uid
   */
  sender: string;

  /**
   * the receiver's uid
   */
  receiver?: string;

  /**
   * @param salt 6 digits salt
   */
  constructor(sender: string, salt: string) {
    this.id = Math.random().toString().slice(2, 8);

    this.hash = createHash("sha256").update(this.id + salt).toString();

    this.sender = sender;
  }

  setReceiver(receiver: string) {
    this.receiver = receiver;
  }
}
