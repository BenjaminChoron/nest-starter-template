import { Injectable } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { SendWelcomeEmailCommand } from '../commands/send-welcome-email.command';

@Injectable()
export class AuthSagas {
  @Saga()
  userRegistered = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(UserRegisteredEvent),
      delay(1000), // Wait 1 second before sending welcome email
      map(event => new SendWelcomeEmailCommand(event.email)),
    );
  };
}
