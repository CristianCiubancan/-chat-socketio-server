import { User } from "src/entities/User";

export class FieldError {
  field: string;
  message: string;
}

export class UserResponse {
  errors?: FieldError[];
  user?: User;
}
