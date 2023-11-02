export type LoaderState = 'initial' | 'idle' | 'pending' | 'success' | 'error';

export class LoaderMetadata {
    timestamp: number | undefined = undefined;
    cached? = false;
    constructor(metadata?: Partial<LoaderMetadata>) {
        Object.assign(this, {...this, metadata});
    }
}

export class LoaderResult<Result, ErrorType extends Error = Error> {
    state: LoaderState = 'initial';
    value: Result | undefined = undefined;
    error: ErrorType | undefined = undefined;
    metadata = new LoaderMetadata();

    constructor(loaderResult?: Partial<LoaderResult<Result, ErrorType>>) {
        Object.assign(this, {...this, ...loaderResult});
    }
};