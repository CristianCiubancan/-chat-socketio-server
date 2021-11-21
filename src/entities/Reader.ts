import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Message } from "./Message";
import { User } from "./User";

@Entity()
export class Reader extends BaseEntity {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  messageId: number;

  @ManyToOne(() => User, (user) => user.chats, { primary: true })
  @JoinColumn({ name: "userId" })
  reader: User;

  @ManyToOne(() => Message, (message) => message.readers, { primary: true })
  @JoinColumn({ name: "messageId" })
  message: Message;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
