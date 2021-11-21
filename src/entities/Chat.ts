import { Entity, PrimaryGeneratedColumn, BaseEntity, OneToMany } from "typeorm";
import { ChatMembers } from "./ChatMembers";
import { Message } from "./Message";

@Entity()
export class Chat extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => ChatMembers, (chatmembers) => chatmembers.chat)
  members: ChatMembers[];

  lastMessage: Message;

  @OneToMany(() => Message, (message) => message.chat, {
    nullable: true,
  })
  messages: Message[];
}
