import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LoaderState } from '../sample/loader';

type LoaderContainerDirectiveContext<
  Result,
  Error = unknown,
  LS extends LoaderState<Result, Error> = LoaderState<Result, Error>
> = {
  $implicit: Result | undefined;
  value: Result | undefined;
  ngxLoaderContainer: Result | undefined;
  state: LS['state'];
  error: Error | null;
  metadata: LS['metadata'];
};

const defaultContext: LoaderContainerDirectiveContext<any> = {
  $implicit: undefined,
  ngxLoaderContainer: undefined,
  value: undefined,
  state: 'idle',
  error: null,
  metadata: {
    timestamp: undefined,
  },
};

@Directive({
  selector: '[ngxLoaderContainer]',
  standalone: true,
})
export class LoaderContainerDirective<Result, Error = unknown> {
  @Input('ngxLoaderContainer')
  set loader(value: Observable<LoaderState<Result, Error>>) {
    this.listenToLoaderState(value);
  }

  statusSubscription?: Subscription;

  private context: LoaderContainerDirectiveContext<Result> = defaultContext;

  private readonly tpl =
    inject<TemplateRef<LoaderContainerDirectiveContext<Result, Error>>>(
      TemplateRef
    );
  private readonly vcr = inject(ViewContainerRef);

  private listenToLoaderState(obs: Observable<LoaderState<Result, Error>>) {
    this.statusSubscription?.unsubscribe();
    this.statusSubscription = obs.subscribe((state) => {
      this.handleNewState(state);
    });
  }

  private handleNewState(state: LoaderState<Result, Error>) {
    this.context = {
      $implicit: state.value,
      ngxLoaderContainer: state.value,
      value: state.value,
      error: state.error,
      state: state.state,
      metadata: state.metadata,
    };

    this.vcr.clear();
    this.vcr.createEmbeddedView(this.tpl, this.context);
  }

  static ngTemplateContextGuard<Result, Error = unknown>(
    dir: LoaderContainerDirective<Result, Error>,
    ctx: unknown
  ): ctx is LoaderContainerDirectiveContext<Result, Error> {
    return true;
  }
}
