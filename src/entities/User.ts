import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { ChatMembers } from "./ChatMembers";
import { Reader } from "./Reader";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column({
    default:
      "https://socketio-backend.s3.eu-north-1.amazonaws.com/0/profilePic/load.jpg",
  })
  profilePicUrl: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChatMembers, (chatmembers) => chatmembers.user)
  chats: ChatMembers[];

  @OneToMany(() => Reader, (reader) => reader.reader)
  readMessages: Reader[];
}
