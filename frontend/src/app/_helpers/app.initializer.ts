import { catchError, of } from 'rxjs';
import { AccountService } from '@app/_services';

export function appInitializer(accountService: AccountService) {
    return () => accountService.refreshToken()
        .pipe(
            // catch error to start app on success or failure
            // of(true) emits a value to ensure APP_INITIALIZER resolves
            catchError(() => of(true))
        );
}
