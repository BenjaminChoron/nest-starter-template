import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Inject } from '@nestjs/common';
import { RegisterUserCommand } from '../register-user.command';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.value-object';
import { Password } from '../../../domain/value-objects/password.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import { UserRegisteredEvent } from 'src/modules/auth/domain/events/user-registered.event';
import { EmailAlreadyExistsException } from '../../../domain/exceptions/email-already-exists.exception';
import { RegisterResponseDto } from '../../../application/dtos/register-response.dto';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterResponseDto> {
    try {
      const existingUser = await this.userRepository.findByEmail(command.email);

      if (existingUser) {
        throw new EmailAlreadyExistsException(command.email);
      }

      const email = Email.create(command.email);
      const password = await Password.create(command.password);
      const id = UserId.create(crypto.randomUUID());

      const user = User.create({
        id,
        email,
        password,
      });

      await this.userRepository.save(user);

      this.eventBus.publish(
        new UserRegisteredEvent(user.getId(), user.getEmail()),
      );

      return {
        id: user.getId(),
        email: user.getEmail(),
        isEmailVerified: user.isEmailVerified(),
      };
    } catch (error) {
      if (error instanceof EmailAlreadyExistsException) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
